import { forwardRef } from "react";
import { StyleSheet, View } from "react-native";

import { AccessibleButton } from "@/components/AccessibleButton";
import { BodyText } from "@/components/BodyText";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export interface RetryableErrorProps {
  /** Plain-language explanation of what went wrong. Avoid jargon and stack traces. */
  message: string;
  onRetry: () => void;
  testID?: string;
}

/**
 * Generic recoverable-error state: announced immediately (assertive live
 * region) and paired with a single, obvious retry action.
 *
 * Forwards its ref to the outer, already-accessible View (accessible,
 * role="alert") — see Heading.tsx for why this matters for accessibility
 * focus. Note: this container's `accessible` merges the message and the
 * nested "Try again" button into one accessibility node, which is
 * appropriate for announcing the error but also means "Try again" is not
 * independently reachable by swipe navigation — a pre-existing tradeoff of
 * this component predating this change, left as-is here since it is not
 * caused by, or in scope for, the focus fix.
 */
export const RetryableError = forwardRef<View, RetryableErrorProps>(function RetryableError(
  { message, onRetry, testID },
  ref,
) {
  return (
    <View
      ref={ref}
      style={styles.container}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID={testID}
    >
      <BodyText style={styles.text}>{message}</BodyText>
      <AccessibleButton label="Try again" size="secondary" onPress={onRetry} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    marginBottom: spacing.md,
  },
});
