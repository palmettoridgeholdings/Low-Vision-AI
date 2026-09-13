import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useSpokenGuidance } from "@/hooks/useSpokenGuidance";

export interface UseSpeechResult {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Thin, lifecycle-safe wrapper around the app-wide spoken-guidance
 * controller (src/services/speech/spokenGuidanceController.ts). Kept as a
 * separate hook — rather than having every call site use
 * useSpokenGuidance() directly — so existing call sites and tests keep this
 * exact, minimal shape; anything that needs speech state (e.g. a "Stop
 * speech" button that disables itself once nothing is playing) or the
 * repeat-last-prompt control should use useSpokenGuidance() instead.
 *
 * Stops speech automatically when the app leaves the foreground (an
 * interruption such as a phone call also backgrounds the app first), and on
 * unmount, so a screen can never leave speech running after the user has
 * moved away from it.
 */
export function useSpeech(): UseSpeechResult {
  const { isSpeaking, speak, stop } = useSpokenGuidance();

  useEffect(() => {
    const handleAppStateChange = (status: AppStateStatus) => {
      if (status !== "active") {
        void stop();
      }
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      void stop();
    };
    // Intentionally run only on mount/unmount: `stop` is stable for the lifetime of this hook instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isSpeaking, speak, stop };
}
