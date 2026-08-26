"""Streamlit V2 wrapper for the persistent setup speech controller."""

from __future__ import annotations

from pathlib import Path
from collections.abc import Callable
from typing import Any

import streamlit as st


PACKAGE_DIR = Path(__file__).parent
COMPONENT_KEY = "persistent_spoken_setup_controller_v1"


def _asset(name: str) -> str:
    return (PACKAGE_DIR / name).read_text(encoding="utf-8")


_CONTROLLER = st.components.v2.component(
    "persistent_spoken_setup_spike",
    html=_asset("controller.html"),
    css=_asset("controller.css"),
    js=_asset("controller.js"),
    isolate_styles=True,
)


def mount_controller(
    data: dict[str, Any],
    *,
    on_diagnostics_change: Callable[[], None],
    on_speech_mode_change: Callable[[], None],
):
    return _CONTROLLER(
        key=COMPONENT_KEY,
        data=data,
        default={"diagnostics": [], "speech_mode": data["speech_mode"]},
        width="stretch",
        height="content",
        on_diagnostics_change=on_diagnostics_change,
        on_speech_mode_change=on_speech_mode_change,
    )
