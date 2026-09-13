import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";

import { colors } from "@/theme/colors";
import { fontSize, fontWeight, lineHeight } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { FOCUS_RING_WIDTH, MIN_TOUCH_TARGET, PRIMARY_CONTROL_HEIGHT } from "@/theme/a11y";

export type AccessibleButtonVariant = "primary" | "secondary" | "danger";
export type AccessibleButtonSize = "primary" | "secondary";

export interface AccessibleButtonProps {
  /** Visible label. Also used as the default accessible name — keep it the real label, not an icon description. */
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  /** Extra spoken/read context beyond the label (accessibilityHint). Optional. */
  hint?: string;
  variant?: AccessibleButtonVariant;
  size?: AccessibleButtonSize;
  disabled?: boolean;
  /** Small leading glyph/emoji rendered before the label. Decorative only — never the only cue. */
  leadingGlyph?: string;
  testID?: string;
}

/**
 * The one button component every screen should use. Centralizes touch-target
 * size, color contrast, a visible keyboard focus ring, and correct
 * accessibility role/label/state so individual screens can't regress those.
 */
export function AccessibleButton({
  label,
  onPress,
  hint,
  variant = "primary",
  size = "primary",
  disabled = false,
  leadingGlyph,
  testID,
}: AccessibleButtonProps) {
  const [isFocused, setIsFocused] = useState(false);

  const height = size === "primary" ? PRIMARY_CONTROL_HEIGHT : MIN_TOUCH_TARGET;
  const backgroundColor = disabled
    ? colors.disabled
    : variant === "danger"
      ? colors.dangerSurface
      : variant === "secondary"
        ? colors.surfaceRaised
        : colors.accent;
  const textColor = disabled
    ? colors.disabledText
    : variant === "primary"
      ? colors.textOnAccent
      : variant === "danger"
        ? colors.danger
        : colors.textPrimary;
  const borderColor = variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      focusable
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          backgroundColor: pressed && !disabled ? colors.accentPressed : backgroundColor,
          borderColor: isFocused ? colors.focusRing : borderColor,
          borderWidth: isFocused ? FOCUS_RING_WIDTH : variant === "secondary" ? 1 : 0,
        },
      ]}
    >
      <View style={styles.content}>
        {leadingGlyph ? (
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.glyph}>
            {leadingGlyph}
          </Text>
        ) : null}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: MIN_TOUCH_TARGET,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    fontSize: fontSize.button,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: fontSize.button,
    lineHeight: lineHeight.button,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
});
