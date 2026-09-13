import { backendConfig } from "@/services/config/backendConfig";
import type {
  TranscriptionRequest,
  TranscriptionResult,
  TranscriptionService,
} from "@/types/services";

/**
 * Minimal real implementation: uploads the recorded clip to
 * `${baseUrl}/v1/transcribe` as multipart form data and expects
 * `{ text: string, confidence?: number }` back.
 *
 * This is a foundation, not a finished integration — there is no real
 * backend to test it against yet. It only runs when
 * EXPO_PUBLIC_MOCK_MODE=false and EXPO_PUBLIC_BACKEND_BASE_URL is set (see
 * backendConfig.ts); the default mock mode never calls this.
 */
export const remoteTranscriptionService: TranscriptionService = {
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    if (!backendConfig.baseUrl) {
      throw new Error("No backend base URL is configured.");
    }

    const formData = new FormData();
    formData.append("audio", {
      // React Native's fetch accepts this shape for file uploads.
      uri: request.audioUri,
      name: "question.m4a",
      type: "audio/m4a",
    } as unknown as Blob);

    const response = await fetch(`${backendConfig.baseUrl}/v1/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription request failed (${response.status}).`);
    }

    const json = (await response.json()) as { text?: string; confidence?: number };
    if (!json.text) {
      throw new Error("Transcription response was missing text.");
    }
    return { text: json.text, confidence: json.confidence };
  },
};
