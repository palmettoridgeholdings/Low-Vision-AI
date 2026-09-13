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
 */
export function RetryableError({ message, onRetry, testID }: RetryableErrorProps) {
  return (
    <View
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
}

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
