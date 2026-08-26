"""Offline tests for the disabled persistent spoken-onboarding spike."""

import base64
import hashlib
import json
from pathlib import Path
import sys

import pytest
from streamlit.testing.v1 import AppTest

from spike.persistent_onboarding.manifest import (
    MANIFEST_PATH,
    REQUIRED_INSTRUCTION_IDS,
    encoded_audio,
    load_manifest,
)
from spike.persistent_onboarding.state_machine import (
    SetupStage,
    advance,
    event_matches_playback,
    make_command_ids,
    sanitize_player_event,
)


REPO_ROOT = Path(__file__).parents[1]
APP_PATH = REPO_ROOT / "app.py"
CONTROLLER_JS = REPO_ROOT / "spike" / "persistent_onboarding" / "controller.js"
CONTROLLER_HTML = REPO_ROOT / "spike" / "persistent_onboarding" / "controller.html"
PROTOTYPE_PY = REPO_ROOT / "spike" / "persistent_onboarding" / "prototype.py"

VISION_INSTRUCTION = (
    "Step one of three. Vision. If TalkBack or VoiceOver is turned on, swipe "
    "right to move to the next item, swipe left to move to the previous item, "
    "and double-tap anywhere to activate the focused item. For recommended "
    "blind settings, activate Use recommended blind settings. To choose settings "
    "individually, activate Customize accessibility settings."
)


def spike_app(monkeypatch):
    monkeypatch.setenv("ACCESS_AI_PERSISTENT_SPEECH_SPIKE", "1")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    # Each AppTest instance owns a separate V2 component registry. Reload only
    # the registration modules so this test helper mirrors a fresh app process.
    sys.modules.pop("spike.persistent_onboarding.prototype", None)
    sys.modules.pop("spike.persistent_onboarding.component", None)
    return AppTest.from_file(APP_PATH).run(timeout=30)


def send_v2_event(app, event):
    app.session_state["persistent_spoken_setup_controller_v1"] = {
        "diagnostics": [event],
        "speech_mode": app.session_state["spike_speech_mode"],
    }
    return app.run(timeout=30)


def send_v2_speech_mode(app, speech_mode):
    app.session_state["persistent_spoken_setup_controller_v1"] = {
        "diagnostics": [],
        "speech_mode": speech_mode,
    }
    return app.run(timeout=30)


def current_event(app, event_id, name, **overrides):
    event = {
        "event_id": event_id,
        "name": name,
        "instruction_id": app.session_state["spike_setup_stage"],
        "playback_id": app.session_state["spike_playback_id"] or "",
        "command_id": app.session_state["spike_command_id"] or "",
        "source": "offline_test",
    }
    event.update(overrides)
    return event


def app_at_vision(monkeypatch):
    app = spike_app(monkeypatch)
    send_v2_event(app, current_event(app, "welcome-ended-for-vision", "play_ended"))
    next(button for button in app.button if button.label == "Continue").click().run(
        timeout=30
    )
    assert app.session_state["spike_setup_stage"] == "vision"
    return app


def test_manifest_is_versioned_ordered_and_shared_with_static_audio():
    manifest = load_manifest()
    raw_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    assert manifest == raw_manifest
    assert manifest["schema_version"] == 1
    assert manifest["content_version"] == 2
    assert manifest["manifest_id"] == "access-ai-setup-v2"
    assert tuple(item["id"] for item in manifest["instructions"]) == (
        REQUIRED_INSTRUCTION_IDS
    )
    assert all(item["visible_text"] for item in manifest["instructions"])
    assert all(item["speech"] for item in manifest["instructions"])
    for item in manifest["instructions"]:
        audio = (MANIFEST_PATH.parent / item["audio_file"]).read_bytes()
        assert audio.startswith(b"RIFF")
        assert hashlib.sha256(audio).hexdigest() == item["audio_sha256"]
        assert base64.b64decode(encoded_audio(item["id"])) == audio


def test_versioned_vision_instruction_is_conditional_on_screen_reader_use():
    manifest = load_manifest()
    vision = next(item for item in manifest["instructions"] if item["id"] == "vision")

    assert vision["visible_text"] == VISION_INSTRUCTION
    assert vision["speech"] == VISION_INSTRUCTION
    assert "If TalkBack or VoiceOver is turned on" in vision["speech"]


def test_setup_state_machine_has_only_the_approved_forward_path():
    stage = SetupStage.WELCOME
    expected = [
        SetupStage.SPEECH_MODE,
        SetupStage.VISION,
        SetupStage.INTERACTION,
        SetupStage.DEVICE,
        SetupStage.COMPLETE,
    ]
    for next_stage in expected:
        stage = advance(stage)
        assert stage is next_stage
    with pytest.raises(ValueError):
        advance(SetupStage.RECOMMENDED_COMPLETE)


def test_playback_ids_are_monotonic_and_instruction_scoped():
    first = make_command_ids("access-ai-setup-v2", "welcome", 1)
    second = make_command_ids("access-ai-setup-v2", "vision", 2)

    assert first == (
        "access-ai-setup-v2:command:1",
        "access-ai-setup-v2:playback:welcome:1",
    )
    assert second[0] != first[0]
    assert second[1].endswith(":vision:2")


def test_named_diagnostics_are_redacted_and_unknown_events_are_rejected():
    event = {
        "event_id": "event-1",
        "name": "play_blocked",
        "instruction_id": "welcome",
        "playback_id": "playback-1",
        "command_id": "command-1",
        "source": "instruction_command",
        "error_name": "NotAllowedError",
        "message": "provider details must not survive",
        "stack": "private stack",
        "audio_b64": "private media",
    }

    sanitized = sanitize_player_event(event)

    assert sanitized == {
        "event_id": "event-1",
        "name": "play_blocked",
        "instruction_id": "welcome",
        "playback_id": "playback-1",
        "command_id": "command-1",
        "source": "instruction_command",
        "error_name": "NotAllowedError",
    }
    assert sanitize_player_event({"event_id": "x", "name": "unknown"}) is None
    assert event_matches_playback(sanitized, "welcome", "playback-1")


def test_feature_flag_off_does_not_mount_the_v2_spike(monkeypatch):
    monkeypatch.delenv("ACCESS_AI_PERSISTENT_SPEECH_SPIKE", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    app = AppTest.from_file(APP_PATH).run(timeout=30)

    assert not app.exception
    assert len(app.get("bidi_component")) == 0
    assert "spike_setup_stage" not in app.session_state


def test_feature_flag_mounts_one_persistent_v2_controller_without_api(monkeypatch):
    app = spike_app(monkeypatch)
    first_command = app.session_state["spike_command_id"]

    assert not app.exception
    assert len(app.get("bidi_component")) == 1
    assert len(app.get("component_instance")) == 0
    assert app.session_state["spike_setup_stage"] == "welcome"
    assert first_command == "access-ai-setup-v2:command:1"

    app.run(timeout=30)

    assert app.session_state["spike_command_id"] == first_command
    assert app.session_state["spike_command_sequence"] == 1


def test_welcome_end_advances_once_and_deduplicates_the_player_event(monkeypatch):
    app = spike_app(monkeypatch)
    ended = current_event(app, "ended-1", "play_ended", message="must be removed")

    send_v2_event(app, ended)

    assert app.session_state["spike_setup_stage"] == "speech_mode"
    assert len(app.session_state["spike_playback_diagnostics"]) == 1
    assert "message" not in app.session_state["spike_playback_diagnostics"][0]

    send_v2_event(app, ended)

    assert app.session_state["spike_setup_stage"] == "speech_mode"
    assert len(app.session_state["spike_playback_diagnostics"]) == 1


def test_stop_and_same_step_restore_reuse_one_command(monkeypatch):
    app = spike_app(monkeypatch)
    original_command = app.session_state["spike_command_id"]
    send_v2_speech_mode(app, "screen_reader_only")

    assert app.session_state["spike_speech_mode"] == "screen_reader_only"
    assert app.session_state["spike_command_id"] == original_command
    stopped_sequence = app.session_state["spike_command_sequence"]

    send_v2_speech_mode(app, "access_ai")

    assert app.session_state["spike_speech_mode"] == "access_ai"
    assert app.session_state["spike_command_sequence"] == stopped_sequence
    restored_command = app.session_state["spike_command_id"]

    app.run(timeout=30)

    assert app.session_state["spike_command_id"] == restored_command
    assert app.session_state["spike_command_sequence"] == stopped_sequence


def test_restore_after_muted_stage_change_issues_one_current_command(monkeypatch):
    app = spike_app(monkeypatch)
    ended = current_event(app, "ended-before-muted-advance", "play_ended")
    send_v2_event(app, ended)
    send_v2_speech_mode(app, "screen_reader_only")
    muted_sequence = app.session_state["spike_command_sequence"]

    next(button for button in app.button if button.label == "Continue").click().run(
        timeout=30
    )

    assert app.session_state["spike_setup_stage"] == "vision"
    assert app.session_state["spike_command_id"] is None
    assert app.session_state["spike_command_sequence"] == muted_sequence

    send_v2_speech_mode(app, "access_ai")

    assert app.session_state["spike_command_sequence"] == muted_sequence + 1
    assert app.session_state["spike_command_instruction"] == "vision"
    current_command = app.session_state["spike_command_id"]

    app.run(timeout=30)

    assert app.session_state["spike_command_id"] == current_command
    assert app.session_state["spike_command_sequence"] == muted_sequence + 1


def test_recommended_blind_profile_applies_defaults_and_speaks_confirmation(
    monkeypatch,
):
    app = app_at_vision(monkeypatch)
    send_v2_speech_mode(app, "screen_reader_only")
    button_labels = [button.label for button in app.button]

    assert button_labels[:2] == [
        "Use recommended blind settings",
        "Customize accessibility settings",
    ]

    app.button[0].click().run(timeout=30)

    assert app.session_state["spike_setup_stage"] == "recommended_complete"
    assert app.session_state["vision"] == "Blind"
    assert app.session_state["interaction"] == "Combination"
    assert app.session_state["platform"] == "Other / Not sure"
    assert app.session_state["spike_speech_mode"] == "access_ai"
    assert app.session_state["spike_guidance_choice"] == (
        "Continue Access AI spoken guidance"
    )
    assert app.session_state["auto_speak"] is True
    assert app.session_state["detail"] == "Step-by-step"
    assert app.session_state["spike_profile_applied"] is True
    assert app.session_state["spike_command_instruction"] == "recommended_complete"
    assert [button.label for button in app.button][:2] == [
        "Customize accessibility settings",
        "Open Access AI",
    ]

    command_id = app.session_state["spike_command_id"]
    app.run(timeout=30)
    assert app.session_state["spike_command_id"] == command_id


def test_customize_path_reveals_existing_choices_and_is_available_after_profile(
    monkeypatch,
):
    app = app_at_vision(monkeypatch)
    assert not any(radio.label == "Vision preference" for radio in app.radio)

    next(
        button
        for button in app.button
        if button.label == "Customize accessibility settings"
    ).click().run(timeout=30)

    vision = next(radio for radio in app.radio if radio.label == "Vision preference")
    assert vision.options == [
        "Blind",
        "Severe low vision",
        "Low vision",
        "Sighted caregiver",
        "Prefer not to say",
    ]
    assert app.session_state["spike_setup_stage"] == "vision"

    next(
        button
        for button in app.button
        if button.label == "Use recommended blind settings"
    ).click().run(timeout=30)
    next(
        button
        for button in app.button
        if button.label == "Customize accessibility settings"
    ).click().run(timeout=30)

    assert app.session_state["spike_setup_stage"] == "vision"
    assert app.session_state["spike_customize_settings"] is True
    assert any(radio.label == "Vision preference" for radio in app.radio)


def test_primary_choices_precede_voice_controller_and_diagnostics_in_source_order():
    source = PROTOTYPE_PY.read_text(encoding="utf-8")
    render_source = source[source.index("def render_persistent_onboarding") :]

    assert render_source.index("_render_primary_controls(stage)") < render_source.index(
        "mount_controller("
    ) < render_source.index('st.expander("Prototype playback diagnostics")')


def test_controller_has_accessible_controls_without_directional_gestures():
    html = CONTROLLER_HTML.read_text(encoding="utf-8")
    javascript = CONTROLLER_JS.read_text(encoding="utf-8")
    lowered = javascript.lower()

    for label in (
        "Pause voice",
        "Repeat instruction",
        "Stop voice",
        "Turn on Access AI speech",
        "Access AI. Tap anywhere to begin spoken setup.",
    ):
        assert label in html

    assert "aria-live=\"polite\"" in html
    assert "setStateValue" in javascript
    assert "commandId" in javascript
    assert "playbackId" in javascript
    assert "unlock.focus" in javascript
    assert 'event.key === "Enter"' in javascript
    assert 'event.key === " "' in javascript
    assert "SpeechRecognition" not in javascript
    assert "webkitSpeechRecognition" not in javascript
    assert "getUserMedia" not in javascript
    assert "navigator.userAgent" not in javascript
    assert "navigator.hid" not in javascript
    assert "navigator.usb" not in javascript
    assert "navigator.bluetooth" not in javascript
    assert "touchstart" not in lowered
    assert "touchmove" not in lowered
    assert "swipe" not in lowered
