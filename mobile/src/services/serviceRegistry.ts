import { backendConfig } from "@/services/config/backendConfig";
import { deviceTtsService } from "@/services/speech/deviceTtsService";
import { mockSpeechPlaybackService } from "@/services/speech/mockSpeechPlaybackService";
import { remoteSpeechPlaybackService } from "@/services/speech/remoteSpeechPlaybackService";
import { mockTranscriptionService } from "@/services/transcription/mockTranscriptionService";
import { remoteTranscriptionService } from "@/services/transcription/remoteTranscriptionService";
import { mockImageAnalysisService } from "@/services/analysis/mockImageAnalysisService";
import { remoteImageAnalysisService } from "@/services/analysis/remoteImageAnalysisService";
import { mockQuestionService } from "@/services/qa/mockQuestionService";
import { remoteQuestionService } from "@/services/qa/remoteQuestionService";
import type {
  ImageAnalysisService,
  QuestionService,
  SpeechPlaybackService,
  TranscriptionService,
  TtsService,
} from "@/types/services";

export interface Services {
  tts: TtsService;
  speechPlayback: SpeechPlaybackService;
  transcription: TranscriptionService;
  imageAnalysis: ImageAnalysisService;
  question: QuestionService;
}

/**
 * The single place that decides mock vs. real for every service. Screens
 * and hooks call `getServices()` — never import a mock/remote module
 * directly — so switching backends later, or injecting fakes in a test,
 * never requires touching UI code.
 *
 * On-device TTS (`tts`) is intentionally NOT gated by mock mode: it never
 * talks to a network or AI service in either mode, per the startup-speech
 * requirement, so there is nothing to swap.
 */
function resolveServices(): Services {
  const useMocks = backendConfig.mockMode;
  return {
    tts: deviceTtsService,
    speechPlayback: useMocks ? mockSpeechPlaybackService : remoteSpeechPlaybackService,
    transcription: useMocks ? mockTranscriptionService : remoteTranscriptionService,
    imageAnalysis: useMocks ? mockImageAnalysisService : remoteImageAnalysisService,
    question: useMocks ? mockQuestionService : remoteQuestionService,
  };
}

let cachedServices: Services | null = null;

export function getServices(): Services {
  if (!cachedServices) {
    cachedServices = resolveServices();
  }
  return cachedServices;
}

/** Test-only escape hatch: inject fakes and reset the cache between tests. */
export function __setServicesForTest(overrides: Partial<Services> | null): void {
  cachedServices = overrides ? { ...resolveServices(), ...overrides } : null;
}
