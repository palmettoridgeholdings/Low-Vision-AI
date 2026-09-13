import { AccessibleButton, BodyText, Heading } from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useSpeech } from "@/hooks/useSpeech";
import { HELP_MESSAGE } from "@/constants/onboardingCopy";
import { spacing } from "@/theme/spacing";
import { StyleSheet } from "react-native";

/**
 * "Help / What can I do?" (spec section 8): a concise spoken/readable
 * description of the app's primary actions, reachable from Home at any
 * time and safe to use before or after onboarding.
 */
export function HelpScreen() {
  const { speak } = useSpeech();
  useAutoSpeakOnMount(HELP_MESSAGE, true);

  return (
    <ScreenContainer scroll testID="help-screen">
      <Heading>Help</Heading>
      <BodyText style={styles.body}>{HELP_MESSAGE}</BodyText>
      <BodyText secondary style={styles.body}>
        This app is assistive software, not a navigation or safety system. A single photo cannot
        establish that a route, object, or medication is safe — verify anything uncertain with a
        trusted source.
      </BodyText>
      <AccessibleButton
        label="Repeat this help message"
        leadingGlyph="🔊"
        size="secondary"
        variant="secondary"
        onPress={() => void speak(HELP_MESSAGE)}
        testID="help-repeat"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    marginBottom: spacing.md,
  },
});
