import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontSize, fontWeight, lineHeight } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { FOCUS_RING_WIDTH, MIN_TOUCH_TARGET } from "@/theme/a11y";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** e.g. "Recommended for your profile" — read after the label, shown as a small note. */
  hint?: string;
}

export interface ChoiceListProps<T extends string> {
  /** Read once by screen readers as the group's purpose, e.g. "Vision option". */
  groupLabel: string;
  options: ChoiceOption<T>[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  testID?: string;
}

/**
 * A single-select list exposed to assistive tech as a proper radio group —
 * standard TalkBack/VoiceOver double-tap activation and keyboard Enter/Space
 * both work through this, with no custom gesture handling (per the
 * onboarding spec's explicit prohibition on hijacking swipe gestures).
 */
export function ChoiceList<T extends string>({
  groupLabel,
  options,
  selectedValue,
  onSelect,
  testID,
}: ChoiceListProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={groupLabel} testID={testID}>
      {options.map((option) => (
        <ChoiceRow
          key={option.value}
          option={option}
          selected={option.value === selectedValue}
          onSelect={() => onSelect(option.value)}
        />
      ))}
    </View>
  );
}

function ChoiceRow<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: ChoiceOption<T>;
  selected: boolean;
  onSelect: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const label = option.hint ? `${option.label}. ${option.hint}` : option.label;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      focusable
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onSelect}
      style={[
        styles.row,
        {
          backgroundColor: selected ? colors.accent : colors.surfaceRaised,
          borderColor: isFocused ? colors.focusRing : colors.border,
          borderWidth: isFocused ? FOCUS_RING_WIDTH : 1,
        },
      ]}
    >
      <View style={styles.textColumn}>
        <Text
          style={[styles.label, { color: selected ? colors.textOnAccent : colors.textPrimary }]}
        >
          {option.label}
        </Text>
        {option.hint ? (
          <Text
            style={[styles.hint, { color: selected ? colors.textOnAccent : colors.textSecondary }]}
          >
            {option.hint}
          </Text>
        ) : null}
      </View>
      <View
        style={[styles.radioOuter, { borderColor: selected ? colors.textOnAccent : colors.border }]}
      >
        {selected ? (
          <View style={[styles.radioInner, { backgroundColor: colors.textOnAccent }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: fontSize.label,
    lineHeight: lineHeight.label,
    fontWeight: fontWeight.bold,
  },
  hint: {
    fontSize: fontSize.label - 2,
    marginTop: 2,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
