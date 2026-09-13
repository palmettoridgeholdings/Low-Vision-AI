import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  testID?: string;
}

/**
 * Consistent screen chrome: safe-area handling, background color, and
 * padding. Scroll is opt-in so short screens (e.g. a single confirmation)
 * don't get an accidentally-scrollable region that confuses screen readers.
 */
export function ScreenContainer({ children, scroll = false, testID }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>{children}</ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
