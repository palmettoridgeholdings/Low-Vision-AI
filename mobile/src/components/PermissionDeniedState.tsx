import { Linking, StyleSheet, View } from "react-native";

import { AccessibleButton } from "@/components/AccessibleButton";
import { BodyText } from "@/components/BodyText";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
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
 * Speaks that same explanation unconditionally on mount — this screen is
 * itself a dead end for a totally blind user unless it announces itself and
 * stays fully navigable by TalkBack/keyboard/Braille (see
 * docs/BLIND_FIRST_ONBOARDING_SPEC.md section 10, "Failure Behavior").
 */
export function PermissionDeniedState({
  permissionLabel,
  onRetry,
  testID,
}: PermissionDeniedStateProps) {
  const message = `Access AI does not have permission to use the ${permissionLabel}. Open your device settings to allow it, then come back and try again.`;
  useAutoSpeakOnMount(message, true);

  return (
    <View style={styles.container} accessible accessibilityRole="alert" testID={testID}>
      <BodyText style={styles.text}>{message}</BodyText>
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
