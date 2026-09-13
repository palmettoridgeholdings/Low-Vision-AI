import type {
  TranscriptionRequest,
  TranscriptionResult,
  TranscriptionService,
} from "@/types/services";

/**
 * Mock transcription: confirms a recording exists and returns a fixed,
 * clearly-labeled placeholder instead of real speech-to-text. Lets the
 * voice-question screen be built, used, and tested end to end with no
 * backend and no speech model.
 */
export const mockTranscriptionService: TranscriptionService = {
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    if (!request.audioUri) {
      throw new Error("No recording was provided to transcribe.");
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      text: "(Mock transcription) What does this look like?",
      confidence: 1,
    };
  },
};
