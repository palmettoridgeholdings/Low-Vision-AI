import { useRouter } from "expo-router";

import { ChoiceList, OnboardingStepShell } from "@/components";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { chooseVisionProfile, goToOnboardingStep } from "@/state/appStateStore";
import type { VisionProfile } from "@/types/onboarding";
import {
  VISION_PROFILE_LABELS,
  VISION_PROFILE_ORDER,
  VISION_PROMPT,
} from "@/constants/onboardingCopy";

/** State B (Vision) from docs/BLIND_FIRST_ONBOARDING_SPEC.md. */
export function OnboardingVisionScreen() {
  const router = useRouter();
  const { onboarding } = usePersistedAppState();

  const options = VISION_PROFILE_ORDER.map((value) => ({
    value,
    label: VISION_PROFILE_LABELS[value],
    hint: value === "totally_blind" ? "Recommended for the spoken setup path" : undefined,
  }));

  const handleSelect = (profile: VisionProfile) => {
    chooseVisionProfile(profile);
  };

  return (
    <OnboardingStepShell
      heading="Vision"
      prompt={VISION_PROMPT}
      autoSpeak={onboarding.setupRoute === "spoken"}
      onBack={() => {
        goToOnboardingStep("welcome");
        router.back();
      }}
      onContinue={() => router.push("/onboarding/interaction")}
      continueDisabled={!onboarding.visionProfile}
      testID="onboarding-vision-screen"
    >
      <ChoiceList
        groupLabel="Vision option"
        options={options}
        selectedValue={onboarding.visionProfile}
        onSelect={handleSelect}
      />
    </OnboardingStepShell>
  );
}
