import { useSyncExternalStore } from "react";

import {
  screenReaderStatusService,
  type ScreenReaderStatus,
} from "@/services/accessibility/screenReaderStatusService";

/**
 * Reactive access to whether a screen reader (TalkBack/VoiceOver) is
 * currently active. Returns "unknown" until the first native check
 * resolves — never assume "enabled" or "disabled" before then (blind-first
 * accessibility pass, requirement 1).
 *
 * Subscribing/unsubscribing is handled entirely by useSyncExternalStore,
 * which calls the store's returned unsubscribe function on unmount, so a
 * component using this hook never leaks a listener.
 */
export function useScreenReaderStatus(): ScreenReaderStatus {
  const snapshot = useSyncExternalStore(
    screenReaderStatusService.subscribe,
    screenReaderStatusService.getSnapshot,
    screenReaderStatusService.getSnapshot,
  );
  return snapshot.status;
}
