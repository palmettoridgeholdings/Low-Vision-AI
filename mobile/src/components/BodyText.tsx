import { forwardRef, type ReactNode } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";

import { colors } from "@/theme/colors";
import { fontSize, lineHeight } from "@/theme/typography";

export interface BodyTextProps extends TextProps {
  secondary?: boolean;
  children: ReactNode;
}

/**
 * Standard body copy at the app's (large) base size. Forwards its ref to
 * the underlying Text node — see Heading.tsx for why this matters for
 * accessibility focus.
 */
export const BodyText = forwardRef<Text, BodyTextProps>(function BodyText(
  { secondary = false, style, children, ...rest },
  ref,
) {
  return (
    <Text
      ref={ref}
      style={[styles.base, { color: secondary ? colors.textSecondary : colors.textPrimary }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
});

const styles = StyleSheet.create({
  base: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
});
