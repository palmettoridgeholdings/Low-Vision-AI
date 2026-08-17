import os
import tempfile
from pathlib import Path
import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6")
PROMPT_PATH = Path(__file__).parent / "system_prompt.txt"

st.set_page_config(page_title="Access AI", page_icon="🔊", layout="centered")
st.markdown("""<style>
.block-container{max-width:850px;padding-top:1rem}
div.stButton>button{min-height:4.25rem;font-size:1.2rem;font-weight:700;width:100%}
textarea{font-size:1.12rem!important}
</style>""", unsafe_allow_html=True)

defaults = {
    "onboarded": False, "step": 0, "messages": [], "vision": "Blind",
    "interaction": "Voice first", "platform": "Android / TalkBack",
    "detail": "Step-by-step", "web_search": True, "auto_speak": True,
    "voice": "cedar", "last_audio": None, "last_transcript": "",
    "processed_audio_id": None, "setup_audio": None,
}
for k,v in defaults.items():
    if k not in st.session_state: st.session_state[k] = v

def api_key():
    if os.getenv("OPENAI_API_KEY"): return os.getenv("OPENAI_API_KEY")
    try: return st.secrets["OPENAI_API_KEY"]
    except Exception: return None

def client():
    if not api_key(): raise RuntimeError("OPENAI_API_KEY is missing.")
    return OpenAI(api_key=api_key())

def speech(text):
    with client().audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts", voice=st.session_state.voice,
        input=text[:3900],
        instructions="Speak clearly, warmly, and at a calm conversational pace.",
        response_format="mp3"
    ) as r:
        return r.read()

def say_setup(text):
    try: st.session_state.setup_audio = speech(text)
    except Exception: st.session_state.setup_audio = None

def transcribe(audio):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio.getvalue()); path=f.name
    try:
        with open(path,"rb") as f:
            r=client().audio.transcriptions.create(
                model="gpt-4o-mini-transcribe", file=f, response_format="json")
        return r.text.strip()
    finally:
        try: os.remove(path)
        except OSError: pass

def instructions():
    base=PROMPT_PATH.read_text(encoding="utf-8")
    return base+f"""\n\nCURRENT ACCESSIBILITY PROFILE
Vision: {st.session_state.vision}
Primary interaction: {st.session_state.interaction}
Platform/screen reader: {st.session_state.platform}
Answer style: {st.session_state.detail}
"""

def ask():
    kwargs=dict(
        model=MODEL, reasoning={"effort":"low"}, instructions=instructions(),
        input=[{"role":m["role"],"content":m["content"]} for m in st.session_state.messages[-12:]]
    )
    if st.session_state.web_search:
        kwargs["tools"]=[{"type":"web_search","search_context_size":"low"}]
    return client().responses.create(**kwargs).output_text

def process(q):
    q=q.strip()
    if not q:return
    st.session_state.messages.append({"role":"user","content":q})
    with st.spinner("Thinking…"): a=ask()
    st.session_state.messages.append({"role":"assistant","content":a})
    if st.session_state.auto_speak:
        with st.spinner("Preparing spoken answer…"): st.session_state.last_audio=speech(a)

# Accessible first-run onboarding
if not st.session_state.onboarded:
    st.title("🔊 Welcome to Access AI")
    st.write("This setup is designed to be completed without sight.")
    step=st.session_state.step

    if step==0:
        text=("Welcome to Access AI. If you use TalkBack, swipe right until you hear "
              "Start accessible setup, then double tap anywhere to activate it.")
        if st.session_state.setup_audio is None: say_setup(text)
        if st.session_state.setup_audio:
            st.caption("AI-generated spoken setup instructions")
            st.audio(st.session_state.setup_audio,format="audio/mp3",autoplay=True)
        if st.button("Start accessible setup",type="primary"):
            st.session_state.step=1;st.session_state.setup_audio=None;st.rerun()
        st.stop()

    if step==1:
        st.header("1 of 3 — Vision")
        st.radio("Vision preference",
            ["Blind","Severe low vision","Low vision","Sighted caregiver","Prefer not to say"],
            key="vision")
        if st.session_state.setup_audio is None:
            say_setup("Step one. Choose the vision option that best matches how you want Access AI to assist you. Then activate Continue.")
        if st.session_state.setup_audio: st.audio(st.session_state.setup_audio,format="audio/mp3",autoplay=True)
        if st.button("Continue",type="primary"):
            st.session_state.step=2;st.session_state.setup_audio=None;st.rerun()
        st.stop()

    if step==2:
        st.header("2 of 3 — Interaction")
        st.radio("Primary interaction preference",
            ["Voice first","Screen reader and keyboard","Refreshable Braille display","Large text","Combination"],
            key="interaction")
        if st.session_state.setup_audio is None:
            say_setup("Step two. Choose voice first, screen reader and keyboard, refreshable Braille, large text, or combination. Then activate Continue.")
        if st.session_state.setup_audio: st.audio(st.session_state.setup_audio,format="audio/mp3",autoplay=True)
        if st.button("Continue",type="primary"):
            st.session_state.step=3;st.session_state.setup_audio=None;st.rerun()
        st.stop()

    st.header("3 of 3 — Device and answers")
    st.selectbox("Platform or screen reader",
        ["Android / TalkBack","iPhone / VoiceOver","Windows / NVDA","Windows / JAWS","Mac / VoiceOver","Other / Not sure"],
        key="platform")
    st.checkbox("Automatically speak answers",key="auto_speak")
    st.selectbox("Answer style",["Step-by-step","Short and direct","Detailed","Conversational"],key="detail")
    if st.session_state.setup_audio is None:
        say_setup("Final step. Choose your device, spoken answer preference, and answer style. Then activate Finish setup.")
    if st.session_state.setup_audio: st.audio(st.session_state.setup_audio,format="audio/mp3",autoplay=True)
    if st.button("Finish setup and open Access AI",type="primary"):
        st.session_state.onboarded=True;st.session_state.setup_audio=None;st.rerun()
    st.stop()

st.title("🔊 Access AI")
if st.session_state.vision=="Blind":
    st.info("Voice-first mode. With TalkBack, swipe to “Record your question,” then double-tap anywhere to activate it.")
elif "low vision" in st.session_state.vision.lower():
    st.info("Low-vision mode. Controls are large and spoken answers are available.")

with st.expander("Accessibility and voice preferences"):
    st.selectbox("Vision",["Blind","Severe low vision","Low vision","Sighted caregiver","Prefer not to say"],key="vision")
    st.selectbox("Primary interaction",["Voice first","Screen reader and keyboard","Refreshable Braille display","Large text","Combination"],key="interaction")
    st.selectbox("Platform or screen reader",["Android / TalkBack","iPhone / VoiceOver","Windows / NVDA","Windows / JAWS","Mac / VoiceOver","Other / Not sure"],key="platform")
    st.selectbox("Answer style",["Step-by-step","Short and direct","Detailed","Conversational"],key="detail")
    st.checkbox("Allow web research when useful",key="web_search")
    st.checkbox("Automatically speak answers",key="auto_speak")
    st.selectbox("AI voice",["cedar","marin","coral","alloy","ash","nova","sage","shimmer","verse","onyx"],key="voice")
    if st.button("Run accessible setup again"):
        st.session_state.onboarded=False;st.session_state.step=0;st.session_state.setup_audio=None;st.rerun()

st.header("🎙️ Ask by voice")
audio=st.audio_input("Record your question",sample_rate=16000,key="voice_recorder",
    help="Record a spoken question for Access AI.")
if audio is not None:
    b=audio.getvalue(); aid=f"{len(b)}-{hash(b[:128])}"
    if aid!=st.session_state.processed_audio_id:
        try:
            with st.spinner("Listening…"): q=transcribe(audio)
            st.session_state.processed_audio_id=aid;st.session_state.last_transcript=q
            if q: process(q);st.rerun()
        except Exception as e: st.error(f"Voice error: {e}")
if st.session_state.last_transcript:
    st.caption("Most recent voice transcript: "+st.session_state.last_transcript)

st.header("⌨️ Type or use a Braille keyboard")
with st.form("ask_form",clear_on_submit=True):
    q=st.text_area("Your question",height=120)
    submitted=st.form_submit_button("Ask Access AI")
if submitted and q.strip():
    try: process(q);st.rerun()
    except Exception as e: st.error(f"Request error: {e}")

st.header("Conversation")
for m in st.session_state.messages:
    with st.chat_message(m["role"]): st.markdown(m["content"])

answers=[m["content"] for m in st.session_state.messages if m["role"]=="assistant"]
if answers:
    st.header("🔊 Spoken answer")
    if st.session_state.last_audio:
        st.caption("The voice below is AI-generated.")
        st.audio(st.session_state.last_audio,format="audio/mp3",autoplay=True)
    c1,c2=st.columns(2)
    with c1:
        if st.button("🔁 Repeat last answer"):
            st.session_state.last_audio=speech(answers[-1]);st.rerun()
    with c2:
        if st.button("🛑 Stop speaking"):
            st.session_state.last_audio=None;st.rerun()

if st.button("Clear conversation"):
    st.session_state.messages=[];st.session_state.last_audio=None;st.rerun()

st.caption("Web prototype: screen-reader navigation is supported. Rich whole-screen touch exploration and custom haptics are planned for the native mobile version.")
