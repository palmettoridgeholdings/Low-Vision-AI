import { useRouter } from "expo-router";

import { ChoiceList, OnboardingStepShell } from "@/components";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { chooseInteractionPreference, goToOnboardingStep } from "@/state/appStateStore";
import type { InteractionPreference } from "@/types/onboarding";
import {
  INTERACTION_PREFERENCE_LABELS,
  INTERACTION_PREFERENCE_ORDER,
  INTERACTION_PROMPT,
} from "@/constants/onboardingCopy";

/** State C (Interaction) from docs/BLIND_FIRST_ONBOARDING_SPEC.md. */
export function OnboardingInteractionScreen() {
  const router = useRouter();
  const { onboarding } = usePersistedAppState();
  const isTotallyBlindRecommendation = onboarding.visionProfile === "totally_blind";

  const options = INTERACTION_PREFERENCE_ORDER.map((value) => ({
    value,
    label: INTERACTION_PREFERENCE_LABELS[value],
    hint:
      isTotallyBlindRecommendation && value === "voice_first"
        ? "Recommended for your profile"
        : undefined,
  }));

  const handleSelect = (preference: InteractionPreference) => {
    chooseInteractionPreference(preference);
  };

  return (
    <OnboardingStepShell
      heading="Interaction"
      prompt={INTERACTION_PROMPT}
      autoSpeak={onboarding.setupRoute === "spoken"}
      onBack={() => {
        goToOnboardingStep("vision");
        router.back();
      }}
      onContinue={() => router.push("/onboarding/device")}
      continueDisabled={!onboarding.interactionPreference}
      testID="onboarding-interaction-screen"
    >
      <ChoiceList
        groupLabel="Interaction preference"
        options={options}
        selectedValue={onboarding.interactionPreference}
        onSelect={handleSelect}
      />
    </OnboardingStepShell>
  );
}
