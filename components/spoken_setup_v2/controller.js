const controllers = new WeakMap();

function createController(component) {
  const { parentElement, setTriggerValue } = component;
  const status = parentElement.querySelector("[data-status]");
  const diagnostics = parentElement.querySelector("[data-diagnostics]");
  const unlock = parentElement.querySelector('[data-action="unlock"]');
  const state = {
    command: null,
    handledPlaybackIds: new Set(),
    mode: "spoken",
    sequence: 0,
    unlockTimer: null,
  };

  function emit(name, extra = {}) {
    state.sequence += 1;
    const event = {
      id: `${state.command?.playback_id || "none"}:${name}:${state.sequence}`,
      name,
      playback_id: state.command?.playback_id || null,
      step_id: state.command?.step_id || null,
      manifest_version: state.command?.manifest_version || null,
      transport: "browser-speech-synthesis",
      state: state.mode,
      ...extra,
    };
    const item = document.createElement("li");
    item.textContent = `${event.name} | ${event.step_id || "none"} | ${event.playback_id || "none"}`;
    diagnostics.prepend(item);
    while (diagnostics.children.length > 12) diagnostics.lastElementChild.remove();
    setTriggerValue("event", event);
  }

  function clearUnlockTimer() {
    if (state.unlockTimer) window.clearTimeout(state.unlockTimer);
    state.unlockTimer = null;
  }

  function speak(command, reason = "command") {
    state.command = command;
    if (state.mode !== "spoken" || !command?.speech) return;
    if (!("speechSynthesis" in window)) {
      status.textContent = "This browser does not provide offline spoken guidance.";
      emit("transport_unavailable");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(command.speech);
    utterance.onstart = () => {
      clearUnlockTimer();
      unlock.hidden = true;
      status.textContent = "Spoken setup is playing.";
      emit("playback_started", { reason });
    };
    utterance.onpause = () => {
      status.textContent = "Spoken setup is paused.";
      emit("playback_paused");
    };
    utterance.onresume = () => {
      status.textContent = "Spoken setup resumed.";
      emit("playback_resumed");
    };
    utterance.onend = () => {
      status.textContent = "Spoken instruction finished.";
      emit("playback_ended");
    };
    utterance.onerror = (event) => {
      clearUnlockTimer();
      if (event.error === "canceled" || event.error === "interrupted") return;
      status.textContent = "Spoken setup could not start. Activate the start control.";
      unlock.hidden = false;
      emit("playback_blocked", { error_name: String(event.error || "unknown") });
    };
    window.speechSynthesis.speak(utterance);
    state.unlockTimer = window.setTimeout(() => {
      if (!window.speechSynthesis.speaking) {
        unlock.hidden = false;
        status.textContent = "Activate the start control to begin spoken setup.";
        unlock.focus({ preventScroll: true });
        emit("playback_blocked", { error_name: "start_timeout" });
      }
    }, 1200);
  }

  function setMode(mode, announce = true) {
    state.mode = mode;
    if (mode === "stopped") {
      clearUnlockTimer();
      window.speechSynthesis?.cancel();
      status.textContent = "Access AI voice is stopped. Screen-reader speech is unchanged.";
      if (announce) emit("voice_stopped");
    } else if (mode === "spoken") {
      status.textContent = "Access AI voice is restored.";
      if (announce) emit("voice_restored");
      speak(state.command, "restore");
    }
  }

  parentElement.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "pause" && window.speechSynthesis?.speaking) window.speechSynthesis.pause();
      if (action === "resume" && window.speechSynthesis?.paused) window.speechSynthesis.resume();
      if (action === "repeat") speak(state.command, "repeat");
      if (action === "stop") setMode("stopped");
      if (action === "restore" || action === "unlock") setMode("spoken");
    });
  });

  const unmountObserver = new MutationObserver(() => {
    if (!parentElement.isConnected) {
      clearUnlockTimer();
      window.speechSynthesis?.cancel();
      controllers.delete(parentElement);
      unmountObserver.disconnect();
    }
  });
  unmountObserver.observe(document.body, { childList: true, subtree: true });

  return {
    update(data) {
      const command = data?.command || null;
      if (data?.mode === "stopped" && state.mode !== "stopped") setMode("stopped", false);
      if (data?.mode === "spoken" && state.mode !== "spoken") state.mode = "spoken";
      if (!command || state.handledPlaybackIds.has(command.playback_id)) return;
      state.handledPlaybackIds.add(command.playback_id);
      speak(command);
    },
    destroy() {
      clearUnlockTimer();
      window.speechSynthesis?.cancel();
      unmountObserver.disconnect();
    },
  };
}

export default function(component) {
  let controller = controllers.get(component.parentElement);
  if (!controller) {
    controller = createController(component);
    controllers.set(component.parentElement, controller);
  }
  controller.update(component.data);
}
