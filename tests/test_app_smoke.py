"""Offline smoke tests for the Access AI Streamlit prototype."""

from pathlib import Path

import openai
from streamlit.testing.v1 import AppTest


APP_PATH = Path(__file__).parents[1] / "app.py"


class FakeStreamingResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return b"mock-mp3"


class FakeStreamingSpeech:
    def create(self, **_kwargs):
        FakeOpenAI.speech_calls += 1
        if FakeOpenAI.speech_error:
            raise RuntimeError("offline speech failure")
        return FakeStreamingResponse()


class FakeSpeech:
    def __init__(self):
        self.with_streaming_response = FakeStreamingSpeech()


class FakeTranscriptions:
    def create(self, **_kwargs):
        return type("Transcription", (), {"text": "mock transcript"})()


class FakeAudio:
    def __init__(self):
        self.speech = FakeSpeech()
        self.transcriptions = FakeTranscriptions()


class FakeResponses:
    def create(self, **_kwargs):
        FakeOpenAI.response_calls += 1
        return type("Response", (), {"output_text": "Mock accessible answer."})()


class FakeOpenAI:
    response_calls = 0
    speech_calls = 0
    speech_error = False

    def __init__(self, **_kwargs):
        self.audio = FakeAudio()
        self.responses = FakeResponses()


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


def test_startup_without_key_keeps_accessible_setup_available(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    app = AppTest.from_file(APP_PATH).run(timeout=30)

    assert not app.exception
    assert app.title[0].value.endswith("Welcome to Access AI")
    assert element_with_label(app.button, "Start accessible setup")
    assert any("Spoken setup is unavailable" in item.value for item in app.info)


def test_spoken_onboarding_waits_for_user_action(monkeypatch):
    FakeOpenAI.speech_calls = 0
    monkeypatch.setenv("OPENAI_API_KEY", "offline-test-key")
    monkeypatch.setattr(openai, "OpenAI", FakeOpenAI)
    app = AppTest.from_file(APP_PATH).run(timeout=30)

    assert FakeOpenAI.speech_calls == 0

    element_with_label(app.button, "Hear this step").click().run(timeout=30)

    assert not app.exception
    assert FakeOpenAI.speech_calls == 1
    assert app.session_state["setup_audio"] == b"mock-mp3"


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
