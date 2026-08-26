"""Offline smoke tests for the Access AI Streamlit prototype."""

import json
from pathlib import Path

import openai
from streamlit.testing.v1 import AppTest

from onboarding import UNLOCK_LABEL
from tests.fake_openai import FakeOpenAI, MOCK_AUDIO


APP_PATH = Path(__file__).parents[1] / "app.py"
COMPONENT_HTML = Path(__file__).parents[1] / "components" / "spoken_setup" / "index.html"


def element_with_label(elements, label):
    return next(element for element in elements if element.label == label)


def app_at_main(monkeypatch, *, api_key=None, auto_speak=False):
    if api_key is None:
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    else:
        monkeypatch.setenv("OPENAI_API_KEY", api_key)
        monkeypatch.setattr(openai, "OpenAI", FakeOpenAI)

    app = AppTest.from_file(APP_PATH)
    app.session_state["onboarded"] = True
    app.session_state["auto_speak"] = auto_speak
    return app.run(timeout=30)


def onboarding_app(monkeypatch):
    FakeOpenAI.speech_calls = 0
    FakeOpenAI.speech_error = False
    monkeypatch.setenv("OPENAI_API_KEY", "offline-test-key")
    monkeypatch.setattr(openai, "OpenAI", FakeOpenAI)
    return AppTest.from_file(APP_PATH).run(timeout=30)


def send_player_event(app, event_id, kind, *, input_kind="browser", step="welcome"):
    app.session_state["spoken_setup_player"] = {
        "id": event_id,
        "kind": kind,
        "input": input_kind,
        "step": step,
    }
    return app.run(timeout=30)


def test_startup_without_key_keeps_accessible_setup_available(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    app = AppTest.from_file(APP_PATH).run(timeout=30)

    assert not app.exception
    assert app.title[0].value.endswith("Welcome to Access AI")
    assert element_with_label(app.button, "Start accessible setup")
    assert any("Spoken setup is unavailable" in item.value for item in app.info)


def test_onboarding_attempts_autoplay_once_without_duplicate_speech(monkeypatch):
    app = onboarding_app(monkeypatch)

    assert not app.exception
    assert FakeOpenAI.speech_calls == 1
    assert app.session_state["setup_audio"] == MOCK_AUDIO
    assert "Hear this step" not in [button.label for button in app.button]

    app.run(timeout=30)

    assert FakeOpenAI.speech_calls == 1


def test_successful_autoplay_activates_continuous_spoken_setup(monkeypatch):
    app = onboarding_app(monkeypatch)

    send_player_event(app, "autoplay-success-1", "autoplay_started")

    assert app.session_state["setup_speech_active"] is True
    assert app.session_state["setup_autoplay_blocked"] is False
    assert app.session_state["setup_start_mode"] == "spoken"
    assert FakeOpenAI.speech_calls == 1


def test_blocked_autoplay_uses_full_screen_fallback_without_retry(monkeypatch):
    app = onboarding_app(monkeypatch)
    component_args = json.loads(app.get("component_instance")[0].proto.json_args)

    send_player_event(app, "autoplay-blocked-1", "autoplay_blocked")

    assert app.session_state["setup_autoplay_blocked"] is True
    assert component_args["unlock_label"] == UNLOCK_LABEL
    assert FakeOpenAI.speech_calls == 1


def test_keyboard_unlock_activates_speech_and_component_has_key_handlers(monkeypatch):
    app = onboarding_app(monkeypatch)
    html = COMPONENT_HTML.read_text(encoding="utf-8")

    send_player_event(
        app,
        "keyboard-unlock-1",
        "audio_unlocked",
        input_kind="keyboard",
    )

    assert app.session_state["setup_speech_active"] is True
    assert app.session_state["setup_start_mode"] == "spoken"
    assert 'event.key === "Enter"' in html
    assert 'event.key === " "' in html
    assert 'activateUnlock("keyboard")' in html
    assert "unlock.focus({ preventScroll: true })" in html


def test_welcome_completion_advances_and_speaks_next_step_once(monkeypatch):
    app = onboarding_app(monkeypatch)
    send_player_event(app, "autoplay-success-2", "autoplay_started")

    send_player_event(app, "welcome-ended-1", "audio_ended")

    assert app.session_state["step"] == 1
    assert app.session_state["setup_audio_step"] == "vision"
    assert FakeOpenAI.speech_calls == 2

    app.run(timeout=30)

    assert FakeOpenAI.speech_calls == 2


def test_visible_start_preserves_nonspoken_setup_path(monkeypatch):
    app = onboarding_app(monkeypatch)

    send_player_event(app, "visible-start-1", "start_visible", input_kind="visible_button")

    assert app.session_state["step"] == 1
    assert app.session_state["setup_start_mode"] == "visual"
    assert app.session_state["setup_speech_active"] is False
    assert FakeOpenAI.speech_calls == 1


def test_missing_key_error_is_understandable_and_does_not_add_failed_turn(monkeypatch):
    app = app_at_main(monkeypatch)

    element_with_label(app.text_area, "Your question").input("Where are my settings?")
    element_with_label(app.button, "Ask Access AI").click().run(timeout=30)

    assert not app.exception
    assert any("needs an OpenAI API key" in item.value for item in app.error)
    assert list(app.session_state["messages"]) == []


def test_text_only_question_succeeds_without_speech_or_hardware(monkeypatch):
    FakeOpenAI.response_calls = 0
    FakeOpenAI.speech_calls = 0
    FakeOpenAI.speech_error = False
    app = app_at_main(monkeypatch, api_key="offline-test-key", auto_speak=False)

    element_with_label(app.text_area, "Your question").input("Explain this accessibly.")
    element_with_label(app.button, "Ask Access AI").click().run(timeout=30)

    assert not app.exception
    assert not app.error
    assert FakeOpenAI.response_calls == 1
    assert FakeOpenAI.speech_calls == 0
    assert list(app.session_state["messages"]) == [
        {"role": "user", "content": "Explain this accessibly."},
        {"role": "assistant", "content": "Mock accessible answer."},
    ]


def test_speech_failure_keeps_successful_text_answer(monkeypatch):
    FakeOpenAI.response_calls = 0
    FakeOpenAI.speech_calls = 0
    FakeOpenAI.speech_error = False
    app = app_at_main(monkeypatch, api_key="offline-test-key", auto_speak=True)
    FakeOpenAI.speech_error = True

    element_with_label(app.text_area, "Your question").input("Keep this answer visible.")
    element_with_label(app.button, "Ask Access AI").click().run(timeout=30)

    assert not app.exception
    assert list(app.session_state["messages"])[-1] == {
        "role": "assistant",
        "content": "Mock accessible answer.",
    }
    assert app.session_state["last_audio"] is None
    assert any("could not be completed" in item.value for item in app.warning)
    assert element_with_label(app.button, "🔊 Speak latest answer")
    FakeOpenAI.speech_error = False


def test_camera_unavailable_path_and_camera_modes_render(monkeypatch):
    app = app_at_main(monkeypatch)
    camera_mode = element_with_label(app.selectbox, "Camera task")

    assert not app.exception
    assert camera_mode.options == [
        "Read text / mail",
        "Describe scene",
        "Find / inspect",
    ]
    assert "Analyze picture" not in [button.label for button in app.button]
    assert any(
        "no camera or camera permission is denied" in caption.value
        for caption in app.caption
    )


def test_all_non_hardware_input_sections_remain_available(monkeypatch):
    app = app_at_main(monkeypatch)
    headings = [heading.value for heading in app.header]

    assert any("Camera assistance" in heading for heading in headings)
    assert any("Ask by voice" in heading for heading in headings)
    assert any("Type or use a Braille keyboard" in heading for heading in headings)
    assert "Conversation" in headings
    assert not app.exception
