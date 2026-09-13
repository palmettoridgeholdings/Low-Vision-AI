import { Pressable, StyleSheet, Switch, View } from "react-native";

import { BodyText } from "@/components/BodyText";
import { useSpeech } from "@/hooks/useSpeech";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { MIN_TOUCH_TARGET } from "@/theme/a11y";

export interface AccessibleToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** When true, speaks "<label>, on."/"<label>, off." after each change — a spoken confirmation for a user who cannot see the switch's visual state change. */
  announceChange?: boolean;
  testID?: string;
}

/**
 * A labeled on/off switch. The whole row is one accessibilityRole="switch"
 * control (rather than a Switch floating next to unrelated text) so
 * TalkBack/VoiceOver announce the label and state together and the entire
 * row — not just the small native thumb — is a large touch target.
 */
export function AccessibleToggle({
  label,
  description,
  value,
  onValueChange,
  announceChange = false,
  testID,
}: AccessibleToggleProps) {
  const { speak } = useSpeech();

  const handleChange = (next: boolean) => {
    onValueChange(next);
    if (announceChange) {
      void speak(`${label}, ${next ? "on" : "off"}.`);
    }
  };

  return (
    <Pressable
      style={styles.row}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      onPress={() => handleChange(!value)}
      testID={testID}
    >
      <View style={styles.textColumn}>
        <BodyText>{label}</BodyText>
        {description ? (
          <BodyText secondary style={styles.description}>
            {description}
          </BodyText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        trackColor={{ false: colors.disabled, true: colors.accent }}
        thumbColor={colors.textPrimary}
        // The Pressable row above owns accessibility semantics; hide the
        // native Switch from the tree to avoid a duplicate/competing node.
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    marginTop: 2,
  },
});
