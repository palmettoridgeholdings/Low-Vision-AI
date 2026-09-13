import { useRouter } from "expo-router";

import { AccessibleButton, Heading } from "@/components";
import { OnboardingStepShell } from "@/components/OnboardingStepShell";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { completeOnboarding, goToOnboardingStep } from "@/state/appStateStore";
import { buildConfirmationSummary } from "@/constants/onboardingCopy";

/** State F (Confirmation) from docs/BLIND_FIRST_ONBOARDING_SPEC.md. */
export function OnboardingConfirmationScreen() {
  const router = useRouter();
  const { onboarding, settings } = usePersistedAppState();

  const summary = buildConfirmationSummary({
    visionProfile: onboarding.visionProfile,
    interactionPreference: onboarding.interactionPreference,
    devicePreference: onboarding.devicePreference,
    answerStyle: onboarding.answerStyle,
    autoSpeakAnswers: settings.autoSpeakAnswers,
  });

  const handleFinish = () => {
    completeOnboarding();
    router.replace("/");
  };

  return (
    <OnboardingStepShell
      heading="Confirm your setup"
      prompt={summary}
      autoSpeak={onboarding.setupRoute === "spoken"}
      onBack={() => {
        goToOnboardingStep("answer_behavior");
        router.back();
      }}
      testID="onboarding-confirmation-screen"
    >
      <Heading level={2}>Ready to finish?</Heading>
      <AccessibleButton
        label="Finish setup"
        onPress={handleFinish}
        testID="onboarding-finish-setup"
      />
      <AccessibleButton
        label="Review settings"
        size="secondary"
        variant="secondary"
        onPress={() => {
          goToOnboardingStep("vision");
          router.push("/onboarding/vision");
        }}
        testID="onboarding-review-settings"
      />
    </OnboardingStepShell>
  );
}
