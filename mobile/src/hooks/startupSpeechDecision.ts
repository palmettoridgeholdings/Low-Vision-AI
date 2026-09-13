/**
 * Pure decision logic for whether to speak the startup welcome message,
 * pulled out of the hook so it can be unit tested without React, Expo, or
 * any native module involved (see __tests__/speech/startupSpeechDecision.test.ts).
 */
export interface StartupSpeechDecisionInput {
  hasHydrated: boolean;
  onboardingCompleted: boolean;
  startupSpeechEnabled: boolean;
  hasAlreadySpokenThisSession: boolean;
}

export function shouldSpeakStartupMessage(input: StartupSpeechDecisionInput): boolean {
  if (!input.hasHydrated) {
    // Don't decide before we know the real persisted settings — speaking
    // (or not) based on defaults could contradict what the user actually chose.
    return false;
  }
  if (!input.onboardingCompleted) {
    // First-run onboarding has its own spoken introduction; this is not it.
    return false;
  }
  if (!input.startupSpeechEnabled) {
    return false;
  }
  if (input.hasAlreadySpokenThisSession) {
    // Speak once per app launch, not on every re-render or screen focus.
    return false;
  }
  return true;
}
