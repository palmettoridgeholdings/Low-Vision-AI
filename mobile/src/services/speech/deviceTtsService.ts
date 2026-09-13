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
