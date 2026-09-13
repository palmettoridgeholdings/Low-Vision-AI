/**
 * Confirms the safe-mock-mode-default rule from backendConfig.ts actually
 * decides which implementation the rest of the app gets, in every
 * combination that matters. Each scenario needs backendConfig re-evaluated
 * against different env vars, so this file uses jest.resetModules() + a
 * fresh require() per scenario rather than a single top-level import.
 */
const ENV_KEYS = ["EXPO_PUBLIC_BACKEND_BASE_URL", "EXPO_PUBLIC_MOCK_MODE"] as const;
let savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string>>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  jest.resetModules();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

function loadServices() {
  const { getServices } = require("@/services/serviceRegistry");
  return getServices();
}

describe("service registry mock/remote resolution", () => {
  it("defaults to every mock implementation when nothing is configured", () => {
    const services = loadServices();
    const { mockQuestionService } = require("@/services/qa/mockQuestionService");
    const {
      mockTranscriptionService,
    } = require("@/services/transcription/mockTranscriptionService");
    const { mockImageAnalysisService } = require("@/services/analysis/mockImageAnalysisService");

    expect(services.question).toBe(mockQuestionService);
    expect(services.transcription).toBe(mockTranscriptionService);
    expect(services.imageAnalysis).toBe(mockImageAnalysisService);
  });

  it("stays on mock services if a base URL is set but mock mode is not explicitly disabled", () => {
    process.env.EXPO_PUBLIC_BACKEND_BASE_URL = "https://api.example.com";
    const services = loadServices();
    const { mockQuestionService } = require("@/services/qa/mockQuestionService");

    expect(services.question).toBe(mockQuestionService);
  });

  it("switches to remote services only when a base URL is set AND mock mode is explicitly false", () => {
    process.env.EXPO_PUBLIC_BACKEND_BASE_URL = "https://api.example.com";
    process.env.EXPO_PUBLIC_MOCK_MODE = "false";
    const services = loadServices();
    const { remoteQuestionService } = require("@/services/qa/remoteQuestionService");
    const {
      remoteTranscriptionService,
    } = require("@/services/transcription/remoteTranscriptionService");
    const {
      remoteImageAnalysisService,
    } = require("@/services/analysis/remoteImageAnalysisService");

    expect(services.question).toBe(remoteQuestionService);
    expect(services.transcription).toBe(remoteTranscriptionService);
    expect(services.imageAnalysis).toBe(remoteImageAnalysisService);
  });

  it("never gates on-device TTS behind mock mode", () => {
    process.env.EXPO_PUBLIC_BACKEND_BASE_URL = "https://api.example.com";
    process.env.EXPO_PUBLIC_MOCK_MODE = "false";
    const services = loadServices();
    const { deviceTtsService } = require("@/services/speech/deviceTtsService");

    expect(services.tts).toBe(deviceTtsService);
  });
});
