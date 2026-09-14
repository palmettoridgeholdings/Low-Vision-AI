import { StyleSheet, Text } from "react-native";

import { AccessibilitySettingsButton, AccessibleButton, BodyText, Heading } from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAccessibilityFocusRef } from "@/hooks/useAccessibilityFocusRef";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useSpeech } from "@/hooks/useSpeech";
import { HELP_MESSAGE } from "@/constants/onboardingCopy";
import { TALKBACK_HELP_SECTION } from "@/constants/accessibilityCopy";
import { spacing } from "@/theme/spacing";

const FULL_HELP_SPEECH = `${HELP_MESSAGE} ${TALKBACK_HELP_SECTION}`;

/**
 * "Help / What can I do?" (spec section 8): a concise spoken/readable
 * description of the app's primary actions, reachable from Home at any
 * time and safe to use before or after onboarding. Also carries the
 * TalkBack/Explore-by-Touch section required by the blind-first
 * accessibility pass (requirement 8) — shown and spoken unconditionally,
 * regardless of whether TalkBack happens to be on right now, since this is
 * exactly where a user comes to learn how to turn it on in the first place.
 */
export function HelpScreen() {
  const { speak } = useSpeech();
  useAutoSpeakOnMount(FULL_HELP_SPEECH, true);
  const headingRef = useAccessibilityFocusRef<Text>("help-mount");

  return (
    <ScreenContainer scroll testID="help-screen">
      <Heading ref={headingRef}>Help</Heading>
      <BodyText style={styles.body}>{HELP_MESSAGE}</BodyText>
      <BodyText secondary style={styles.body}>
        This app is assistive software, not a navigation or safety system. A single photo cannot
        establish that a route, object, or medication is safe — verify anything uncertain with a
        trusted source.
      </BodyText>

      <Heading level={2}>Using TalkBack</Heading>
      <BodyText style={styles.body}>{TALKBACK_HELP_SECTION}</BodyText>

      <AccessibleButton
        label="Repeat this help message"
        leadingGlyph="🔊"
        size="secondary"
        variant="secondary"
        onPress={() => void speak(FULL_HELP_SPEECH)}
        testID="help-repeat"
      />
      <AccessibilitySettingsButton testID="help-accessibility-settings" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    marginBottom: spacing.md,
  },
});
