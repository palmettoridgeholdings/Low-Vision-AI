import { useRouter } from "expo-router";

import { ChoiceList, OnboardingStepShell } from "@/components";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { chooseDevicePreference, goToOnboardingStep } from "@/state/appStateStore";
import type { DevicePreference } from "@/types/onboarding";
import {
  DEVICE_PREFERENCE_LABELS,
  DEVICE_PREFERENCE_ORDER,
  DEVICE_PROMPT,
  DEVICE_VALIDATION_MESSAGE,
} from "@/constants/onboardingCopy";

/** State D (Device) from docs/BLIND_FIRST_ONBOARDING_SPEC.md. */
export function OnboardingDeviceScreen() {
  const router = useRouter();
  const { onboarding } = usePersistedAppState();

  const options = DEVICE_PREFERENCE_ORDER.map((value) => ({
    value,
    label: DEVICE_PREFERENCE_LABELS[value],
  }));

  const handleSelect = (device: DevicePreference) => {
    chooseDevicePreference(device);
  };

  return (
    <OnboardingStepShell
      heading="Device"
      prompt={DEVICE_PROMPT}
      autoSpeak={onboarding.setupRoute === "spoken"}
      onBack={() => {
        goToOnboardingStep("interaction");
        router.back();
      }}
      onContinue={() => router.push("/onboarding/answer-behavior")}
      canContinue={!!onboarding.devicePreference}
      validationMessage={DEVICE_VALIDATION_MESSAGE}
      testID="onboarding-device-screen"
    >
      <ChoiceList
        groupLabel="Device and screen reader"
        options={options}
        selectedValue={onboarding.devicePreference}
        onSelect={handleSelect}
        announceSelection={onboarding.setupRoute === "spoken"}
      />
    </OnboardingStepShell>
  );
}
