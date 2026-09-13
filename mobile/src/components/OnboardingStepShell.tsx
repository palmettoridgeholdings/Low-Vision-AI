import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AccessibleButton } from "@/components/AccessibleButton";
import { BodyText } from "@/components/BodyText";
import { Heading } from "@/components/Heading";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useSpeech } from "@/hooks/useSpeech";
import { spacing } from "@/theme/spacing";

export interface OnboardingStepShellProps {
  heading: string;
  prompt: string;
  /** True only on the spoken-setup route — see useAutoSpeakOnMount. */
  autoSpeak: boolean;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  testID?: string;
}

/**
 * Shared chrome for every onboarding step: heading, prompt text (always
 * visible, regardless of route), a manual "repeat" control so speech
 * failure never blocks progress, the step's own content, and Back/Continue.
 *
 * Per the onboarding spec (section 5, section 10): standard focus order,
 * no custom gestures, and every action stays reachable as plain
 * screen-reader-readable, keyboard-activatable controls.
 */
export function OnboardingStepShell({
  heading,
  prompt,
  autoSpeak,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  testID,
}: OnboardingStepShellProps) {
  const { speak } = useSpeech();
  useAutoSpeakOnMount(prompt, autoSpeak);

  return (
    <ScreenContainer scroll testID={testID}>
      <Heading>{heading}</Heading>
      <BodyText style={styles.prompt}>{prompt}</BodyText>
      <AccessibleButton
        label="Repeat this instruction"
        leadingGlyph="🔊"
        size="secondary"
        variant="secondary"
        onPress={() => void speak(prompt)}
      />

      <View style={styles.content}>{children}</View>

      <View style={styles.footer}>
        {onContinue ? (
          <AccessibleButton
            label={continueLabel}
            onPress={onContinue}
            disabled={continueDisabled}
            testID="onboarding-continue"
          />
        ) : null}
        {onBack ? (
          <AccessibleButton label="Back" size="secondary" variant="secondary" onPress={onBack} />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  prompt: {
    marginBottom: spacing.md,
  },
  content: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  footer: {
    marginTop: spacing.sm,
  },
});
