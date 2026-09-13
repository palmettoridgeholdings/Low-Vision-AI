import { useEffect, useRef } from "react";

import { useSpeech } from "@/hooks/useSpeech";

/**
 * Speaks `text` once when the screen mounts, but only when `enabled` is
 * true. Used by onboarding steps to auto-speak prompts on the spoken-setup
 * route while leaving the visual route silent (equivalent text stays on
 * screen either way — see docs/BLIND_FIRST_ONBOARDING_SPEC.md section 1).
 */
export function useAutoSpeakOnMount(text: string, enabled: boolean): void {
  const { speak } = useSpeech();
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    if (enabled && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      void speak(text);
    }
    // Speak at most once per mount; re-running when `text`/`speak` identity
    // changes would risk double-speaking on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
