const CONTROLLER_PROPERTY = "__accessAiPersistentSpeechControllerV1";

function createController(component) {
  const { parentElement } = component;
  const audio = parentElement.querySelector("#access-setup-audio");
  const status = parentElement.querySelector("#access-voice-status");
  const instructionText = parentElement.querySelector("#access-instruction-text");
  const unlock = parentElement.querySelector("#access-unlock");
  const pauseResume = parentElement.querySelector("#access-pause-resume");
  const repeat = parentElement.querySelector("#access-repeat");
  const stop = parentElement.querySelector("#access-stop");
  const restore = parentElement.querySelector("#access-restore");

  const state = {
    commandId: null,
    playbackId: null,
    instructionId: null,
    currentViewInstructionId: null,
    speechMode: "access_ai",
    playInFlight: false,
    repeatCount: 0,
    diagnostics: [],
    setStateValue: component.setStateValue,
  };

  function eventId(name) {
    const randomPart = globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${state.playbackId || "none"}:${name}:${randomPart}`;
  }

  function emit(name, source, errorName = "") {
    state.diagnostics.push({
      event_id: eventId(name),
      name,
      instruction_id: state.instructionId || "",
      playback_id: state.playbackId || "",
      command_id: state.commandId || "",
      source,
      error_name: errorName,
    });
    state.diagnostics = state.diagnostics.slice(-30);
    state.setStateValue("diagnostics", state.diagnostics.slice());
  }

  function announce(message) {
    status.textContent = message;
  }

  function updateControls() {
    const speechDisabled = state.speechMode === "screen_reader_only";
    pauseResume.hidden = speechDisabled;
    repeat.hidden = speechDisabled;
    stop.hidden = speechDisabled;
    restore.hidden = !speechDisabled;
    pauseResume.textContent = audio.paused ? "Resume voice" : "Pause voice";
  }

  function showUnlock() {
    unlock.hidden = false;
    announce("Spoken setup is ready. Tap anywhere or press Enter or Space to begin.");
    requestAnimationFrame(() => unlock.focus({ preventScroll: true }));
  }

  function preserveUnlockFocus() {
    if (!unlock.hidden) {
      requestAnimationFrame(() => unlock.focus({ preventScroll: true }));
    }
  }

  async function play(source) {
    if (!audio.src || state.speechMode !== "access_ai" || state.playInFlight) {
      return;
    }
    state.playInFlight = true;
    emit("play_attempt", source);
    try {
      await audio.play();
      unlock.hidden = true;
      announce("Access AI spoken instruction is playing.");
      emit("play_started", source);
    } catch (error) {
      const errorName = error?.name || "PlaybackError";
      if (errorName === "NotAllowedError") {
        emit("play_blocked", source, errorName);
      } else {
        emit("play_failed", source, errorName);
      }
      showUnlock();
    } finally {
      state.playInFlight = false;
      updateControls();
    }
  }

  function stopCurrent(source, emitEvent = true) {
    audio.pause();
    audio.currentTime = 0;
    if (emitEvent) {
      emit("voice_stopped", source);
    }
  }

  unlock.onclick = () => play("unlock_control");
  unlock.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      play("unlock_keyboard");
    }
  };

  pauseResume.onclick = () => {
    if (audio.paused) {
      play("resume_control").then(() => {
        if (!audio.paused) {
          announce("Access AI speech resumed.");
          emit("play_resumed", "resume_control");
        }
      });
    } else {
      audio.pause();
      announce("Access AI speech paused.");
      emit("play_paused", "pause_control");
      updateControls();
    }
  };

  repeat.onclick = () => {
    state.repeatCount += 1;
    audio.currentTime = 0;
    announce("Repeating the current instruction.");
    emit("play_repeated", `repeat_control_${state.repeatCount}`);
    play("repeat_control");
  };

  stop.onclick = () => {
    state.speechMode = "screen_reader_only";
    state.setStateValue("speech_mode", state.speechMode);
    stopCurrent("stop_control");
    unlock.hidden = true;
    announce("Access AI speech stopped. Screen-reader-only operation is active.");
    updateControls();
  };

  restore.onclick = () => {
    state.speechMode = "access_ai";
    state.setStateValue("speech_mode", state.speechMode);
    announce("Access AI speech restored.");
    emit("voice_restored", "restore_control");
    updateControls();
    if (state.instructionId === state.currentViewInstructionId) {
      play("restore_control");
    } else {
      announce("Preparing the current Access AI spoken instruction.");
    }
  };

  audio.addEventListener("ended", () => {
    announce("Spoken instruction complete.");
    emit("play_ended", "media_event");
    updateControls();
  });
  audio.addEventListener("stalled", () => emit("audio_stalled", "media_event"));
  audio.addEventListener("abort", () => emit("audio_aborted", "media_event"));
  audio.addEventListener("pause", updateControls);
  audio.addEventListener("play", updateControls);

  return {
    update(nextComponent) {
      state.setStateValue = nextComponent.setStateValue;
      const data = nextComponent.data || {};
      instructionText.textContent = data.visible_text || "";
      state.currentViewInstructionId = data.instruction_id || null;

      let restoreFromServerModeChange = false;
      if (data.speech_mode !== state.speechMode) {
        state.speechMode = data.speech_mode;
        state.setStateValue("speech_mode", state.speechMode);
        if (state.speechMode === "screen_reader_only") {
          stopCurrent("server_mode_change", false);
          unlock.hidden = true;
          announce("Screen-reader-only operation is active.");
        } else {
          restoreFromServerModeChange = true;
        }
      }

      updateControls();
      if (!data.command_id || data.command_id === state.commandId) {
        if (
          restoreFromServerModeChange &&
          state.instructionId === state.currentViewInstructionId
        ) {
          play("server_mode_change");
        }
        preserveUnlockFocus();
        return;
      }

      audio.pause();
      state.commandId = data.command_id;
      state.playbackId = data.playback_id;
      state.instructionId = data.instruction_id;
      state.repeatCount = 0;
      audio.src = `data:${data.audio_format};base64,${data.audio_b64}`;
      audio.currentTime = 0;
      announce("Preparing the next Access AI spoken instruction.");

      if (state.speechMode === "access_ai") {
        play("instruction_command");
      }
    },
  };
}

export default function(component) {
  const { parentElement } = component;
  let controller = parentElement[CONTROLLER_PROPERTY];
  if (!controller) {
    controller = createController(component);
    parentElement[CONTROLLER_PROPERTY] = controller;
  }
  controller.update(component);
}
