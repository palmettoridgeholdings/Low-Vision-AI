import type { OnboardingStep } from "@/types/onboarding";

export interface RoutingState {
  hydrated: boolean;
  onboarding: { completed: boolean; currentStep?: OnboardingStep };
}

export type OnboardingHref =
  | "/onboarding/welcome"
  | "/onboarding/vision"
  | "/onboarding/interaction"
  | "/onboarding/device"
  | "/onboarding/answer-behavior"
  | "/onboarding/confirmation";

const ONBOARDING_HREFS: Record<Exclude<OnboardingStep, "done">, OnboardingHref> = {
  welcome: "/onboarding/welcome",
  vision: "/onboarding/vision",
  interaction: "/onboarding/interaction",
  device: "/onboarding/device",
  answer_behavior: "/onboarding/answer-behavior",
  confirmation: "/onboarding/confirmation",
};

/** Resume an interrupted setup at its last persisted step. */
export function getOnboardingHref(step: OnboardingStep | undefined): OnboardingHref {
  if (!step || step === "done") {
    return "/onboarding/welcome";
  }
  return ONBOARDING_HREFS[step];
}

/**
 * Pure redirect decision used by app/index.tsx. Kept separate from the
 * route file so it can be unit tested without rendering expo-router.
 */
export function shouldRedirectToOnboarding(state: RoutingState): boolean {
  return state.hydrated && !state.onboarding.completed;
}
