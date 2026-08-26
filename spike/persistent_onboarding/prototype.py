"""Disabled-by-default persistent spoken-onboarding technical spike."""

from __future__ import annotations

import os
from typing import Any

import streamlit as st

from .component import COMPONENT_KEY, mount_controller
from .manifest import encoded_audio, instruction, load_manifest
from .state_machine import (
    SetupStage,
    SpeechMode,
    advance,
    event_matches_playback,
    make_command_ids,
    sanitize_player_event,
)


FEATURE_FLAG = "ACCESS_AI_PERSISTENT_SPEECH_SPIKE"
GUIDANCE_OPTIONS = {
    "Continue Access AI spoken guidance": SpeechMode.ACCESS_AI,
    "Screen-reader-only operation": SpeechMode.SCREEN_READER_ONLY,
}
SESSION_DEFAULTS = {
    "spike_setup_stage": SetupStage.WELCOME.value,
    "spike_speech_mode": SpeechMode.ACCESS_AI.value,
    "spike_command_sequence": 0,
    "spike_command_id": None,
    "spike_playback_id": None,
    "spike_command_instruction": None,
    "spike_processed_player_events": [],
    "spike_playback_diagnostics": [],
    "spike_guidance_choice": "Continue Access AI spoken guidance",
}


def feature_enabled() -> bool:
    return os.getenv(FEATURE_FLAG, "").strip().lower() in {"1", "true", "yes", "on"}


def _initialize_state() -> None:
    for key, value in SESSION_DEFAULTS.items():
        if key not in st.session_state:
            st.session_state[key] = value.copy() if isinstance(value, list) else value


def _stage() -> SetupStage:
    return SetupStage(st.session_state.spike_setup_stage)


def _speech_mode() -> SpeechMode:
    return SpeechMode(st.session_state.spike_speech_mode)


def _clear_command() -> None:
    st.session_state.spike_command_id = None
    st.session_state.spike_playback_id = None
    st.session_state.spike_command_instruction = None


def _issue_command(*, force: bool = False) -> None:
    stage = _stage()
    # The initial mode defaults to Access AI speech, so welcome is attempted.
    # An explicit Stop voice action must suppress every later command, including
    # a welcome command recreated by a Streamlit rerun.
    should_speak = _speech_mode() is SpeechMode.ACCESS_AI
    if not should_speak:
        return
    if not force and st.session_state.spike_command_instruction == stage.value:
        return

    st.session_state.spike_command_sequence += 1
    command_id, playback_id = make_command_ids(
        load_manifest()["manifest_id"],
        stage.value,
        st.session_state.spike_command_sequence,
    )
    st.session_state.spike_command_id = command_id
    st.session_state.spike_playback_id = playback_id
    st.session_state.spike_command_instruction = stage.value


def _remember_diagnostic(event: Any) -> dict[str, str] | None:
    sanitized = sanitize_player_event(event)
    if sanitized is None:
        return None
    processed = st.session_state.spike_processed_player_events
    if sanitized["event_id"] in processed:
        return None
    processed.append(sanitized["event_id"])
    del processed[:-100]
    st.session_state.spike_playback_diagnostics.append(sanitized)
    del st.session_state.spike_playback_diagnostics[:-50]
    return sanitized


def _process_player_event(event: Any) -> bool:
    sanitized = _remember_diagnostic(event)
    if sanitized is None:
        return False

    name = sanitized.get("name")
    if (
        name == "play_ended"
        and _stage() is SetupStage.WELCOME
        and st.session_state.spike_playback_id
        and event_matches_playback(
            sanitized,
            SetupStage.WELCOME.value,
            st.session_state.spike_playback_id,
        )
    ):
        st.session_state.spike_setup_stage = advance(SetupStage.WELCOME).value
        _clear_command()
        return True
    return False


def _component_state_value(name: str, default=None):
    component_state = st.session_state.get(COMPONENT_KEY, {})
    if isinstance(component_state, dict):
        return component_state.get(name, default)
    return getattr(component_state, name, default)


def _process_diagnostics(events: Any) -> bool:
    changed = False
    if isinstance(events, list):
        for event in events:
            changed = _process_player_event(event) or changed
    return changed


def _apply_component_speech_mode(value: Any) -> bool:
    try:
        mode = SpeechMode(value)
    except (TypeError, ValueError):
        return False
    if mode is _speech_mode():
        return False

    st.session_state.spike_speech_mode = mode.value
    if mode is SpeechMode.SCREEN_READER_ONLY:
        st.session_state.spike_guidance_choice = "Screen-reader-only operation"
    else:
        st.session_state.spike_guidance_choice = "Continue Access AI spoken guidance"
        # Reuse the retained command on same-step restore. If setup advanced
        # while muted, _enter_next_stage cleared it and this creates one fresh
        # command for the current instruction.
        _issue_command()
    return True


def _on_diagnostics_change() -> None:
    _process_diagnostics(_component_state_value("diagnostics", []))


def _on_speech_mode_change() -> None:
    _apply_component_speech_mode(_component_state_value("speech_mode"))


def _sync_guidance_choice() -> None:
    if _stage() is not SetupStage.SPEECH_MODE:
        return
    choice = st.session_state.spike_guidance_choice
    selected_mode = GUIDANCE_OPTIONS[choice]
    if selected_mode is not _speech_mode():
        st.session_state.spike_speech_mode = selected_mode.value
        if selected_mode is SpeechMode.ACCESS_AI:
            _issue_command()


def _component_data() -> dict[str, str | bool]:
    stage = _stage()
    item = instruction(stage.value)
    command_id = st.session_state.spike_command_id
    return {
        "manifest_id": load_manifest()["manifest_id"],
        "instruction_id": stage.value,
        "visible_text": item["visible_text"],
        "speech_mode": _speech_mode().value,
        "command_id": command_id or "",
        "playback_id": st.session_state.spike_playback_id or "",
        "audio_format": load_manifest()["audio_format"],
        "audio_b64": encoded_audio(stage.value) if command_id else "",
        "first_screen": stage is SetupStage.WELCOME,
    }


def _enter_next_stage() -> None:
    st.session_state.spike_setup_stage = advance(_stage()).value
    _clear_command()
    st.rerun()


def render_persistent_onboarding() -> None:
    """Render the isolated setup prototype and stop the surrounding app."""
    _initialize_state()
    _sync_guidance_choice()
    _issue_command()

    # Keep the page title and current step heading first in document order.
    # The persistent controller follows them and owns the single visible copy
    # of the manifest instruction text.
    stage = _stage()
    item = instruction(stage.value)
    st.title("🔊 Welcome to Access AI")
    st.caption(
        "Persistent spoken-onboarding technical spike. "
        "The production onboarding remains available when the feature flag is off."
    )
    st.header(item["title"])

    result = mount_controller(
        _component_data(),
        on_diagnostics_change=_on_diagnostics_change,
        on_speech_mode_change=_on_speech_mode_change,
    )
    changed = _apply_component_speech_mode(getattr(result, "speech_mode", None))
    changed = _process_diagnostics(getattr(result, "diagnostics", [])) or changed
    if changed:
        st.rerun()

    with st.expander("Prototype playback diagnostics"):
        diagnostics = list(st.session_state.spike_playback_diagnostics)
        if diagnostics:
            st.json(diagnostics)
        else:
            st.caption("No playback events have been recorded yet.")

    if stage is SetupStage.WELCOME:
        st.info(
            "Access AI is attempting the welcome automatically. If the browser "
            "blocks it, use the full-screen tap or keyboard control."
        )
        st.stop()

    if stage is SetupStage.SPEECH_MODE:
        st.radio(
            "Setup guidance",
            list(GUIDANCE_OPTIONS),
            key="spike_guidance_choice",
        )
        if st.button("Continue", type="primary", key="spike_continue_guidance"):
            _sync_guidance_choice()
            _enter_next_stage()
        st.stop()

    if stage is SetupStage.VISION:
        st.radio(
            "Vision preference",
            [
                "Blind",
                "Severe low vision",
                "Low vision",
                "Sighted caregiver",
                "Prefer not to say",
            ],
            key="vision",
        )
        if st.button("Continue", type="primary", key="spike_continue_vision"):
            _enter_next_stage()
        st.stop()

    if stage is SetupStage.INTERACTION:
        st.radio(
            "Primary interaction preference",
            [
                "Voice first",
                "Screen reader and keyboard",
                "Refreshable Braille display",
                "Large text",
                "Combination",
            ],
            key="interaction",
        )
        if st.button("Continue", type="primary", key="spike_continue_interaction"):
            _enter_next_stage()
        st.stop()

    if stage is SetupStage.DEVICE:
        st.selectbox(
            "Platform or screen reader",
            [
                "Android / TalkBack",
                "iPhone / VoiceOver",
                "Windows / NVDA",
                "Windows / JAWS",
                "Mac / VoiceOver",
                "Other / Not sure",
            ],
            key="platform",
        )
        st.checkbox("Automatically speak answers", key="auto_speak")
        st.selectbox(
            "Answer style",
            ["Step-by-step", "Short and direct", "Detailed", "Conversational"],
            key="detail",
        )
        if st.button("Finish setup", type="primary", key="spike_finish_setup"):
            _enter_next_stage()
        st.stop()

    if st.button("Open Access AI", type="primary", key="spike_open_app"):
        st.session_state.onboarded = True
        st.rerun()
    st.stop()
