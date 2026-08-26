"""Disabled-by-default persistent spoken-onboarding technical spike."""

from __future__ import annotations

import json
import os
from pathlib import Path

from streamlit.components.v2 import component


SPIKE_FLAG = "ACCESS_AI_SPOKEN_SETUP_V2_SPIKE"
ROOT = Path(__file__).parent
MANIFEST_PATH = ROOT / "onboarding_v2_manifest.json"
COMPONENT_PATH = ROOT / "components" / "spoken_setup_v2"
DIAGNOSTIC_FIELDS = (
    "id",
    "name",
    "playback_id",
    "step_id",
    "manifest_version",
    "transport",
    "state",
    "error_name",
)


def spike_enabled(value: str | None = None) -> bool:
    """Return true only for an explicit feature-flag opt in."""
    raw = os.getenv(SPIKE_FLAG, "") if value is None else value
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def load_manifest() -> dict:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    required_ids = ["welcome", "speech_choice", "vision", "interaction", "device"]
    if [step["id"] for step in manifest["steps"]] != required_ids:
        raise ValueError("Spoken-setup manifest has an invalid state order.")
    return manifest


MANIFEST = load_manifest()
STEPS = {step["id"]: step for step in MANIFEST["steps"]}
STATE_ORDER = tuple(STEPS)


def next_state(state: str) -> str:
    index = STATE_ORDER.index(state)
    return STATE_ORDER[min(index + 1, len(STATE_ORDER) - 1)]


def redact_diagnostic(event: object) -> dict:
    """Retain named playback facts; drop text, device data, and arbitrary fields."""
    if not isinstance(event, dict):
        return {}
    return {key: event[key] for key in DIAGNOSTIC_FIELDS if key in event}


def playback_id(manifest_version: str, step_id: str, sequence: int) -> str:
    return f"{manifest_version}:{step_id}:{sequence}"


def controller_renderer():
    """Register in the active Streamlit run, including each isolated AppTest."""
    return component(
        "access_ai_spoken_setup_v2",
        html=(COMPONENT_PATH / "controller.html").read_text(encoding="utf-8"),
        css=(COMPONENT_PATH / "controller.css").read_text(encoding="utf-8"),
        js=(COMPONENT_PATH / "controller.js").read_text(encoding="utf-8"),
    )


def spoken_setup_controller(command: dict, mode: str):
    """Mount one V2 controller that survives Streamlit reruns."""
    return controller_renderer()(
        key="spoken_setup_controller_v2",
        data={"command": command, "mode": mode},
        default={"event": None},
        on_event_change=lambda: None,
        height="content",
    )
