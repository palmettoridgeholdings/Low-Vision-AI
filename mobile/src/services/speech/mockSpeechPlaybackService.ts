import type { SpeechPlaybackOptions, SpeechPlaybackService } from "@/types/services";

/**
 * Mock playback: resolves immediately and reports done without touching the
 * filesystem or any audio hardware. In practice this path is rarely hit —
 * the mock QuestionService never returns an `answerAudioUri` — but it exists
 * so screens can be built and tested against the interface today.
 */
export const mockSpeechPlaybackService: SpeechPlaybackService = {
  async playFromUri(_uri: string, options?: SpeechPlaybackOptions) {
    options?.onDone?.();
  },

  async stop() {
    // no-op
  },
};
