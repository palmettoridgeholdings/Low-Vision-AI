import { AccessibilityInfo } from "react-native";

import { createStore } from "@/utils/createStore";

/**
 * "unknown" is the deliberate initial value — before the very first
 * `AccessibilityInfo.isScreenReaderEnabled()` check resolves, this app must
 * never assume a screen reader is either on or off (blind-first
 * accessibility pass, requirement 1). Guidance that depends on this value
 * (see spokenGuidanceController and the Welcome screen) treats "unknown" the
 * same as "disabled" — the safe default that keeps every existing control
 * and announcement working exactly as before — and only changes behavior
 * once a real answer ("enabled" or "disabled") is known.
 */
export type ScreenReaderStatus = "unknown" | "enabled" | "disabled";

export interface ScreenReaderStatusSnapshot {
  status: ScreenReaderStatus;
}

/**
 * Single app-wide detector for whether a screen reader (TalkBack/VoiceOver)
 * is active, built the same way as spokenGuidanceController: plain closures
 * over a createStore instance, never a class, since `getSnapshot`/`subscribe`
 * are handed to useSyncExternalStore as bare function references.
 *
 * Detection is used only to choose the right guidance/announcement channel
 * (see spokenGuidanceController) — never to remove or gate away any control
 * or functionality. A totally blind user with TalkBack disabled (or a
 * detection failure) still gets full offline device-TTS guidance; enabling
 * TalkBack only switches that guidance over to native accessibility
 * announcements so the two don't talk over each other.
 */
function createScreenReaderStatusService() {
  const store = createStore<ScreenReaderStatusSnapshot>({ status: "unknown" });
  let nativeSubscription: { remove: () => void } | null = null;

  function applyResult(enabled: boolean): void {
    const nextStatus: ScreenReaderStatus = enabled ? "enabled" : "disabled";
    // createStore only skips notifying listeners on reference equality, so
    // guard on the actual value here to avoid a redundant notification when
    // a repeated check/event reports the same status as before.
    if (store.getState().status === nextStatus) {
      return;
    }
    store.setState({ status: nextStatus });
  }

  /** Re-runs the native check. Safe to call anytime, including repeatedly (e.g. on returning from Settings). Never rejects. */
  function refresh(): void {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(applyResult)
      .catch(() => {
        // A failed check must never be reported as "disabled" — leave the
        // last known value (possibly still "unknown") rather than guessing.
      });
  }

  function ensureListening(): void {
    if (nativeSubscription) {
      return;
    }
    nativeSubscription = AccessibilityInfo.addEventListener("screenReaderChanged", applyResult);
    refresh();
  }

  /** Removes the native listener. Intended for test teardown/module-isolation; the running app never needs to call this. */
  function teardown(): void {
    nativeSubscription?.remove();
    nativeSubscription = null;
  }

  function getSnapshot(): ScreenReaderStatusSnapshot {
    return store.getState();
  }

  function subscribe(listener: () => void): () => void {
    return store.subscribe(listener);
  }

  ensureListening();

  return { getSnapshot, subscribe, refresh, teardown };
}

export const screenReaderStatusService = createScreenReaderStatusService();
