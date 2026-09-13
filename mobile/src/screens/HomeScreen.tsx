import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AccessibleButton, BodyText, Heading, OfflineBanner } from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useLastAnswer } from "@/hooks/useLastAnswer";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSpeech } from "@/hooks/useSpeech";
import { useStartupSpeech } from "@/hooks/useStartupSpeech";
import { spacing } from "@/theme/spacing";

const NO_PREVIOUS_ANSWER_MESSAGE = "There is no previous answer yet.";

/**
 * Main screen. Six primary actions, per the MVP brief: Ask by voice, Camera
 * assistance, Type a question, Repeat last answer, Help, Settings. Every
 * control is a full-width AccessibleButton, so touch targets, contrast, and
 * accessible naming are inherited rather than re-implemented per screen.
 */
export function HomeScreen() {
  const router = useRouter();
  const isConnected = useNetworkStatus();
  const lastAnswer = useLastAnswer();
  const { speak } = useSpeech();

  useStartupSpeech();

  const handleRepeatLastAnswer = () => {
    void speak(lastAnswer ? lastAnswer.text : NO_PREVIOUS_ANSWER_MESSAGE);
  };

  return (
    <ScreenContainer scroll testID="home-screen">
      <Heading>Access AI</Heading>
      <BodyText secondary style={styles.subtitle}>
        Ask a question, use the camera, or open Settings to change how Access AI works for you.
      </BodyText>

      {!isConnected ? <OfflineBanner /> : null}

      <View style={styles.primaryGroup}>
        <AccessibleButton
          label="Ask by voice"
          leadingGlyph="🎙️"
          hint="Record a spoken question"
          onPress={() => router.push("/voice")}
          testID="home-ask-by-voice"
        />
        <AccessibleButton
          label="Camera assistance"
          leadingGlyph="📷"
          hint="Read text, describe a scene, or find an object"
          onPress={() => router.push("/camera")}
          testID="home-camera-assistance"
        />
        <AccessibleButton
          label="Type a question"
          leadingGlyph="⌨️"
          hint="Enter a question using the keyboard"
          onPress={() => router.push("/ask")}
          testID="home-type-a-question"
        />
        <AccessibleButton
          label="Repeat last answer"
          leadingGlyph="🔁"
          hint={lastAnswer ? "Speak the most recent answer again" : "No previous answer yet"}
          onPress={handleRepeatLastAnswer}
          testID="home-repeat-last-answer"
        />
      </View>

      <View style={styles.secondaryGroup}>
        <AccessibleButton
          label="Help"
          size="secondary"
          variant="secondary"
          onPress={() => router.push("/help")}
          testID="home-help"
        />
        <AccessibleButton
          label="Settings"
          size="secondary"
          variant="secondary"
          onPress={() => router.push("/settings")}
          testID="home-settings"
        />
      </View>

      {lastAnswer ? (
        <View style={styles.lastAnswerPanel} testID="home-last-answer-panel">
          <Heading level={2}>Last answer</Heading>
          <BodyText>{lastAnswer.text}</BodyText>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: spacing.lg,
  },
  primaryGroup: {
    marginBottom: spacing.lg,
  },
  secondaryGroup: {
    marginBottom: spacing.lg,
  },
  lastAnswerPanel: {
    marginTop: spacing.md,
  },
});
