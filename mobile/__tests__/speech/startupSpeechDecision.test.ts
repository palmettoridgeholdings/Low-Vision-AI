import {
  shouldSpeakStartupMessage,
  type StartupSpeechDecisionInput,
} from "@/hooks/startupSpeechDecision";

const baseInput: StartupSpeechDecisionInput = {
  hasHydrated: true,
  onboardingCompleted: true,
  startupSpeechEnabled: true,
  hasAlreadySpokenThisSession: false,
};

describe("shouldSpeakStartupMessage", () => {
  it("speaks when hydrated, onboarded, enabled, and not yet spoken this session", () => {
    expect(shouldSpeakStartupMessage(baseInput)).toBe(true);
  });

  it("never speaks before persisted state has loaded", () => {
    expect(shouldSpeakStartupMessage({ ...baseInput, hasHydrated: false })).toBe(false);
  });

  it("never speaks before onboarding is complete", () => {
    expect(shouldSpeakStartupMessage({ ...baseInput, onboardingCompleted: false })).toBe(false);
  });

  it("respects the user's startup-speech setting", () => {
    expect(shouldSpeakStartupMessage({ ...baseInput, startupSpeechEnabled: false })).toBe(false);
  });

  it("speaks at most once per app session", () => {
    expect(shouldSpeakStartupMessage({ ...baseInput, hasAlreadySpokenThisSession: true })).toBe(
      false,
    );
  });
});
