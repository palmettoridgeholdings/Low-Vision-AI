"""Blind-first onboarding data, state helpers, and local speech component."""

from pathlib import Path
import streamlit.components.v1 as components

VISION_OPTIONS = {
    "totally_blind": "Totally blind / no useful vision",
    "severe_low_vision": "Severe low vision", "low_vision": "Low vision",
    "sighted_caregiver": "Sighted caregiver", "prefer_not_to_say": "Prefer not to say",
}
INTERACTION_OPTIONS = ["Voice first", "Screen reader and touch", "Refreshable Braille", "Large text", "Combination"]
DEVICE_OPTIONS = ["Android / TalkBack", "iPhone / VoiceOver", "Windows / NVDA", "Windows / JAWS", "Mac / VoiceOver", "Other / Not sure"]
ANSWER_STYLES = ["Short and direct", "Step-by-step", "Detailed", "Conversational"]
SETUP_STEPS = ("welcome", "vision", "interaction", "device", "answers", "confirmation")
SETUP_SPEECH = {
    "welcome": "Welcome to Access AI. This setup can be completed without sight. To start spoken setup, activate Start spoken setup. If you use TalkBack or VoiceOver, navigate to Start spoken setup and double-tap.",
    "vision": "First, choose the vision option that best describes how you want Access AI to assist you. Totally blind or no useful vision is recommended for this route.",
    "interaction": "Choose your primary interaction. Voice first is recommended, but all options remain available.",
    "device": "Choose your device and screen reader, or choose Other or Not sure.",
    "answers": "Choose automatic speech, spoken confirmations, and your answer style.",
    "confirmation": "Review your complete accessibility profile before finishing setup.",
}
RECOMMENDED_BLIND_DEFAULTS = {"vision_profile": "totally_blind", "interaction": "Voice first", "auto_speak": True, "spoken_confirmations": True, "detail": "Short and direct"}

def apply_profile_defaults(state, profile):
    """Apply profile recommendations once; callers may subsequently override them."""
    state["vision_profile"] = profile
    if profile == "totally_blind":
        state.update(RECOMMENDED_BLIND_DEFAULTS)

def profile_summary(state):
    vision = VISION_OPTIONS.get(state["vision_profile"], "Prefer not to say")
    speech = "automatic spoken answers" if state["auto_speak"] else "answers not spoken automatically"
    confirmations = "spoken confirmations" if state["spoken_confirmations"] else "no spoken confirmations"
    return f"Access AI is set for {vision.lower()}, {state['interaction'].lower()} interaction, {state['platform']}, {speech}, {confirmations}, and {state['detail'].lower()} responses."

def next_step(step):
    index = SETUP_STEPS.index(step)
    return SETUP_STEPS[min(index + 1, len(SETUP_STEPS) - 1)]

_COMPONENT_PATH = Path(__file__).parent / "components" / "spoken_setup"
_spoken_setup_component = components.declare_component("spoken_setup", path=str(_COMPONENT_PATH))

def spoken_setup_player(text, step_id, *, speak):
    """Offer best-effort browser speech; semantic page text remains authoritative."""
    return _spoken_setup_component(speech_text=text, speech_token=step_id, speak=bool(speak), repeat_label="Repeat this setup instruction", default=None, key=f"spoken_setup_player_{step_id}", tab_index=0)
