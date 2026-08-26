"""Spoken-onboarding state helpers and local Streamlit component wrapper."""

import base64
import hashlib
from pathlib import Path

import streamlit.components.v1 as components


UNLOCK_LABEL = "Access AI. Tap anywhere to begin spoken setup."

SETUP_SPEECH = {
    "welcome": (
        "Welcome to Access AI. This setup can be completed without sight. "
        "Spoken setup is starting now."
    ),
    "vision": (
        "Step one. Choose the vision option that best matches how you want "
        "Access AI to assist you. Then activate Continue."
    ),
    "interaction": (
        "Step two. Choose voice first, screen reader and keyboard, refreshable "
        "Braille, large text, or combination. Then activate Continue."
    ),
    "device": (
        "Final step. Choose your device, spoken answer preference, and answer "
        "style. Then activate Finish setup."
    ),
}


_COMPONENT_PATH = Path(__file__).parent / "components" / "spoken_setup"
_spoken_setup_component = components.declare_component(
    "spoken_setup",
    path=str(_COMPONENT_PATH),
)


def should_prepare_setup_audio(step_id, attempted_step, enabled=True):
    """Return true exactly once per setup step while speech is enabled."""
    return bool(enabled and step_id != attempted_step)


def is_new_player_event(event, processed_event_id):
    return bool(
        isinstance(event, dict)
        and event.get("id")
        and event.get("id") != processed_event_id
        and event.get("kind")
    )


def player_event_updates(event):
    """Map a browser player event to small, testable server-state updates."""
    kind = event.get("kind") if isinstance(event, dict) else None
    if kind in {"autoplay_started", "audio_unlocked"}:
        return {
            "setup_speech_active": True,
            "setup_autoplay_blocked": False,
        }
    if kind == "autoplay_blocked":
        return {"setup_autoplay_blocked": True}
    if kind == "start_visible":
        return {
            "setup_speech_active": False,
            "setup_autoplay_blocked": False,
            "advance_visual": True,
        }
    if kind == "audio_ended" and event.get("step") == "welcome":
        return {"advance_spoken": True}
    return {}


def spoken_setup_player(audio_bytes, step_id, *, first_screen):
    """Render the stable browser audio player and return its latest event."""
    audio_b64 = base64.b64encode(audio_bytes).decode("ascii")
    audio_digest = hashlib.sha256(audio_bytes).hexdigest()[:16]
    audio_mime = "audio/wav" if audio_bytes.startswith(b"RIFF") else "audio/mpeg"
    return _spoken_setup_component(
        audio_b64=audio_b64,
        audio_mime=audio_mime,
        audio_token=f"{step_id}:{audio_digest}",
        step_id=step_id,
        first_screen=first_screen,
        unlock_label=UNLOCK_LABEL,
        visible_start_label="Start accessible setup",
        default=None,
        key="spoken_setup_player",
        tab_index=0,
    )
