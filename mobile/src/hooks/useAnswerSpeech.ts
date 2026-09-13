import { useCallback } from "react";

import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { getServices } from "@/services/serviceRegistry";
import type { QuestionResult } from "@/types/services";

/**
 * Speaks an answer aloud when "Automatically speak answers" is on. Prefers
 * server-generated speech when the backend provided one; otherwise falls
 * back to on-device TTS reading `answerText` — the fallback also runs if
 * playing the server audio fails, so a bad audio URL never leaves an answer
 * silent for a user who asked for spoken answers.
 */
export function useAnswerSpeech(): (result: QuestionResult) => Promise<void> {
  const { settings } = usePersistedAppState();

  return useCallback(
    async (result: QuestionResult) => {
      if (!settings.autoSpeakAnswers) {
        return;
      }
      const services = getServices();
      if (result.answerAudioUri) {
        try {
          await services.speechPlayback.playFromUri(result.answerAudioUri);
          return;
        } catch {
          // Fall through to the on-device fallback below.
        }
      }
      await services.tts.speak(result.answerText);
    },
    [settings.autoSpeakAnswers],
  );
}
