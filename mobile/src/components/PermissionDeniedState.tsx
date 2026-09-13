import { Linking, StyleSheet, View } from "react-native";

import { AccessibleButton } from "@/components/AccessibleButton";
import { BodyText } from "@/components/BodyText";
import { spacing } from "@/theme/spacing";

export interface PermissionDeniedStateProps {
  /** e.g. "camera" or "microphone" — used to build a clear, specific message. */
  permissionLabel: string;
  onRetry?: () => void;
  testID?: string;
}

/**
 * Shown when a required hardware permission (camera/microphone) was denied.
 * Explains what happened in plain language and offers a direct path to the
 * OS settings screen, plus an in-app retry once the user has changed it.
 */
export function PermissionDeniedState({
  permissionLabel,
  onRetry,
  testID,
}: PermissionDeniedStateProps) {
  return (
    <View style={styles.container} accessible accessibilityRole="alert" testID={testID}>
      <BodyText style={styles.text}>
        Access AI does not have permission to use the {permissionLabel}. Open your device settings
        to allow it, then come back and try again.
      </BodyText>
      <AccessibleButton
        label="Open device settings"
        size="secondary"
        onPress={() => {
          Linking.openSettings().catch(() => {
            // If the OS refuses to open settings there is nothing else this
            // screen can do; the text instructions above still stand.
          });
        }}
      />
      {onRetry ? (
        <AccessibleButton
          label="Try again"
          size="secondary"
          variant="secondary"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  text: {
    marginBottom: spacing.md,
  },
});
