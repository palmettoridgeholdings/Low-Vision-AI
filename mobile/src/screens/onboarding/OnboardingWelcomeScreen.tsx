import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AccessibleButton, BodyText, Heading } from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { applyRecommendedBlindDefaults, chooseSetupRoute } from "@/state/appStateStore";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useSpokenGuidance } from "@/hooks/useSpokenGuidance";
import { ONBOARDING_WELCOME_MESSAGE } from "@/constants/onboardingCopy";
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
 */
export function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { speak, stop } = useSpokenGuidance();

  useAutoSpeakOnMount(ONBOARDING_WELCOME_MESSAGE, true);

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
      <Heading>Welcome to Access AI</Heading>
      <BodyText style={styles.body}>{ONBOARDING_WELCOME_MESSAGE}</BodyText>

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
          onPress={() => void speak(ONBOARDING_WELCOME_MESSAGE)}
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
