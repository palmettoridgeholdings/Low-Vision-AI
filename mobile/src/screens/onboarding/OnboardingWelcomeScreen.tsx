import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AccessibleButton, BodyText, Heading } from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { chooseSetupRoute } from "@/state/appStateStore";
import { useSpeech } from "@/hooks/useSpeech";
import { ONBOARDING_WELCOME_MESSAGE } from "@/constants/onboardingCopy";
import { spacing } from "@/theme/spacing";

/**
 * State A (Welcome) from docs/BLIND_FIRST_ONBOARDING_SPEC.md. Exposes both
 * required routes as large, standard, focusable/labeled controls —
 * intentionally NOT auto-spoken: at this point TalkBack/VoiceOver's own
 * navigation already reads this screen, and forcing speech before the user
 * has chosen anything would fight the screen reader rather than help it.
 */
export function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { speak } = useSpeech();

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
          label="Start spoken setup"
          hint="Recommended if you are blind or have no useful vision"
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
