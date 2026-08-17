import os
import tempfile
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

APP_NAME = "Access AI"
MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6")
PROMPT_PATH = Path(__file__).parent / "system_prompt.txt"

st.set_page_config(
    page_title=APP_NAME,
    page_icon="🔊",
    layout="centered",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      .block-container {max-width: 850px; padding-top: 1.25rem;}
      div.stButton > button {
          min-height: 3.6rem;
          font-size: 1.15rem;
          font-weight: 700;
          width: 100%;
      }
      textarea {font-size: 1.08rem !important;}
      [data-testid="stChatMessage"] {font-size: 1.05rem;}
    </style>
    """,
    unsafe_allow_html=True,
)

def init_state():
    defaults = {
        "messages": [],
        "vision": "Blind",
        "interaction": "Voice first",
        "platform": "Android / TalkBack",
        "detail": "Step-by-step",
        "web_search": True,
        "auto_speak": True,
        "voice": "cedar",
        "last_audio": None,
        "last_transcript": "",
        "processed_audio_id": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

def get_api_key():
    # Works locally with .env and on Streamlit Community Cloud with Secrets.
    key = os.getenv("OPENAI_API_KEY")
    if key:
        return key
    try:
        return st.secrets["OPENAI_API_KEY"]
    except Exception:
        return None

def get_client():
    key = get_api_key()
    if not key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Add it to Streamlit Secrets or a local .env file."
        )
    return OpenAI(api_key=key)

def load_base_prompt():
    if not PROMPT_PATH.exists():
        raise RuntimeError(
            "system_prompt.txt was not found in the same folder as app.py."
        )
    return PROMPT_PATH.read_text(encoding="utf-8")

def build_instructions():
    profile = f"""
CURRENT USER ACCESSIBILITY PROFILE
Vision: {st.session_state.vision}
Primary interaction: {st.session_state.interaction}
Platform or screen reader: {st.session_state.platform}
Preferred answer style: {st.session_state.detail}
"""
    return load_base_prompt() + "\n\n" + profile

def build_conversation():
    return [
        {"role": message["role"], "content": message["content"]}
        for message in st.session_state.messages[-12:]
    ]

def ask_model():
    client = get_client()

    kwargs = {
        "model": MODEL,
        "reasoning": {"effort": "low"},
        "instructions": build_instructions(),
        "input": build_conversation(),
    }

    if st.session_state.web_search:
        kwargs["tools"] = [{"type": "web_search", "search_context_size": "low"}]

    response = client.responses.create(**kwargs)
    return response.output_text

def transcribe_audio(uploaded_audio):
    client = get_client()

    # Streamlit records WAV audio. A temporary file keeps the OpenAI upload simple
    # and avoids relying on browser-specific UploadedFile behavior.
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
        temp.write(uploaded_audio.getvalue())
        temp_path = temp.name

    try:
        with open(temp_path, "rb") as audio_file:
            result = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=audio_file,
                response_format="json",
                prompt="Transcribe the user's spoken question accurately.",
            )
        return result.text.strip()
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass

def make_speech(text):
    client = get_client()

    # Keep speech within the current TTS input limit and avoid reading huge
    # research answers endlessly.
    spoken_text = text[:3900]

    with client.audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice=st.session_state.voice,
        input=spoken_text,
        instructions=(
            "Speak clearly, warmly, and naturally. Use a calm conversational pace. "
            "For numbered steps, pause briefly between steps."
        ),
        response_format="mp3",
    ) as response:
        return response.read()

def process_question(question):
    cleaned = question.strip()
    if not cleaned:
        return

    st.session_state.messages.append({"role": "user", "content": cleaned})

    with st.spinner("Thinking…"):
        answer = ask_model()

    st.session_state.messages.append({"role": "assistant", "content": answer})

    if st.session_state.auto_speak:
        with st.spinner("Preparing spoken answer…"):
            st.session_state.last_audio = make_speech(answer)
    else:
        st.session_state.last_audio = None

def clear_chat():
    st.session_state.messages = []
    st.session_state.last_audio = None
    st.session_state.last_transcript = ""
    st.session_state.processed_audio_id = None

def repeat_last_answer():
    assistants = [
        m["content"] for m in st.session_state.messages if m["role"] == "assistant"
    ]
    if not assistants:
        return
    with st.spinner("Preparing spoken answer…"):
        st.session_state.last_audio = make_speech(assistants[-1])

def stop_speaking():
    st.session_state.last_audio = None

init_state()

st.title("🔊 Access AI")
st.write(
    "Ask by voice or text. Access AI automatically considers blindness, low vision, "
    "screen readers, Braille, and nonvisual ways of completing tasks."
)

with st.expander("Accessibility and voice preferences", expanded=False):
    st.selectbox(
        "Vision",
        ["Blind", "Low vision", "Severe low vision", "Sighted caregiver", "Prefer not to say"],
        key="vision",
    )

    st.selectbox(
        "Primary interaction",
        [
            "Voice first",
            "Screen reader and keyboard",
            "Refreshable Braille display",
            "Large text",
            "Combination",
        ],
        key="interaction",
    )

    st.selectbox(
        "Platform or screen reader",
        [
            "Android / TalkBack",
            "iPhone / VoiceOver",
            "Windows / NVDA",
            "Windows / JAWS",
            "Mac / VoiceOver",
            "Other / Not sure",
        ],
        key="platform",
    )

    st.selectbox(
        "Answer style",
        ["Step-by-step", "Short and direct", "Detailed", "Conversational"],
        key="detail",
    )

    st.checkbox(
        "Allow web research when useful",
        key="web_search",
        help="Lets Access AI research current information when it improves the answer.",
    )

    st.checkbox(
        "Automatically speak answers",
        key="auto_speak",
        help="When enabled, Access AI creates an AI-generated spoken version of each answer.",
    )

    st.selectbox(
        "AI voice",
        ["cedar", "marin", "coral", "alloy", "ash", "nova", "sage", "shimmer", "verse", "onyx"],
        key="voice",
    )

st.divider()

st.subheader("🎙️ Ask by voice")
st.write("Tap the microphone below, record your question, then stop the recording.")

voice_audio = st.audio_input(
    "Record your question",
    sample_rate=16000,
    key="voice_recorder",
)

if voice_audio is not None:
    audio_id = f"{len(voice_audio.getvalue())}-{hash(voice_audio.getvalue()[:128])}"

    if audio_id != st.session_state.processed_audio_id:
        try:
            with st.spinner("Listening…"):
                transcript = transcribe_audio(voice_audio)

            st.session_state.last_transcript = transcript
            st.session_state.processed_audio_id = audio_id

            if transcript:
                st.success(f"I heard: {transcript}")
                process_question(transcript)
                st.rerun()
            else:
                st.warning("I couldn't hear a question clearly. Please try recording again.")
        except Exception as exc:
            st.error(f"I couldn't process that recording. Technical detail: {exc}")

if st.session_state.last_transcript:
    st.caption(f"Most recent voice transcript: {st.session_state.last_transcript}")

st.divider()
st.subheader("⌨️ Or type your question")

with st.form("ask_form", clear_on_submit=True):
    question = st.text_area(
        "Your question",
        placeholder="Type your question here…",
        height=120,
        key="question_box",
    )
    submitted = st.form_submit_button("Ask Access AI")

if submitted:
    if not question.strip():
        st.warning("Please enter a question.")
    else:
        try:
            process_question(question)
            st.rerun()
        except Exception as exc:
            st.error(f"I couldn't complete that request. Technical detail: {exc}")

st.divider()
st.subheader("Conversation")

if not st.session_state.messages:
    st.info("Try asking: “Help me choose a microwave that is easy to use without sight.”")

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Spoken response controls.
assistant_messages = [
    m["content"] for m in st.session_state.messages if m["role"] == "assistant"
]

if assistant_messages:
    st.subheader("🔊 Spoken answer")

    if st.session_state.last_audio:
        st.caption("The voice below is AI-generated.")
        st.audio(
            st.session_state.last_audio,
            format="audio/mp3",
            autoplay=True,
        )
    else:
        st.caption("Spoken playback is currently stopped or automatic speech is off.")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("🔁 Repeat last answer"):
            try:
                repeat_last_answer()
                st.rerun()
            except Exception as exc:
                st.error(f"I couldn't create the spoken answer. Technical detail: {exc}")

    with col2:
        if st.button("🛑 Stop speaking"):
            stop_speaking()
            st.rerun()

st.divider()

if st.button("Clear conversation"):
    clear_chat()
    st.rerun()

st.caption(
    "Access AI prototype. The spoken voice is AI-generated. "
    "For safety-critical visual information, medication labels, hazards, navigation, "
    "or other uncertain observations, verify important details using an appropriate "
    "accessible source or trusted assistance."
)
