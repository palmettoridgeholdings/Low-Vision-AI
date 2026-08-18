import os
import tempfile
import base64
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
    "camera_answer": None,
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v


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


def ask_text():
    kwargs = {
        "model": MODEL,
        "reasoning": {"effort": "low"},
        "instructions": instructions(),
        "input": [
            {"role": m["role"], "content": m["content"]}
            for m in st.session_state.messages[-12:]
        ],
    }
    if st.session_state.web_search:
        kwargs["tools"] = [{"type": "web_search", "search_context_size": "low"}]
    return client().responses.create(**kwargs).output_text


def process_question(q):
    q = q.strip()
    if not q:
        return
    st.session_state.messages.append({"role": "user", "content": q})
    with st.spinner("Thinking…"):
        answer = ask_text()
    st.session_state.messages.append({"role": "assistant", "content": answer})

    if st.session_state.auto_speak:
        with st.spinner("Preparing spoken answer…"):
            st.session_state.last_audio = speech(answer)


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


def play_setup_audio(text):
    try:
        st.session_state.setup_audio = speech(text)
    except Exception:
        st.session_state.setup_audio = None


# -------------------------
# ACCESSIBLE FIRST-RUN SETUP
# -------------------------
if not st.session_state.onboarded:
    st.title("🔊 Welcome to Access AI")
    st.write("This setup is designed to be completed without sight.")

    step = st.session_state.step

    if step == 0:
        text = (
            "Welcome to Access AI. This setup can be completed without sight. "
            "If you use TalkBack, swipe right until you hear Start accessible setup, "
            "then double tap anywhere to activate it."
        )
        if st.session_state.setup_audio is None:
            play_setup_audio(text)
        if st.session_state.setup_audio:
            st.caption("AI-generated spoken setup instructions")
            st.audio(st.session_state.setup_audio, format="audio/mp3", autoplay=True)

        if st.button("Start accessible setup", type="primary"):
            st.session_state.step = 1
            st.session_state.setup_audio = None
            st.rerun()
        st.stop()

    if step == 1:
        st.header("1 of 3 — Vision")
        st.radio(
            "Vision preference",
            ["Blind", "Severe low vision", "Low vision", "Sighted caregiver", "Prefer not to say"],
            key="vision",
        )
        if st.session_state.setup_audio is None:
            play_setup_audio(
                "Step one. Choose the vision option that best matches how you want "
                "Access AI to assist you. Then activate Continue."
            )
        if st.session_state.setup_audio:
            st.audio(st.session_state.setup_audio, format="audio/mp3", autoplay=True)

        if st.button("Continue", type="primary"):
            st.session_state.step = 2
            st.session_state.setup_audio = None
            st.rerun()
        st.stop()

    if step == 2:
        st.header("2 of 3 — Interaction")
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
        if st.session_state.setup_audio is None:
            play_setup_audio(
                "Step two. Choose voice first, screen reader and keyboard, refreshable Braille, "
                "large text, or combination. Then activate Continue."
            )
        if st.session_state.setup_audio:
            st.audio(st.session_state.setup_audio, format="audio/mp3", autoplay=True)

        if st.button("Continue", type="primary"):
            st.session_state.step = 3
            st.session_state.setup_audio = None
            st.rerun()
        st.stop()

    st.header("3 of 3 — Device and answers")
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
    st.checkbox("Automatically speak answers", key="auto_speak")
    st.selectbox(
        "Answer style",
        ["Step-by-step", "Short and direct", "Detailed", "Conversational"],
        key="detail",
    )

    if st.session_state.setup_audio is None:
        play_setup_audio(
            "Final step. Choose your device, spoken answer preference, and answer style. "
            "Then activate Finish setup."
        )
    if st.session_state.setup_audio:
        st.audio(st.session_state.setup_audio, format="audio/mp3", autoplay=True)

    if st.button("Finish setup and open Access AI", type="primary"):
        st.session_state.onboarded = True
        st.session_state.setup_audio = None
        st.rerun()
    st.stop()


# -------------------------
# MAIN APP
# -------------------------
st.title("🔊 Access AI")

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
    st.checkbox("Automatically speak answers", key="auto_speak")
    st.selectbox(
        "AI voice",
        ["cedar", "marin", "coral", "alloy", "ash", "nova", "sage", "shimmer", "verse", "onyx"],
        key="voice",
    )

    if st.button("Run accessible setup again"):
        st.session_state.onboarded = False
        st.session_state.step = 0
        st.session_state.setup_audio = None
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
camera_question = st.text_input(
    "Optional question about the picture",
    placeholder="Example: How much is due and when?",
)

if photo is not None and st.button("Analyze picture", type="primary"):
    try:
        with st.spinner("Analyzing picture…"):
            answer = analyze_image(photo.getvalue(), mode, camera_question)
        st.session_state.camera_answer = answer

        if st.session_state.auto_speak:
            with st.spinner("Preparing spoken camera answer…"):
                st.session_state.last_audio = speech(answer)

        st.rerun()
    except Exception as e:
        st.error(f"Camera analysis error: {e}")

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
)

if audio is not None:
    b = audio.getvalue()
    audio_id = f"{len(b)}-{hash(b[:128])}"
    if audio_id != st.session_state.processed_audio_id:
        try:
            with st.spinner("Listening…"):
                q = transcribe(audio)
            st.session_state.processed_audio_id = audio_id
            st.session_state.last_transcript = q
            if q:
                process_question(q)
                st.rerun()
        except Exception as e:
            st.error(f"Voice error: {e}")

if st.session_state.last_transcript:
    st.caption("Most recent voice transcript: " + st.session_state.last_transcript)


# -------------------------
# TEXT / BRAILLE INPUT
# -------------------------
st.header("⌨️ Type or use a Braille keyboard")

with st.form("ask_form", clear_on_submit=True):
    q = st.text_area("Your question", height=100)
    submitted = st.form_submit_button("Ask Access AI")

if submitted and q.strip():
    try:
        process_question(q)
        st.rerun()
    except Exception as e:
        st.error(f"Request error: {e}")


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
answers = [m["content"] for m in st.session_state.messages if m["role"] == "assistant"]

if st.session_state.last_audio:
    st.header("🔊 Spoken answer")
    st.caption("The voice below is AI-generated.")
    st.audio(st.session_state.last_audio, format="audio/mp3", autoplay=True)

    c1, c2 = st.columns(2)
    with c1:
        if st.button("🔁 Repeat last spoken answer"):
            try:
                text_to_repeat = (
                    st.session_state.camera_answer
                    if st.session_state.camera_answer
                    else (answers[-1] if answers else "")
                )
                if text_to_repeat:
                    st.session_state.last_audio = speech(text_to_repeat)
                    st.rerun()
            except Exception as e:
                st.error(f"Speech error: {e}")
    with c2:
        if st.button("🛑 Stop speaking"):
            st.session_state.last_audio = None
            st.rerun()

st.caption(
    "Access AI prototype. Camera assistance is not guaranteed navigation or safety guidance. "
    "Verify uncertain medication, hazard, financial, legal, or navigation details."
)
