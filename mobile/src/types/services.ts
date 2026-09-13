/**
 * Typed boundaries between the UI and "does the actual work" implementations.
 *
 * Every one of these has exactly one mock implementation wired up today
 * (src/services/**\/mock*.ts) and a minimal real implementation that talks to
 * a configurable backend (src/services/**\/remote*.ts). Which one runs is
 * decided once, centrally, by `resolveServices()` in
 * `src/services/serviceRegistry.ts` — screens never import a mock or remote
 * implementation directly, only these interfaces plus the resolver.
 */

export interface TtsSpeakOptions {
  onDone?: () => void;
  onError?: (error: unknown) => void;
}

/** On-device text-to-speech. Used for startup speech and spoken answers — never calls a network/AI service. */
export interface TtsService {
  speak(text: string, options?: TtsSpeakOptions): Promise<void>;
  stop(): Promise<void>;
  isSpeakingAsync(): Promise<boolean>;
}

export interface SpeechPlaybackOptions {
  onDone?: () => void;
  onError?: (error: unknown) => void;
}

/** Plays back a pre-generated audio clip (e.g. server-generated speech for an answer). */
export interface SpeechPlaybackService {
  playFromUri(uri: string, options?: SpeechPlaybackOptions): Promise<void>;
  stop(): Promise<void>;
}

export interface TranscriptionRequest {
  /** Local file URI of a recorded audio clip (from expo-audio). */
  audioUri: string;
}

export interface TranscriptionResult {
  text: string;
  /** 0-1 confidence, when the provider reports one. */
  confidence?: number;
}

/** Turns a recorded voice question into text. */
export interface TranscriptionService {
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

export type ImageAnalysisMode = "read_text" | "describe_scene" | "find_inspect";

export interface ImageAnalysisRequest {
  /** Local file URI of a captured photo (from expo-camera). */
  imageUri: string;
  mode: ImageAnalysisMode;
  /** Optional free-text question about the photo, e.g. "is this my heart medication?". */
  question?: string;
}

export interface ImageAnalysisResult {
  description: string;
  /**
   * Always present, always shown/spoken alongside the description. A single
   * photo cannot establish that a route, object, or substance is safe — see
   * docs/ANDROID_MVP_ARCHITECTURE.md and the repo root README's safety note.
   */
  disclaimer: string;
}

/** Analyzes a captured photo. Never described to the user as navigation- or safety-grade. */
export interface ImageAnalysisService {
  analyze(request: ImageAnalysisRequest): Promise<ImageAnalysisResult>;
}

export interface QuestionRequest {
  text: string;
}

export interface QuestionResult {
  answerText: string;
  /** Set only when the backend returns pre-generated speech for this answer; optional by design. */
  answerAudioUri?: string;
}

/** Answers a typed or transcribed text question. */
export interface QuestionService {
  ask(request: QuestionRequest): Promise<QuestionResult>;
}
