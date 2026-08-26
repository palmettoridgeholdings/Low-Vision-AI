"""Load and validate the versioned spoken-setup instruction manifest."""

from __future__ import annotations

import base64
import hashlib
import json
from functools import lru_cache
from pathlib import Path
from typing import Any


PACKAGE_DIR = Path(__file__).parent
MANIFEST_PATH = PACKAGE_DIR / "instructions.v1.json"
EXPECTED_SCHEMA_VERSION = 1
REQUIRED_INSTRUCTION_IDS = (
    "welcome",
    "speech_mode",
    "vision",
    "interaction",
    "device",
    "complete",
    "recommended_complete",
)


@lru_cache(maxsize=1)
def load_manifest() -> dict[str, Any]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("schema_version") != EXPECTED_SCHEMA_VERSION:
        raise ValueError("Unsupported spoken-setup manifest schema.")
    if manifest.get("content_version") != 2:
        raise ValueError("Unsupported spoken-setup content version.")

    instructions = manifest.get("instructions")
    if not isinstance(instructions, list):
        raise ValueError("Spoken-setup instructions must be a list.")

    by_id = {item.get("id"): item for item in instructions if isinstance(item, dict)}
    if tuple(by_id) != REQUIRED_INSTRUCTION_IDS:
        raise ValueError("Spoken-setup manifest steps are missing or out of order.")

    for instruction_id, item in by_id.items():
        for field in (
            "title",
            "visible_text",
            "speech",
            "audio_file",
            "audio_sha256",
        ):
            if not isinstance(item.get(field), str) or not item[field].strip():
                raise ValueError(
                    f"Instruction {instruction_id!r} has an invalid {field!r}."
                )
        audio_path = (PACKAGE_DIR / item["audio_file"]).resolve()
        if PACKAGE_DIR.resolve() not in audio_path.parents:
            raise ValueError("Spoken-setup audio path leaves the package directory.")
        audio_bytes = audio_path.read_bytes()
        if not audio_bytes.startswith(b"RIFF"):
            raise ValueError(f"Static setup audio for {instruction_id!r} is not WAV data.")
        if hashlib.sha256(audio_bytes).hexdigest() != item["audio_sha256"]:
            raise ValueError(
                f"Static setup audio for {instruction_id!r} does not match its manifest."
            )

    return manifest


def instruction(instruction_id: str) -> dict[str, Any]:
    for item in load_manifest()["instructions"]:
        if item["id"] == instruction_id:
            return item
    raise KeyError(instruction_id)


@lru_cache(maxsize=len(REQUIRED_INSTRUCTION_IDS))
def encoded_audio(instruction_id: str) -> str:
    item = instruction(instruction_id)
    audio_bytes = (PACKAGE_DIR / item["audio_file"]).read_bytes()
    return base64.b64encode(audio_bytes).decode("ascii")
