import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { getServices } from "@/services/serviceRegistry";

export interface UseSpeechResult {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Thin, lifecycle-safe wrapper around the on-device TTS service.
 *
 * Stops speech automatically when the app leaves the foreground (an
 * interruption such as a phone call also backgrounds the app first), and
 * on unmount, so a screen can never leave speech running after the user has
 * moved away from it.
 */
export function useSpeech(): UseSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const tts = getServices().tts;
  const isMountedRef = useRef(true);

  const stop = useCallback(async () => {
    await tts.stop();
    if (isMountedRef.current) {
      setIsSpeaking(false);
    }
  }, [tts]);

  const speak = useCallback(
    async (text: string) => {
      setIsSpeaking(true);
      await tts.speak(text, {
        onDone: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onError: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        },
      });
    },
    [tts],
  );

  useEffect(() => {
    isMountedRef.current = true;

    const handleAppStateChange = (status: AppStateStatus) => {
      if (status !== "active") {
        void stop();
      }
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      void tts.stop();
    };
    // Intentionally run only on mount/unmount: `stop`/`tts` are stable for the lifetime of this hook instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isSpeaking, speak, stop };
}
