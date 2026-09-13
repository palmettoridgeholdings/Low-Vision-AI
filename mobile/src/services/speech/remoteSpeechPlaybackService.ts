import { createAudioPlayer } from "expo-audio";

import type { SpeechPlaybackOptions, SpeechPlaybackService } from "@/types/services";

/**
 * Plays back server-generated speech audio for an answer.
 *
 * This path stays inactive in default mock mode. Device testing is still
 * required before enabling it against a production backend.
 */
let activePlayer: ReturnType<typeof createAudioPlayer> | null = null;

export const remoteSpeechPlaybackService: SpeechPlaybackService = {
  async playFromUri(uri: string, options?: SpeechPlaybackOptions) {
    try {
      if (activePlayer) {
        activePlayer.pause();
        activePlayer.remove();
      }
      const player = createAudioPlayer({ uri });
      activePlayer = player;
      player.addListener("playbackStatusUpdate", (status: { didJustFinish?: boolean }) => {
        if (status.didJustFinish) {
          options?.onDone?.();
          player.remove();
          if (activePlayer === player) {
            activePlayer = null;
          }
        }
      });
      player.play();
    } catch (error) {
      options?.onError?.(error);
      throw error;
    }
  },

  async stop() {
    if (activePlayer) {
      activePlayer.pause();
      activePlayer.remove();
      activePlayer = null;
    }
  },
};
