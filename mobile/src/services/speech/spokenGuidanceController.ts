import { AccessibilityInfo } from "react-native";

import { screenReaderStatusService } from "@/services/accessibility/screenReaderStatusService";
import { deviceTtsService } from "@/services/speech/deviceTtsService";
import { createStore } from "@/utils/createStore";

/**
 * Lifecycle of the spoken-guidance controller:
 * - "ready": nothing has been spoken yet, or the last utterance finished/was stopped cleanly.
 * - "preparing": a speak() call is in flight, cancelling whatever was playing before.
 * - "playing": on-device TTS is actively producing audio.
 * - "stopped": the last utterance was explicitly stopped (by this controller or a new speak()).
 * - "error": the last utterance failed to start or play.
 */
export type SpokenGuidanceState = "ready" | "preparing" | "playing" | "stopped" | "error";

export interface SpokenGuidanceSnapshot {
  state: SpokenGuidanceState;
  /** The most recently requested utterance, kept for repeatLast() — set even if it later errors. */
  lastPrompt: string | null;
}

/**
 * Single app-wide spoken-guidance controller (requirement: "a reusable
 * spoken-guidance controller ... preventing simultaneous/stale speech across
 * screen navigation").
 *
 * Every screen speaks through this one instance rather than calling
 * deviceTtsService directly, so:
 *  - starting a new utterance always cancels whatever was queued/playing
 *    before it (expo-speech's native queue would otherwise play both, one
 *    after another, which reads as overlapping/garbled speech to the user);
 *  - a monotonically increasing token invalidates any in-flight callback from
 *    a superseded speak() call, so a slow onDone/onError from an utterance
 *    the user has already moved past can never overwrite the state that a
 *    newer utterance (possibly on a different screen) has already reached —
 *    this is the "no stale speech across navigation" guarantee.
 *
 * Built as plain closures (like src/utils/createStore.ts) rather than a
 * class: `speak`/`stop`/`getSnapshot`/`subscribe` are handed around and
 * called as bare function references (e.g. by useSyncExternalStore), which
 * would silently break if they depended on a `this` binding.
 *
 * This never throws: speech is always a supplementary channel alongside
 * on-screen text and TalkBack/keyboard/Braille navigation, so a failure here
 * must never block navigation or any other control (see
 * docs/BLIND_FIRST_ONBOARDING_SPEC.md section 10, "Failure Behavior").
 *
 * Screen-reader awareness (blind-first accessibility pass, requirement 2 —
 * "avoid competing speech"): every call site in this app (onboarding
 * guidance, status narration, selection confirmations, and spoken answers
 * alike) keeps calling speak() exactly as before — nothing about *whether*
 * to speak changes here, so the user's explicit settings (e.g. "Automatically
 * speak answers") are preserved untouched. What changes is *how* the
 * utterance is delivered: while a screen reader is active, on-device TTS
 * would play as a second, independent audio stream fighting TalkBack's own
 * speech for the same output, so this controller hands the same text to
 * `AccessibilityInfo.announceForAccessibility()` instead — TalkBack's own
 * announcement channel — rather than starting deviceTtsService. Once the
 * screen reader is off (or not yet detected), behavior is unchanged from
 * before this pass.
 */
function createSpokenGuidanceController() {
  const store = createStore<SpokenGuidanceSnapshot>({ state: "ready", lastPrompt: null });
  let token = 0;

  function getSnapshot(): SpokenGuidanceSnapshot {
    return store.getState();
  }

  function subscribe(listener: () => void): () => void {
    return store.subscribe(listener);
  }

  /** Speaks `text`, cancelling any utterance already in flight. Never rejects. */
  async function speak(text: string): Promise<void> {
    const myToken = ++token;
    store.setState({ state: "preparing", lastPrompt: text });

    try {
      // Always stop first: expo-speech (Android TextToSpeech) queues
      // consecutive speak() calls rather than interrupting, so without this
      // a fast sequence of announcements would play back-to-back instead of
      // the latest one replacing the others.
      await deviceTtsService.stop();
    } catch {
      // A failed stop is not fatal — deviceTtsService.speak below will still
      // attempt to speak; worst case the previous utterance also finishes.
    }

    if (myToken !== token) {
      // Superseded by a newer speak()/stop() while we were stopping.
      return;
    }

    if (screenReaderStatusService.getSnapshot().status === "enabled") {
      // Hand off to the screen reader's own announcement channel instead of
      // starting a second, competing audio stream over it. announceForAccessibility
      // has no completion callback, so there is nothing to await here; settle
      // straight into "stopped" (nothing is actively "playing" from this
      // controller's point of view) unless a newer call has already superseded us.
      try {
        AccessibilityInfo.announceForAccessibility(text);
      } catch {
        // A failed native announcement is not fatal — the on-screen text
        // this utterance mirrors is still there for TalkBack to read directly.
      }
      if (myToken === token) {
        store.setState((prev) => ({ ...prev, state: "stopped" }));
      }
      return;
    }

    store.setState((prev) => ({ ...prev, state: "playing" }));

    try {
      await deviceTtsService.speak(text, {
        onDone: () => {
          if (myToken === token) {
            store.setState((prev) => ({ ...prev, state: "stopped" }));
          }
        },
        onError: () => {
          if (myToken === token) {
            store.setState((prev) => ({ ...prev, state: "error" }));
          }
        },
      });
    } catch {
      if (myToken === token) {
        store.setState((prev) => ({ ...prev, state: "error" }));
      }
    }
  }

  /** Stops any in-flight or playing speech and invalidates its callbacks. Never rejects. */
  async function stop(): Promise<void> {
    token += 1;
    try {
      await deviceTtsService.stop();
    } catch {
      // Nothing further to do — there is no other stop mechanism to fall back to.
    }
    store.setState((prev) => ({ ...prev, state: "stopped" }));
  }

  /** Re-speaks the most recent prompt passed to speak(), if any. */
  async function repeatLast(): Promise<void> {
    const { lastPrompt } = store.getState();
    if (lastPrompt) {
      await speak(lastPrompt);
    }
  }

  /** Clears retained prompt state. Intended for explicit session/test reset. */
  function reset(): void {
    token += 1;
    store.setState({ state: "ready", lastPrompt: null });
  }

  return { getSnapshot, subscribe, speak, stop, repeatLast, reset };
}

export const spokenGuidanceController = createSpokenGuidanceController();
