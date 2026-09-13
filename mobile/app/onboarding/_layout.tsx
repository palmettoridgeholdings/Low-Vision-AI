import { Stack } from "expo-router";

import { colors } from "@/theme/colors";

/** Every onboarding step renders its own heading via OnboardingStepShell, so the native header is hidden throughout. */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
