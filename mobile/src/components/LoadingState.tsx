import { ActivityIndicator, StyleSheet, View } from "react-native";

import { BodyText } from "@/components/BodyText";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export interface LoadingStateProps {
  /** What is loading, read aloud by screen readers — e.g. "Getting your answer". */
  label: string;
  testID?: string;
}

/**
 * In-progress indicator. Announces itself once via a polite live region and
 * marks the region busy, instead of relying on a purely visual spinner.
 */
export function LoadingState({ label, testID }: LoadingStateProps) {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      testID={testID}
    >
      <ActivityIndicator size="large" color={colors.accent} />
      <BodyText style={styles.label}>{label}</BodyText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  label: {
    marginTop: spacing.md,
    textAlign: "center",
  },
});
