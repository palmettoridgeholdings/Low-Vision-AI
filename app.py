import os
import tempfile
import base64
import hashlib
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6")
PROMPT_PATH = Path(__file__).parent / "system_prompt.txt"

st.set_page_config(
    page_title="Access AI",
    page_icon="🔊",
    layout="centered",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      .block-container {max-width: 850px; padding-top: 1rem;}
      div.stButton > button {
          min-height: 4.25rem;
          font-size: 1.18rem;
          font-weight: 700;
          width: 100%;
      }
      textarea {font-size: 1.1rem !important;}
      [data-testid="stChatMessage"] {font-size: 1.06rem;}
      button:focus-visible, input:focus-visible, textarea:focus-visible,
      [role="radio"]:focus-visible, [role="combobox"]:focus-visible {
          outline: 3px solid #ffd43b !important;
          outline-offset: 3px !important;
      }
      [data-testid="stBaseButton-primary"] {
          background-color: #a61b1b;
          border-color: #a61b1b;
          color: #ffffff;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

defaults = {
    "onboarded": False,
    "step": 0,
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
    "setup_audio": None,
    "setup_audio_step": None,
    "setup_audio_error": None,
    "camera_answer": None,
    "last_audio_text": "",
    "voice_notice": None,
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

if (
    st.session_state.interaction == "Large text"
    or "low vision" in st.session_state.vision.lower()
):
    st.markdown(
        """
        <style>
          .stApp, .stApp p, .stApp label, .stApp input, .stApp textarea,
          .stApp [data-testid="stChatMessage"] {font-size: 1.2rem !important;}
          .stApp h1 {font-size: 2.5rem !important;}
          .stApp h2 {font-size: 2rem !important;}
        </style>
        """,
        unsafe_allow_html=True,
    )


def api_key():
    k = os.getenv("OPENAI_API_KEY")
    if k:
        return k
    try:
        return st.secrets["OPENAI_API_KEY"]
    except Exception:
        return None


def client():
    k = api_key()
    if not k:
        raise RuntimeError("OPENAI_API_KEY is missing.")
    return OpenAI(api_key=k)


def capability_error(action, error):
    """Return an actionable message without exposing provider internals."""
    if isinstance(error, RuntimeError) and "OPENAI_API_KEY" in str(error):
        return (
            f"{action} needs an OpenAI API key. Add it to your local environment "
            "or Streamlit secrets, then try again."
        )
    return (
        f"{action} could not be completed. Check the network connection and API "
        "access, then try again. Your other settings and results are unchanged."
    )


def speech(text):
    with client().audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice=st.session_state.voice,
        input=text[:3900],
        instructions=(
            "Speak clearly, warmly, naturally, and at a calm conversational pace. "
            "Pause briefly between numbered steps."
        ),
        response_format="mp3",
    ) as r:
        return r.read()


def transcribe(audio):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio.getvalue())
        path = f.name
    try:
        with open(path, "rb") as af:
            r = client().audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=af,
                response_format="json",
            )
        return r.text.strip()
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


def instructions():
    base = PROMPT_PATH.read_text(encoding="utf-8")
    return base + f"""

CURRENT ACCESSIBILITY PROFILE
Vision: {st.session_state.vision}
Primary interaction: {st.session_state.interaction}
Platform or screen reader: {st.session_state.platform}
Preferred answer style: {st.session_state.detail}
"""


def ask_text(question):
    recent_messages = st.session_state.messages[-11:] + [
        {"role": "user", "content": question}
    ]
    kwargs = {
        "model": MODEL,
        "reasoning": {"effort": "low"},
        "instructions": instructions(),
        "input": [
            {"role": m["role"], "content": m["content"]}
            for m in recent_messages
        ],
    }
    if st.session_state.web_search:
        kwargs["tools"] = [{"type": "web_search", "search_context_size": "low"}]
    return client().responses.create(**kwargs).output_text


def process_question(q):
    q = q.strip()
    if not q:
        return
    with st.spinner("Thinking…"):
        answer = ask_text(q)
    st.session_state.messages.extend(
        [
            {"role": "user", "content": q},
            {"role": "assistant", "content": answer},
        ]
    )
    st.session_state.last_audio_text = answer
    st.session_state.voice_notice = None

    if st.session_state.auto_speak:
        try:
            with st.spinner("Preparing spoken answer…"):
                st.session_state.last_audio = speech(answer)
        except Exception as error:
            st.session_state.last_audio = None
            st.session_state.voice_notice = capability_error("Spoken answer", error)
    else:
        st.session_state.last_audio = None

    return answer


def analyze_image(image_bytes, mode, question):
    encoded = base64.b64encode(image_bytes).decode("utf-8")

    mode_rules = {
        "Read text / mail": """
READ MODE.
Read all clearly legible text faithfully.
Identify the document type when reasonably clear.
Pull out useful facts such as sender, date, amount due, due date, required action,
phone number, deadline, or address when visible.
Never invent obscured or unreadable text.
If text is unclear, say exactly what is uncertain.
For sensitive account numbers, default to only the last four digits unless the
user explicitly asks for the full number.
""",
        "Describe scene": """
DESCRIBE MODE.
Give a practical nonvisual description of what is actually visible.
Prioritize people, obstacles, doors, furniture, objects, signs, and spatial relationships.
Use clock positions and relative directions when helpful.
Separate clear observations from uncertain interpretations.
Never claim a single image is safe enough for navigation.
""",
        "Find / inspect": """
FIND / INSPECT MODE.
Answer the user's specific question about the visible object, control, or item.
Use nonvisual landmarks, relative position, clock-face position, shape, texture,
and nearby objects when possible.
Be explicit about uncertainty.
Never guess medication dosage, dangerous controls, traffic conditions, hazards,
or other safety-critical details.
""",
    }

    user_request = question.strip() or {
        "Read text / mail": "Read and explain what is in front of me.",
        "Describe scene": "Describe what is in front of me.",
        "Find / inspect": "Identify and explain the important object or control in front of me.",
    }[mode]

    prompt = f"""
{mode_rules[mode]}

User request: {user_request}

The user may be blind or low vision and may not be able to visually verify your answer.
Accuracy and explicit uncertainty matter more than confidence.
"""

    r = client().responses.create(
        model=MODEL,
        instructions=instructions(),
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {
                        "type": "input_image",
                        "image_url": f"data:image/jpeg;base64,{encoded}",
                        "detail": "high",
                    },
                ],
            }
        ],
    )
    return r.output_text


def clear_setup_audio():
    st.session_state.setup_audio = None
    st.session_state.setup_audio_step = None
    st.session_state.setup_audio_error = None


def apply_auto_speak_change():
    if not st.session_state.auto_speak:
        st.session_state.last_audio = None
        st.session_state.voice_notice = None


def render_setup_audio(step_id, text):
    """Generate setup speech only after an explicit user action."""
    if st.button("Hear this step", key=f"hear_setup_{step_id}"):
        try:
            with st.spinner("Preparing spoken setup instructions…"):
                st.session_state.setup_audio = speech(text)
            st.session_state.setup_audio_step = step_id
            st.session_state.setup_audio_error = None
        except Exception as error:
            st.session_state.setup_audio = None
            st.session_state.setup_audio_step = None
            st.session_state.setup_audio_error = capability_error(
                "Spoken setup", error
            )

    if st.session_state.setup_audio_error:
        st.warning(st.session_state.setup_audio_error)

    if (
        st.session_state.setup_audio_step == step_id
        and st.session_state.setup_audio is not None
    ):
        st.caption(
            "AI-generated spoken setup instructions. If playback does not start, "
            "activate Play in the audio controls."
        )
        st.audio(st.session_state.setup_audio, format="audio/mp3", autoplay=True)


def prepare_camera_speech(answer):
    st.session_state.last_audio_text = answer
    st.session_state.voice_notice = None
    if not st.session_state.auto_speak:
        st.session_state.last_audio = None
        return
    try:
        with st.spinner("Preparing spoken camera answer…"):
            st.session_state.last_audio = speech(answer)
    except Exception as error:
        st.session_state.last_audio = None
        st.session_state.voice_notice = capability_error("Spoken camera answer", error)


# -------------------------
# ACCESSIBLE FIRST-RUN SETUP
# -------------------------
if not st.session_state.onboarded:
    st.title("🔊 Welcome to Access AI")
    st.write("This setup is designed to be completed without sight.")

    if not api_key():
        st.info(
            "Spoken setup is unavailable until an OpenAI API key is configured. "
            "All setup questions remain available as text and work with a screen reader."
        )

    step = st.session_state.step

    if step == 0:
        text = (
            "Welcome to Access AI. This setup can be completed without sight. "
            "Activate Hear this step for spoken instructions, or activate Start "
            "accessible setup to continue."
        )
        st.write(
            "Activate **Hear this step** for audio, or **Start accessible setup** "
            "to continue."
        )
        render_setup_audio("welcome", text)

        if st.button("Start accessible setup", type="primary"):
            st.session_state.step = 1
            clear_setup_audio()
            st.rerun()
        st.stop()

    if step == 1:
        st.header("1 of 3 — Vision")
        render_setup_audio(
            "vision",
            "Step one. Choose the vision option that best matches how you want "
            "Access AI to assist you. Then activate Continue.",
        )
        st.radio(
            "Vision preference",
            ["Blind", "Severe low vision", "Low vision", "Sighted caregiver", "Prefer not to say"],
            key="vision",
        )
        if st.button("Continue", type="primary"):
            st.session_state.step = 2
            clear_setup_audio()
            st.rerun()
        st.stop()

    if step == 2:
        st.header("2 of 3 — Interaction")
        render_setup_audio(
            "interaction",
            "Step two. Choose voice first, screen reader and keyboard, refreshable "
            "Braille, large text, or combination. Then activate Continue.",
        )
        st.radio(
            "Primary interaction preference",
            [
                "Voice first",
                "Screen reader and keyboard",
                "Refreshable Braille display",
                "Large text",
                "Combination",
            ],
            key="interaction",
        )
        if st.button("Continue", type="primary"):
            st.session_state.step = 3
            clear_setup_audio()
            st.rerun()
        st.stop()

    st.header("3 of 3 — Device and answers")
    render_setup_audio(
        "device",
        "Final step. Choose your device, spoken answer preference, and answer style. "
        "Then activate Finish setup.",
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
    st.checkbox(
        "Automatically speak answers",
        key="auto_speak",
        on_change=apply_auto_speak_change,
    )
    st.selectbox(
        "Answer style",
        ["Step-by-step", "Short and direct", "Detailed", "Conversational"],
        key="detail",
    )

    if st.button("Finish setup and open Access AI", type="primary"):
        st.session_state.onboarded = True
        clear_setup_audio()
        st.rerun()
    st.stop()


# -------------------------
# MAIN APP
# -------------------------
st.title("🔊 Access AI")

api_available = bool(api_key())
if not api_available:
    st.warning(
        "AI answers, image analysis, transcription, and speech are unavailable "
        "until an OpenAI API key is configured. Setup and preferences still work."
    )

if st.session_state.vision == "Blind":
    st.info(
        "Voice-first mode is active. With TalkBack, swipe through controls and "
        "double-tap anywhere to activate the focused control."
    )
elif "low vision" in st.session_state.vision.lower():
    st.info("Low-vision mode is active. Controls are large and spoken answers are available.")

with st.expander("Accessibility and voice preferences"):
    st.selectbox(
        "Vision",
        ["Blind", "Severe low vision", "Low vision", "Sighted caregiver", "Prefer not to say"],
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
    st.checkbox("Allow web research when useful", key="web_search")
    st.checkbox(
        "Automatically speak answers",
        key="auto_speak",
        on_change=apply_auto_speak_change,
    )
    st.selectbox(
        "AI voice",
        ["cedar", "marin", "coral", "alloy", "ash", "nova", "sage", "shimmer", "verse", "onyx"],
        key="voice",
    )

    if st.button("Run accessible setup again"):
        st.session_state.onboarded = False
        st.session_state.step = 0
        clear_setup_audio()
        st.rerun()


# -------------------------
# CAMERA + READ MODE
# -------------------------
st.header("📷 Camera assistance")

mode = st.selectbox(
    "Camera task",
    ["Read text / mail", "Describe scene", "Find / inspect"],
)

st.write(
    {
        "Read text / mail": "Letters, bills, menus, receipts, labels, signs, and printed information.",
        "Describe scene": "A practical nonvisual description of what is in front of the camera.",
        "Find / inspect": "Ask about a particular object, control, button, or item.",
    }[mode]
)

photo = st.camera_input("Take a picture")
st.caption(
    "If this device has no camera or camera permission is denied, continue with "
    "the text question area below."
)
camera_question = st.text_input(
    "Optional question about the picture",
    placeholder="Example: How much is due and when?",
)

if photo is not None and st.button("Analyze picture", type="primary"):
    try:
        with st.spinner("Analyzing picture…"):
            answer = analyze_image(photo.getvalue(), mode, camera_question)
        st.session_state.camera_answer = answer
        prepare_camera_speech(answer)

        st.rerun()
    except Exception as error:
        st.error(capability_error("Camera analysis", error))

if st.session_state.camera_answer:
    st.subheader("Camera result")
    st.markdown(st.session_state.camera_answer)


# -------------------------
# VOICE INPUT
# -------------------------
st.divider()
st.header("🎙️ Ask by voice")

audio = st.audio_input(
    "Record your question",
    sample_rate=16000,
    key="voice_recorder",
    disabled=not api_available,
)

if not api_available:
    st.caption("Voice recording requires configured API access. Text input remains available.")

if audio is not None:
    b = audio.getvalue()
    audio_id = hashlib.sha256(b).hexdigest()
    if audio_id != st.session_state.processed_audio_id:
        try:
            with st.spinner("Listening…"):
                q = transcribe(audio)
            st.session_state.processed_audio_id = audio_id
            st.session_state.last_transcript = q
            if q:
                process_question(q)
                st.rerun()
        except Exception as error:
            st.error(capability_error("Voice question", error))

if st.session_state.last_transcript:
    st.caption("Most recent voice transcript: " + st.session_state.last_transcript)


# -------------------------
# TEXT / BRAILLE INPUT
# -------------------------
st.header("⌨️ Type or use a Braille keyboard")

with st.form("ask_form", clear_on_submit=True):
    q = st.text_area("Your question", height=100)
    submitted = st.form_submit_button("Ask Access AI")

if submitted and not q.strip():
    st.warning("Enter a question before activating Ask Access AI.")

if submitted and q.strip():
    try:
        process_question(q)
        st.rerun()
    except Exception as error:
        st.error(capability_error("Your question", error))


# -------------------------
# CONVERSATION
# -------------------------
st.header("Conversation")

for m in st.session_state.messages:
    with st.chat_message(m["role"]):
        st.markdown(m["content"])


# -------------------------
# SPOKEN ANSWER
# -------------------------
if st.session_state.voice_notice:
    st.warning(st.session_state.voice_notice)

if st.session_state.last_audio:
    st.header("🔊 Spoken answer")
    st.caption("The voice below is AI-generated.")
    st.audio(st.session_state.last_audio, format="audio/mp3", autoplay=True)

    c1, c2 = st.columns(2)
    with c1:
        if st.button("🔁 Repeat last spoken answer"):
            try:
                text_to_repeat = st.session_state.last_audio_text
                if text_to_repeat:
                    st.session_state.last_audio = speech(text_to_repeat)
                    st.session_state.voice_notice = None
                    st.rerun()
            except Exception as error:
                st.error(capability_error("Spoken answer", error))
    with c2:
        if st.button("🛑 Stop speaking"):
            st.session_state.last_audio = None
            st.rerun()
elif st.session_state.last_audio_text and st.session_state.auto_speak:
    if st.button("🔊 Speak latest answer"):
        try:
            with st.spinner("Preparing spoken answer…"):
                st.session_state.last_audio = speech(st.session_state.last_audio_text)
            st.session_state.voice_notice = None
            st.rerun()
        except Exception as error:
            st.error(capability_error("Spoken answer", error))

st.caption(
    "Access AI prototype. Camera assistance is not guaranteed navigation or safety guidance. "
    "Verify uncertain medication, hazard, financial, legal, or navigation details."
)
