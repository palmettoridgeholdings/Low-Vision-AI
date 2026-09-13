import * as Speech from "expo-speech";

import type { TtsService, TtsSpeakOptions } from "@/types/services";

/**
 * On-device text-to-speech via expo-speech. This is the ONLY implementation
 * of TtsService in the app — startup speech and spoken answers must never
 * route through an AI/network service, by design (see
 * docs/ANDROID_MVP_ARCHITECTURE.md).
 */
export const deviceTtsService: TtsService = {
  async speak(text: string, options?: TtsSpeakOptions) {
    // Android's TextToSpeech queues consecutive speak() calls instead of
    // interrupting, so without an explicit stop() first, two announcements
    // made in quick succession would both play, one after the other, rather
    // than the second replacing the first. Stopping here (in addition to
    // spokenGuidanceController's own stop-before-speak) keeps this guarantee
    // even for any future direct caller of this service.
    try {
      await Speech.stop();
    } catch {
      // Nothing was playing, or the platform refused the stop — proceed to
      // speak regardless; a missed stop is not worth blocking speech over.
    }
    Speech.speak(text, {
      onDone: options?.onDone,
      onStopped: options?.onDone,
      onError: options?.onError,
    });
  },

  async stop() {
    await Speech.stop();
  },

  async isSpeakingAsync() {
    return Speech.isSpeakingAsync();
  },
};
