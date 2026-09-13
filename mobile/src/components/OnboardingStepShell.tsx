import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AccessibleButton } from "@/components/AccessibleButton";
import { BodyText } from "@/components/BodyText";
import { Heading } from "@/components/Heading";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useSpokenGuidance } from "@/hooks/useSpokenGuidance";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { fontWeight } from "@/theme/typography";

export interface OnboardingStepShellProps {
  heading: string;
  prompt: string;
  /** True only on the spoken-setup route — see useAutoSpeakOnMount. */
  autoSpeak: boolean;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  /**
   * Whether the step's required choice has been made. Continue stays
   * enabled either way — per the requirement that validation errors are
   * announced rather than silently disabling progress — but activating it
   * while this is false shows and speaks `validationMessage` instead of
   * advancing. Defaults to true (no validation required).
   */
  canContinue?: boolean;
  /** Spoken and displayed when Continue is activated while canContinue is false. */
  validationMessage?: string;
  testID?: string;
}

/**
 * Shared chrome for every onboarding step: heading, prompt text (always
 * visible, regardless of route), manual Repeat/Stop speech controls so a
 * speech failure or an utterance the user missed never blocks progress, the
 * step's own content, and Back/Continue.
 *
 * Per the onboarding spec (section 5, section 10): standard focus order,
 * no custom gestures, and every action stays reachable as plain
 * screen-reader-readable, keyboard-activatable controls. Continue is never
 * silently disabled — an incomplete required choice is announced instead
 * (see `canContinue`/`validationMessage`), so a screen-reader user always
 * learns why nothing happened rather than finding an inert control.
 */
export function OnboardingStepShell({
  heading,
  prompt,
  autoSpeak,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  canContinue = true,
  validationMessage,
  testID,
}: OnboardingStepShellProps) {
  const { speak, stop } = useSpokenGuidance();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useAutoSpeakOnMount(prompt, autoSpeak);

  // Hide a stale validation message as soon as the selection becomes valid.
  // Deriving this avoids a synchronous state update inside an effect.
  const visibleErrorMessage = canContinue ? null : errorMessage;

  const handleContinue = () => {
    if (!canContinue) {
      const message = validationMessage ?? "Please make a selection before continuing.";
      setErrorMessage(message);
      void speak(message);
      return;
    }
    setErrorMessage(null);
    onContinue?.();
  };

  return (
    <ScreenContainer scroll testID={testID}>
      <Heading>{heading}</Heading>
      <BodyText style={styles.prompt}>{prompt}</BodyText>
      <View style={styles.speechControls}>
        <AccessibleButton
          label="Repeat this instruction"
          leadingGlyph="🔊"
          size="secondary"
          variant="secondary"
          onPress={() => void speak(prompt)}
          testID="onboarding-repeat-instruction"
        />
        <AccessibleButton
          label="Stop speech"
          leadingGlyph="🛑"
          size="secondary"
          variant="secondary"
          onPress={() => void stop()}
          testID="onboarding-stop-speech"
        />
      </View>

      <View style={styles.content}>{children}</View>

      {visibleErrorMessage ? (
        <BodyText
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={styles.error}
          testID="onboarding-validation-error"
        >
          {visibleErrorMessage}
        </BodyText>
      ) : null}

      <View style={styles.footer}>
        {onContinue ? (
          <AccessibleButton
            label={continueLabel}
            onPress={handleContinue}
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
  speechControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  content: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  error: {
    marginBottom: spacing.md,
    color: colors.danger,
    fontWeight: fontWeight.bold,
  },
  footer: {
    marginTop: spacing.sm,
  },
});
