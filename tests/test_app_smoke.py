"""Offline onboarding and main-application regression tests."""

import ast
from pathlib import Path
import openai
from streamlit.testing.v1 import AppTest

from onboarding import (
    ANSWER_STYLES, INTERACTION_OPTIONS, RECOMMENDED_BLIND_DEFAULTS,
    SETUP_STEPS, VISION_OPTIONS, apply_profile_defaults, profile_summary,
)
from tests.fake_openai import FakeOpenAI

APP_PATH = Path(__file__).parents[1] / "app.py"
COMPONENT_HTML = Path(__file__).parents[1] / "components" / "spoken_setup" / "index.html"

def labeled(elements, label):
    return next(element for element in elements if element.label == label)

def fresh_app(monkeypatch, *, key=False):
    if key:
        monkeypatch.setenv("OPENAI_API_KEY", "offline-test-key")
        monkeypatch.setattr(openai, "OpenAI", FakeOpenAI)
    else:
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    return AppTest.from_file(APP_PATH).run(timeout=30)

def main_app(monkeypatch, *, key=False, auto_speak=False):
    app = AppTest.from_file(APP_PATH)
    app.session_state["onboarded"] = True
    app.session_state["auto_speak"] = auto_speak
    if key:
        monkeypatch.setenv("OPENAI_API_KEY", "offline-test-key")
        monkeypatch.setattr(openai, "OpenAI", FakeOpenAI)
    else:
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    return app.run(timeout=30)

def test_explicit_vision_profiles_include_totally_blind():
    assert VISION_OPTIONS["totally_blind"] == "Totally blind / no useful vision"
    assert "Blind" not in VISION_OPTIONS.values()

def test_totally_blind_recommendations_are_applied_and_overridable():
    state = {"auto_speak": False, "detail": "Detailed"}
    apply_profile_defaults(state, "totally_blind")
    assert all(state[key] == value for key, value in RECOMMENDED_BLIND_DEFAULTS.items())
    state["auto_speak"] = False
    state["detail"] = "Conversational"
    assert state["auto_speak"] is False and state["detail"] == "Conversational"

def test_first_run_has_two_accessible_routes_without_api_key(monkeypatch):
    app = fresh_app(monkeypatch)
    assert not app.exception
    assert labeled(app.button, "Start spoken setup")
    assert labeled(app.button, "Start visual guided setup")
    assert "without sight" in app.markdown[1].value

def test_spoken_route_applies_blind_defaults_without_openai(monkeypatch):
    app = fresh_app(monkeypatch)
    labeled(app.button, "Start spoken setup").click().run(timeout=30)
    assert app.session_state["step"] == "vision"
    assert app.session_state["vision_profile"] == "totally_blind"
    assert app.session_state["auto_speak"] is True
    assert app.session_state["detail"] == "Short and direct"

def test_every_setup_state_progresses_to_completion(monkeypatch):
    app = fresh_app(monkeypatch)
    labeled(app.button, "Start spoken setup").click().run(timeout=30)
    visited = [app.session_state["step"]]
    for expected in SETUP_STEPS[2:]:
        labeled(app.button, "Continue").click().run(timeout=30)
        visited.append(app.session_state["step"])
        assert app.session_state["step"] == expected
    labeled(app.button, "Finish setup").click().run(timeout=30)
    assert app.session_state["onboarded"] is True
    assert visited == list(SETUP_STEPS[1:])

def test_visual_low_vision_route_remains_functional(monkeypatch):
    app = fresh_app(monkeypatch)
    labeled(app.button, "Start visual guided setup").click().run(timeout=30)
    labeled(app.radio, "Vision option").set_value("low_vision").run(timeout=30)
    assert app.session_state["vision_profile"] == "low_vision"
    assert app.session_state["setup_start_mode"] == "visual"

def test_user_can_override_blind_answer_defaults(monkeypatch):
    app = fresh_app(monkeypatch)
    labeled(app.button, "Start spoken setup").click().run(timeout=30)
    labeled(app.button, "Continue").click().run(timeout=30)
    labeled(app.radio, "Primary interaction preference").set_value(INTERACTION_OPTIONS[2]).run(timeout=30)
    labeled(app.button, "Continue").click().run(timeout=30)
    labeled(app.button, "Continue").click().run(timeout=30)
    labeled(app.checkbox, "Automatically speak answers").uncheck().run(timeout=30)
    labeled(app.radio, "Answer style").set_value(ANSWER_STYLES[-1]).run(timeout=30)
    assert app.session_state["auto_speak"] is False
    assert app.session_state["detail"] == "Conversational"

def test_confirmation_summary_and_review_action(monkeypatch):
    app = fresh_app(monkeypatch)
    app.session_state["step"] = "confirmation"
    app.session_state["vision_profile"] = "totally_blind"
    app.run(timeout=30)
    assert "totally blind" in profile_summary(app.session_state).lower()
    labeled(app.button, "Review settings").click().run(timeout=30)
    assert app.session_state["step"] == "vision"

def test_interrupted_setup_resumes_current_session_step(monkeypatch):
    app = fresh_app(monkeypatch)
    app.session_state["step"] = "device"
    app.run(timeout=30)
    assert app.session_state["step"] == "device"
    assert labeled(app.radio, "Device or screen reader")

def test_main_accessibility_actions_and_reopen(monkeypatch):
    app = main_app(monkeypatch)
    assert labeled(app.button, "Repeat last answer")
    labeled(app.button, "Help / What can I do?").click().run(timeout=30)
    assert any("Braille keyboard" in item.value for item in app.info)
    labeled(app.button, "Change accessibility setup").click().run(timeout=30)
    assert app.session_state["onboarded"] is False
    assert app.session_state["step"] == "vision"

def test_repeat_last_answer_has_readable_fallback(monkeypatch):
    app = main_app(monkeypatch)
    app.session_state["last_audio_text"] = "The saved answer."
    app.run(timeout=30)
    labeled(app.button, "Repeat last answer").click().run(timeout=30)
    assert app.session_state["local_speech_text"] == "The saved answer."

def test_setup_speech_is_browser_local_and_has_no_gesture_handlers():
    html = COMPONENT_HTML.read_text(encoding="utf-8")
    assert "speechSynthesis" in html and "SpeechSynthesisUtterance" in html
    assert "touchstart" not in html and "touchmove" not in html and "swipe" not in html.lower()
    assert 'type="button"' in html and "aria-label" in html


def test_responses_requests_disable_application_state_storage():
    tree = ast.parse(APP_PATH.read_text(encoding="utf-8"))
    store_values = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Dict):
            store_values.extend(
                value
                for key, value in zip(node.keys, node.values)
                if isinstance(key, ast.Constant) and key.value == "store"
            )
        elif isinstance(node, ast.Call):
            store_values.extend(
                keyword.value
                for keyword in node.keywords
                if keyword.arg == "store"
            )
    assert len(store_values) == 2
    assert all(
        isinstance(value, ast.Constant) and value.value is False
        for value in store_values
    )


def test_missing_key_does_not_regress_chat_or_camera_shell(monkeypatch):
    app = main_app(monkeypatch)
    assert labeled(app.text_area, "Your question")
    assert labeled(app.selectbox, "Camera task").options == ["Read text / mail", "Describe scene", "Find / inspect"]
    labeled(app.text_area, "Your question").input("Where are settings?")
    labeled(app.button, "Ask Access AI").click().run(timeout=30)
    assert any("needs an OpenAI API key" in item.value for item in app.error)
    assert list(app.session_state["messages"]) == []

def test_text_chat_still_works_offline_with_fake_provider(monkeypatch):
    FakeOpenAI.response_calls = FakeOpenAI.speech_calls = 0
    app = main_app(monkeypatch, key=True, auto_speak=False)
    labeled(app.text_area, "Your question").input("Explain this accessibly.")
    labeled(app.button, "Ask Access AI").click().run(timeout=30)
    assert list(app.session_state["messages"])[-1]["content"] == "Mock accessible answer."
    assert FakeOpenAI.response_calls == 1 and FakeOpenAI.speech_calls == 0
