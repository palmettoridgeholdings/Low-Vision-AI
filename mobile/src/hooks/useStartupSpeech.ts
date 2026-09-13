import { useEffect, useRef } from "react";

import { shouldSpeakStartupMessage } from "@/hooks/startupSpeechDecision";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { useSpeech } from "@/hooks/useSpeech";
import { STARTUP_WELCOME_MESSAGE } from "@/constants/onboardingCopy";

/**
 * Speaks a short welcome message once per app launch, after onboarding and
 * only if the user has left startup speech enabled (default on — see
 * DEFAULT_SETTINGS in src/types/onboarding.ts). Uses on-device TTS only,
 * never an AI/network call, per the MVP requirement that startup speech
 * must not depend on any backend.
 */
export function useStartupSpeech(): void {
  const { hydrated, onboarding, settings } = usePersistedAppState();
  const { speak } = useSpeech();
  const hasSpokenThisSessionRef = useRef(false);

  useEffect(() => {
    const decision = shouldSpeakStartupMessage({
      hasHydrated: hydrated,
      onboardingCompleted: onboarding.completed,
      startupSpeechEnabled: settings.startupSpeechEnabled,
      hasAlreadySpokenThisSession: hasSpokenThisSessionRef.current,
    });

    if (decision) {
      hasSpokenThisSessionRef.current = true;
      void speak(STARTUP_WELCOME_MESSAGE);
    }
  }, [hydrated, onboarding.completed, settings.startupSpeechEnabled, speak]);
}
