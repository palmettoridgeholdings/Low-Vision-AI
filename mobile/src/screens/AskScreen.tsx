import { useCallback, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import {
  AccessibleButton,
  BodyText,
  Heading,
  LoadingState,
  OfflineBanner,
  RetryableError,
} from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAnswerSpeech } from "@/hooks/useAnswerSpeech";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { recordLastAnswer } from "@/state/lastAnswerStore";
import { getServices } from "@/services/serviceRegistry";
import { colors } from "@/theme/colors";
import { fontSize, lineHeight } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { MIN_TOUCH_TARGET } from "@/theme/a11y";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; answerText: string };

/** "Type a question" screen. Talks to QuestionService (mock by default — see serviceRegistry.ts). */
export function AskScreen() {
  const [questionText, setQuestionText] = useState("");
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle" });
  const isConnected = useNetworkStatus();
  const speakAnswer = useAnswerSpeech();

  const submit = useCallback(async () => {
    const text = questionText.trim();
    if (!text) {
      setRequestState({ status: "error", message: "Please type a question first." });
      return;
    }
    setRequestState({ status: "loading" });
    try {
      const result = await getServices().question.ask({ text });
      recordLastAnswer(result.answerText, "question");
      setRequestState({ status: "success", answerText: result.answerText });
      void speakAnswer(result);
    } catch (error) {
      setRequestState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong getting your answer.",
      });
    }
  }, [questionText, speakAnswer]);

  return (
    <ScreenContainer scroll testID="ask-screen">
      <Heading>Type a question</Heading>
      {!isConnected ? <OfflineBanner /> : null}

      <BodyText style={styles.label}>Your question</BodyText>
      <TextInput
        style={styles.input}
        value={questionText}
        onChangeText={setQuestionText}
        placeholder="e.g. What does this label say?"
        placeholderTextColor={colors.textSecondary}
        multiline
        accessibilityLabel="Your question"
        accessibilityHint="Enter a question, then activate Get answer"
        testID="ask-input"
      />

      <AccessibleButton
        label="Get answer"
        onPress={submit}
        disabled={requestState.status === "loading"}
        testID="ask-submit"
      />

      {requestState.status === "loading" ? <LoadingState label="Getting your answer" /> : null}

      {requestState.status === "error" ? (
        <RetryableError message={requestState.message} onRetry={submit} testID="ask-error" />
      ) : null}

      {requestState.status === "success" ? (
        <View style={styles.answerPanel} testID="ask-answer-panel">
          <Heading level={2}>Answer</Heading>
          <BodyText>{requestState.answerText}</BodyText>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: MIN_TOUCH_TARGET * 1.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    padding: spacing.md,
    marginBottom: spacing.md,
    textAlignVertical: "top",
  },
  answerPanel: {
    marginTop: spacing.md,
  },
});
