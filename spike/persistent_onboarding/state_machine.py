"""Pure setup-state and redacted player-event helpers for the spike."""

from __future__ import annotations

from enum import StrEnum
from typing import Any


class SetupStage(StrEnum):
    WELCOME = "welcome"
    SPEECH_MODE = "speech_mode"
    VISION = "vision"
    INTERACTION = "interaction"
    DEVICE = "device"
    COMPLETE = "complete"


class SpeechMode(StrEnum):
    ACCESS_AI = "access_ai"
    SCREEN_READER_ONLY = "screen_reader_only"


NEXT_STAGE = {
    SetupStage.WELCOME: SetupStage.SPEECH_MODE,
    SetupStage.SPEECH_MODE: SetupStage.VISION,
    SetupStage.VISION: SetupStage.INTERACTION,
    SetupStage.INTERACTION: SetupStage.DEVICE,
    SetupStage.DEVICE: SetupStage.COMPLETE,
}

KNOWN_DIAGNOSTICS = frozenset(
    {
        "play_attempt",
        "play_started",
        "play_blocked",
        "play_failed",
        "play_ended",
        "play_paused",
        "play_resumed",
        "play_repeated",
        "voice_stopped",
        "voice_restored",
        "audio_stalled",
        "audio_aborted",
    }
)
ALLOWED_EVENT_FIELDS = (
    "event_id",
    "name",
    "instruction_id",
    "playback_id",
    "command_id",
    "source",
    "error_name",
)


def advance(stage: SetupStage) -> SetupStage:
    if stage not in NEXT_STAGE:
        raise ValueError(f"Setup cannot advance from {stage.value!r}.")
    return NEXT_STAGE[stage]


def make_command_ids(manifest_id: str, instruction_id: str, sequence: int) -> tuple[str, str]:
    if sequence < 1:
        raise ValueError("Playback sequence must be positive.")
    return (
        f"{manifest_id}:command:{sequence}",
        f"{manifest_id}:playback:{instruction_id}:{sequence}",
    )


def sanitize_player_event(event: Any) -> dict[str, str] | None:
    """Keep diagnostic names and identifiers, never messages, media, or stacks."""
    if not isinstance(event, dict) or event.get("name") not in KNOWN_DIAGNOSTICS:
        return None

    sanitized: dict[str, str] = {}
    for field in ALLOWED_EVENT_FIELDS:
        value = event.get(field)
        if isinstance(value, (str, int, float, bool)):
            sanitized[field] = str(value)[:160]
    return sanitized if sanitized.get("event_id") else None


def event_matches_playback(
    event: dict[str, str], instruction_id: str, playback_id: str
) -> bool:
    return (
        event.get("instruction_id") == instruction_id
        and event.get("playback_id") == playback_id
    )
