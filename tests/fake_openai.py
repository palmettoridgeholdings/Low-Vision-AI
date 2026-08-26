"""In-memory OpenAI fake used only by offline tests."""

import io
import wave


def silent_wav():
    output = io.BytesIO()
    with wave.open(output, "wb") as audio_file:
        audio_file.setnchannels(1)
        audio_file.setsampwidth(2)
        audio_file.setframerate(16000)
        audio_file.writeframes(b"\x00\x00" * 4000)
    return output.getvalue()


MOCK_AUDIO = silent_wav()


class FakeStreamingResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return MOCK_AUDIO


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

