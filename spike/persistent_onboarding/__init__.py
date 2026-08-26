"""Persistent spoken-onboarding technical spike with lazy Streamlit imports."""


def feature_enabled() -> bool:
    from .prototype import feature_enabled as _feature_enabled

    return _feature_enabled()


def render_persistent_onboarding() -> None:
    # V2 components must be registered inside the active Streamlit script context.
    from .prototype import render_persistent_onboarding as _render

    _render()


__all__ = ["feature_enabled", "render_persistent_onboarding"]
