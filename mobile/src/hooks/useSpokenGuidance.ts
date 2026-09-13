import { useSyncExternalStore } from "react";

import {
  spokenGuidanceController,
  type SpokenGuidanceSnapshot,
} from "@/services/speech/spokenGuidanceController";

export interface UseSpokenGuidanceResult extends SpokenGuidanceSnapshot {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
  repeat: () => Promise<void>;
}

/**
 * Reactive access to the single app-wide spoken-guidance controller (see
 * src/services/speech/spokenGuidanceController.ts). Prefer this over calling
 * the controller directly whenever a component needs to render the current
 * speech state (e.g. disabling a "Stop speech" button once nothing is
 * playing) or offer a "Repeat" control that repeats whatever was last
 * spoken, from any screen.
 */
export function useSpokenGuidance(): UseSpokenGuidanceResult {
  const snapshot = useSyncExternalStore(
    spokenGuidanceController.subscribe,
    spokenGuidanceController.getSnapshot,
    spokenGuidanceController.getSnapshot,
  );

  return {
    ...snapshot,
    isSpeaking: snapshot.state === "playing" || snapshot.state === "preparing",
    speak: (text: string) => spokenGuidanceController.speak(text),
    stop: () => spokenGuidanceController.stop(),
    repeat: () => spokenGuidanceController.repeatLast(),
  };
}
