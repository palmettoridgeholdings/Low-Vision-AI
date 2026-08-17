import os
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

APP_NAME = "Access AI"
MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6")
PROMPT_PATH = Path(__file__).parent / "prompts" / "system_prompt.txt"

st.set_page_config(
    page_title=APP_NAME,
    page_icon="🔊",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# Keep styling simple and high contrast. We deliberately avoid visual-only cues.
st.markdown(
    """
    <style>
      .block-container {max-width: 850px; padding-top: 1.25rem;}
      div.stButton > button {
          min-height: 3.5rem;
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
        "interaction": "Screen reader and keyboard",
        "platform": "Android / TalkBack",
        "detail": "Step-by-step",
        "web_search": True,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

def load_base_prompt():
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
    items = []
    for message in st.session_state.messages[-12:]:
        items.append(
            {
                "role": message["role"],
                "content": message["content"],
            }
        )
    return items

def ask_model():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Add it to a local .env file "
            "or to Streamlit Community Cloud secrets/environment variables."
        )

    client = OpenAI(api_key=api_key)

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

def clear_chat():
    st.session_state.messages = []

init_state()

st.title("🔊 Access AI")
st.write(
    "An AI assistant designed to answer from an accessibility-aware, "
    "nonvisual perspective."
)

with st.expander("Accessibility preferences", expanded=False):
    st.selectbox(
        "Vision",
        ["Blind", "Low vision", "Severe low vision", "Sighted caregiver", "Prefer not to say"],
        key="vision",
        help="Used to adapt instructions and recommendations.",
    )

    st.selectbox(
        "Primary interaction",
        [
            "Screen reader and keyboard",
            "Voice first",
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
        help=(
            "When enabled, the AI can search the web for current information, "
            "including accessibility information when it affects the answer."
        ),
    )

st.divider()

if not st.session_state.messages:
    st.info(
        "Try: “Help me choose a microwave that is easy to use without sight.”"
    )

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

with st.form("ask_form", clear_on_submit=True):
    question = st.text_area(
        "Your question",
        placeholder="Type your question here…",
        height=130,
        key="question_box",
    )
    submitted = st.form_submit_button("Ask Access AI")

if submitted:
    cleaned = question.strip()

    if not cleaned:
        st.warning("Please enter a question.")
    else:
        st.session_state.messages.append({"role": "user", "content": cleaned})

        try:
            with st.spinner("Thinking…"):
                answer = ask_model()
        except Exception as exc:
            answer = (
                "I couldn't complete that request because the app encountered an error.\n\n"
                f"Technical detail: `{exc}`"
            )

        st.session_state.messages.append({"role": "assistant", "content": answer})
        st.rerun()

st.button("Clear conversation", on_click=clear_chat)

st.caption(
    "Prototype note: Access AI should never replace professional medical, "
    "legal, mobility, or safety guidance. Uncertain visual or safety-critical "
    "information should be verified."
)
