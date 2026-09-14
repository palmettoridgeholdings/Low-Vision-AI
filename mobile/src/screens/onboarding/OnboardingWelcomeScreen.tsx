import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AccessibilitySettingsButton, AccessibleButton, BodyText, Heading } from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { applyRecommendedBlindDefaults, chooseSetupRoute } from "@/state/appStateStore";
import { useAccessibilityFocusRef } from "@/hooks/useAccessibilityFocusRef";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useScreenReaderStatus } from "@/hooks/useScreenReaderStatus";
import { useSpokenGuidance } from "@/hooks/useSpokenGuidance";
import { getOnboardingWelcomeMessage } from "@/constants/accessibilityCopy";
import { spacing } from "@/theme/spacing";

/**
 * State A (Welcome) from docs/BLIND_FIRST_ONBOARDING_SPEC.md.
 *
 * Unlike every later onboarding step, this screen's prompt is spoken
 * unconditionally, immediately on first launch — a totally blind first-time
 * user has not chosen a setup route yet, so there is nothing to gate speech
 * on here the way `autoSpeak` gates it on later steps. "Use recommended
 * blind settings" is the first focusable control on the screen (ahead of
 * "Start spoken setup"), so a user who wants the fastest path to a working,
 * totally-blind-tuned app never has to step through five more screens to
 * get it — every value it sets stays reviewable/editable afterward.
 *
 * The introduction itself now branches on live screen-reader status
 * (blind-first accessibility pass, requirement 3): while status is still
 * "unknown" (the brief moment before the first native check resolves),
 * nothing is spoken yet — speaking based on a guess could immediately
 * contradict what TalkBack itself is about to do. Once resolved,
 * spokenGuidanceController.speak() itself decides whether this text plays
 * as device TTS or as a native TalkBack announcement (see
 * spokenGuidanceController.ts) — this screen only has to pick the right
 * *content* for the situation.
 */
export function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { speak, stop } = useSpokenGuidance();
  const screenReaderStatus = useScreenReaderStatus();
  const introMessage = getOnboardingWelcomeMessage(screenReaderStatus);

  useAutoSpeakOnMount(introMessage, screenReaderStatus !== "unknown");
  const headingRef = useAccessibilityFocusRef<Text>("onboarding-welcome-mount");

  const useRecommendedBlindSettings = () => {
    applyRecommendedBlindDefaults();
    router.push("/onboarding/confirmation");
  };

  const startSpoken = () => {
    chooseSetupRoute("spoken");
    router.push("/onboarding/vision");
  };

  const startVisual = () => {
    chooseSetupRoute("visual");
    router.push("/onboarding/vision");
  };

  return (
    <ScreenContainer scroll testID="onboarding-welcome-screen">
      <Heading ref={headingRef}>Welcome to Access AI</Heading>
      <BodyText style={styles.body}>{introMessage}</BodyText>

      <View style={styles.actions}>
        <AccessibleButton
          label="Use recommended blind settings"
          hint="Sets up totally blind use, voice-first interaction, and short direct answers in one step — every choice stays editable afterward"
          onPress={useRecommendedBlindSettings}
          testID="onboarding-use-recommended-blind-settings"
        />
        <AccessibleButton
          label="Start spoken setup"
          hint="Choose each accessibility setting yourself, step by step"
          variant="secondary"
          onPress={startSpoken}
          testID="onboarding-start-spoken-setup"
        />
        <AccessibleButton
          label="Start visual guided setup"
          variant="secondary"
          onPress={startVisual}
          testID="onboarding-start-visual-setup"
        />
        <AccessibleButton
          label="Repeat this introduction"
          leadingGlyph="🔊"
          size="secondary"
          variant="secondary"
          onPress={() => void speak(introMessage)}
          testID="onboarding-welcome-repeat"
        />
        <AccessibleButton
          label="Stop speech"
          leadingGlyph="🛑"
          size="secondary"
          variant="secondary"
          onPress={() => void stop()}
          testID="onboarding-welcome-stop-speech"
        />
        <AccessibilitySettingsButton testID="onboarding-welcome-accessibility-settings" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    marginBottom: spacing.lg,
  },
  actions: {
    marginTop: spacing.sm,
  },
});
