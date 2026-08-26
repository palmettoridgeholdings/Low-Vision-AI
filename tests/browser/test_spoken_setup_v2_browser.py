"""Optional real-browser checks for the V2 spike.

Run only after installing Playwright and its Chromium browser. These checks use
a deterministic fake for the browser speech engine; they do not establish
TalkBack, VoiceOver, mobile autoplay, speaker, or Bluetooth compatibility.
"""

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest


playwright = pytest.importorskip("playwright.sync_api", reason="optional browser spike dependency")

ROOT = Path(__file__).parents[2]


def unused_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest.fixture(scope="module")
def spike_server():
    port = unused_port()
    environment = os.environ.copy()
    environment["ACCESS_AI_SPOKEN_SETUP_V2_SPIKE"] = "true"
    environment.pop("OPENAI_API_KEY", None)
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "streamlit",
            "run",
            "app.py",
            "--server.headless=true",
            f"--server.port={port}",
            "--browser.gatherUsageStats=false",
        ],
        cwd=ROOT,
        env=environment,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                break
        except OSError:
            time.sleep(0.2)
    else:
        process.terminate()
        raise RuntimeError("Streamlit spike server did not start")
    yield f"http://127.0.0.1:{port}"
    process.terminate()
    process.wait(timeout=10)


FAKE_SPEECH_ENGINE = """
class FakeUtterance {
  constructor(text) { this.text = text; }
}
window.SpeechSynthesisUtterance = FakeUtterance;
window.speechSynthesis = {
  speaking: false,
  paused: false,
  current: null,
  speak(utterance) {
    this.current = utterance;
    this.speaking = true;
    setTimeout(() => utterance.onstart?.(), 10);
    setTimeout(() => {
      if (!this.paused && this.current === utterance) {
        this.speaking = false;
        utterance.onend?.();
      }
    }, 250);
  },
  cancel() { this.speaking = false; this.paused = false; this.current = null; },
  pause() { this.paused = true; this.current?.onpause?.(); },
  resume() { this.paused = false; this.current?.onresume?.(); },
};
"""


def test_welcome_continues_to_speech_choice_and_controls_survive_rerun(spike_server):
    with playwright.sync_playwright() as session:
        browser = session.chromium.launch()
        page = browser.new_page()
        page.add_init_script(FAKE_SPEECH_ENGINE)
        page.goto(spike_server)

        page.get_by_role("heading", name="Choose spoken guidance").wait_for(timeout=15_000)
        page.get_by_role("button", name="Stop voice").click()
        page.get_by_text("Access AI voice is stopped").wait_for()
        page.get_by_role("button", name="Restore voice").click()
        page.get_by_text("Access AI voice is restored").wait_for()
        page.get_by_role("button", name="Repeat").click()
        assert page.get_by_text("Playback diagnostics").is_visible()
        browser.close()


def test_screen_reader_only_choice_prevents_next_access_ai_utterance(spike_server):
    with playwright.sync_playwright() as session:
        browser = session.chromium.launch()
        page = browser.new_page()
        page.add_init_script(FAKE_SPEECH_ENGINE)
        page.goto(spike_server)

        page.get_by_role("heading", name="Choose spoken guidance").wait_for(timeout=15_000)
        page.get_by_label("Use screen reader only").check()
        page.get_by_role("button", name="Continue").click()
        page.get_by_role("heading", name="1 of 3 — Vision").wait_for()
        page.get_by_text("Access AI voice is stopped").wait_for()
        browser.close()
