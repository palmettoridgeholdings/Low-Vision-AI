"""Offline contract tests for the disabled V2 spoken-onboarding spike."""

import json
from pathlib import Path

from streamlit.testing.v1 import AppTest

from onboarding_v2 import (
    MANIFEST,
    SPIKE_FLAG,
    STATE_ORDER,
    next_state,
    playback_id,
    redact_diagnostic,
    spike_enabled,
)


ROOT = Path(__file__).parents[1]
APP_PATH = ROOT / "app.py"
CONTROLLER_JS = ROOT / "components" / "spoken_setup_v2" / "controller.js"


def test_feature_flag_is_disabled_unless_explicitly_enabled(monkeypatch):
    monkeypatch.delenv(SPIKE_FLAG, raising=False)
    assert spike_enabled() is False
    assert spike_enabled("false") is False
    assert spike_enabled("true") is True


def test_versioned_manifest_is_the_single_instruction_contract():
    disk_manifest = json.loads(
        (ROOT / "onboarding_v2_manifest.json").read_text(encoding="utf-8")
    )
    assert MANIFEST == disk_manifest
    assert MANIFEST["schema_version"] == "access-ai.spoken-setup.v2"
    assert tuple(step["id"] for step in MANIFEST["steps"]) == STATE_ORDER
    assert all(step["visible"].strip() and step["speech"].strip() for step in MANIFEST["steps"])


def test_setup_state_machine_has_no_skips():
    assert next_state("welcome") == "speech_choice"
    assert next_state("speech_choice") == "vision"
    assert next_state("vision") == "interaction"
    assert next_state("interaction") == "device"
    assert next_state("device") == "device"


def test_playback_ids_are_versioned_and_deterministic():
    version = MANIFEST["content_version"]
    assert playback_id(version, "vision", 3) == f"{version}:vision:3"


def test_diagnostics_drop_speech_text_and_unknown_device_data():
    diagnostic = redact_diagnostic(
        {
            "id": "event-1",
            "name": "playback_started",
            "playback_id": "version:welcome:1",
            "step_id": "welcome",
            "manifest_version": "version",
            "transport": "browser-speech-synthesis",
            "state": "spoken",
            "speech": "private spoken content",
            "user_agent": "device fingerprint",
        }
    )
    assert diagnostic["name"] == "playback_started"
    assert "speech" not in diagnostic
    assert "user_agent" not in diagnostic


def test_controller_has_persistent_dedupe_and_no_swipe_interception():
    javascript = CONTROLLER_JS.read_text(encoding="utf-8")
    assert "const controllers = new WeakMap()" in javascript
    assert "handledPlaybackIds" in javascript
    assert "playback_id" in javascript
    assert "touchstart" not in javascript
    assert "touchmove" not in javascript
    assert "swipe" not in javascript.lower()


def test_v2_spike_starts_without_api_key_when_flag_enabled(monkeypatch):
    monkeypatch.setenv(SPIKE_FLAG, "true")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    app = AppTest.from_file(APP_PATH).run(timeout=30)

    assert not app.exception
    assert app.title[0].value.endswith(MANIFEST["steps"][0]["heading"])
    assert any("Technical spike" in item.value for item in app.caption)
    assert app.button[0].label == "Start accessible setup"


def test_v2_screen_reader_only_choice_stops_access_ai_voice(monkeypatch):
    monkeypatch.setenv(SPIKE_FLAG, "true")
    app = AppTest.from_file(APP_PATH)
    app.session_state["setup_v2_state"] = "speech_choice"
    app.session_state["setup_v2_speech_choice"] = "Use screen reader only"
    app.run(timeout=30)

    next(button for button in app.button if button.label == "Continue").click().run(timeout=30)

    assert not app.exception
    assert app.session_state["setup_v2_mode"] == "stopped"
    assert app.session_state["setup_v2_state"] == "vision"


def test_v1_remains_the_default_when_spike_flag_is_absent(monkeypatch):
    monkeypatch.delenv(SPIKE_FLAG, raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    app = AppTest.from_file(APP_PATH).run(timeout=30)

    assert not app.exception
    assert any("Spoken setup is unavailable" in item.value for item in app.info)
    assert not any("Technical spike" in item.value for item in app.caption)
