import { useRouter } from "expo-router";
import { View } from "react-native";

import { AccessibleButton, AccessibleToggle, BodyText, Heading } from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { backendConfig } from "@/services/config/backendConfig";
import { reopenOnboarding, resetOnboardingProgress, updateSettings } from "@/state/appStateStore";
import {
  ANSWER_STYLE_LABELS,
  DEVICE_PREFERENCE_LABELS,
  INTERACTION_PREFERENCE_LABELS,
  VISION_PROFILE_LABELS,
} from "@/constants/onboardingCopy";
import { spacing } from "@/theme/spacing";

/**
 * Settings screen: the two toggles required by the MVP brief (startup
 * speech, automatic answer speech), a way to reopen accessibility setup
 * (spec section 8, "Change accessibility setup"), and a read-only summary
 * of the current profile plus backend/mock-mode status.
 */
export function SettingsScreen() {
  const router = useRouter();
  const { onboarding, settings } = usePersistedAppState();

  const handleChangeSetup = () => {
    reopenOnboarding();
    router.push("/onboarding/vision");
  };

  const handleRestartSetup = () => {
    resetOnboardingProgress();
    router.replace("/onboarding/welcome");
  };

  return (
    <ScreenContainer scroll testID="settings-screen">
      <Heading>Settings</Heading>

      <Heading level={2}>Speech</Heading>
      <AccessibleToggle
        label="Speak a welcome message on launch"
        description="A short spoken greeting each time you open Access AI"
        value={settings.startupSpeechEnabled}
        onValueChange={(startupSpeechEnabled) => updateSettings({ startupSpeechEnabled })}
        testID="settings-startup-speech-toggle"
      />
      <AccessibleToggle
        label="Automatically speak answers"
        description="Read every answer aloud as soon as it's ready"
        value={settings.autoSpeakAnswers}
        onValueChange={(autoSpeakAnswers) => updateSettings({ autoSpeakAnswers })}
        testID="settings-auto-speak-toggle"
      />

      <View style={{ marginTop: spacing.lg }}>
        <Heading level={2}>Your accessibility setup</Heading>
        <BodyText>
          Vision:{" "}
          {onboarding.visionProfile ? VISION_PROFILE_LABELS[onboarding.visionProfile] : "Not set"}
        </BodyText>
        <BodyText>
          Interaction:{" "}
          {onboarding.interactionPreference
            ? INTERACTION_PREFERENCE_LABELS[onboarding.interactionPreference]
            : "Not set"}
        </BodyText>
        <BodyText>
          Device:{" "}
          {onboarding.devicePreference
            ? DEVICE_PREFERENCE_LABELS[onboarding.devicePreference]
            : "Not set"}
        </BodyText>
        <BodyText>
          Answer style:{" "}
          {onboarding.answerStyle ? ANSWER_STYLE_LABELS[onboarding.answerStyle] : "Not set"}
        </BodyText>
      </View>

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
        <AccessibleButton
          label="Change accessibility setup"
          onPress={handleChangeSetup}
          testID="settings-change-setup"
        />
        <AccessibleButton
          label="Restart setup from the beginning"
          variant="secondary"
          size="secondary"
          onPress={handleRestartSetup}
          testID="settings-restart-setup"
        />
      </View>

      <Heading level={2}>Backend status</Heading>
      <BodyText secondary>
        {backendConfig.mockMode
          ? "Running in mock mode. Answers, transcription, and photo analysis are placeholders — no data leaves this device."
          : `Connected to backend: ${backendConfig.baseUrl}`}
      </BodyText>
    </ScreenContainer>
  );
}
