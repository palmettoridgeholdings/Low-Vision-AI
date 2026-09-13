import { backendConfig } from "@/services/config/backendConfig";
import type { QuestionRequest, QuestionResult, QuestionService } from "@/types/services";

/**
 * Minimal real implementation: POSTs to `${baseUrl}/v1/ask` and expects
 * `{ answerText: string, answerAudioUri?: string }` back. `answerAudioUri`
 * is optional by design — the backend may or may not generate speech for a
 * given answer, and the client always has the on-device TTS fallback.
 *
 * Foundation only — no backend exists to test this against yet. Runs only
 * when mock mode is off and a base URL is configured.
 */
export const remoteQuestionService: QuestionService = {
  async ask(request: QuestionRequest): Promise<QuestionResult> {
    if (!backendConfig.baseUrl) {
      throw new Error("No backend base URL is configured.");
    }

    const response = await fetch(`${backendConfig.baseUrl}/v1/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: request.text }),
    });

    if (!response.ok) {
      throw new Error(`Question request failed (${response.status}).`);
    }

    const json = (await response.json()) as { answerText?: string; answerAudioUri?: string };
    if (!json.answerText) {
      throw new Error("Answer response was missing text.");
    }
    return { answerText: json.answerText, answerAudioUri: json.answerAudioUri };
  },
};
