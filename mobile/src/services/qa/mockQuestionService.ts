import type { QuestionRequest, QuestionResult, QuestionService } from "@/types/services";

/**
 * Mock Q&A: echoes the question back inside a clearly-labeled placeholder
 * answer. Never returns `answerAudioUri` — spoken answers in mock mode
 * always come from on-device TTS speaking `answerText` (see
 * useAnswerSpeech.ts), which is also the correct fallback for a real
 * backend that didn't generate audio for a given answer.
 */
export const mockQuestionService: QuestionService = {
  async ask(request: QuestionRequest): Promise<QuestionResult> {
    if (!request.text.trim()) {
      throw new Error("Please ask a question first.");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      answerText: `This is a mock answer to your question: "${request.text.trim()}". Connect a real backend to get an actual answer.`,
    };
  },
};
