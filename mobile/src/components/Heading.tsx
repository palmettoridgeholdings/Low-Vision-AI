import { StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";
import { fontSize, fontWeight, lineHeight } from "@/theme/typography";

export interface HeadingProps {
  children: string;
  level?: 1 | 2;
  testID?: string;
}

/**
 * A screen or section heading, exposed to assistive tech as an actual
 * header (accessibilityRole="header") so TalkBack/VoiceOver users can jump
 * between sections instead of reading everything linearly.
 */
export function Heading({ children, level = 1, testID }: HeadingProps) {
  return (
    <Text
      accessibilityRole="header"
      testID={testID}
      style={level === 1 ? styles.level1 : styles.level2}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  level1: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    fontWeight: fontWeight.bold,
    marginBottom: 8,
  },
  level2: {
    color: colors.textPrimary,
    fontSize: fontSize.heading,
    lineHeight: lineHeight.heading,
    fontWeight: fontWeight.bold,
    marginBottom: 8,
  },
});
