import { StyleSheet, View } from "react-native";

import { BodyText } from "@/components/BodyText";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export interface OfflineBannerProps {
  testID?: string;
}

/**
 * Persistent banner shown while the device has no network connection.
 * Mock-mode features keep working while this is visible; only
 * backend-dependent features (real transcription/analysis/answers) are
 * affected, and each of those screens says so on its own.
 */
export function OfflineBanner({ testID }: OfflineBannerProps) {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      <BodyText style={styles.text}>
        No internet connection. You can keep using anything that does not need the network.
      </BodyText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    textAlign: "center",
  },
});
