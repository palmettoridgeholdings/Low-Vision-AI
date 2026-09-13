/**
 * "Ask by voice" screen: recording behind expo-audio, transcription behind
 * the typed TranscriptionService (mock by default — see serviceRegistry.ts).
 *
 * NOTE ON expo-audio: this was written without network access to install
 * or verify against the actual `expo-audio` package (see mobile/README.md).
 * `useAudioRecorder`, `RecordingPresets`, and `AudioModule`'s permission
 * functions are used the way they were documented as of this app's
 * knowledge base, but expo-audio is a newer package whose imperative API
 * has moved between SDK releases. Before shipping, verify each call below
 * against the exact version installed (`npm ls expo-audio`) and the
 * upstream docs, and adjust names/signatures if they've changed.
 */
import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AccessibleButton,
  BodyText,
  Heading,
  LoadingState,
  OfflineBanner,
  PermissionDeniedState,
  RetryableError,
} from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAnswerSpeech } from "@/hooks/useAnswerSpeech";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { getServices } from "@/services/serviceRegistry";
import { recordLastAnswer } from "@/state/lastAnswerStore";
import { spacing } from "@/theme/spacing";

type PermissionState = "checking" | "granted" | "needs-request" | "denied";
type FlowState =
  | { status: "idle" }
  | { status: "recording" }
  | { status: "processing" }
  | { status: "error"; message: string }
  | { status: "success"; questionText: string; answerText: string };

export function VoiceScreen() {
  const [permissionState, setPermissionState] = useState<PermissionState>("checking");
  const [flowState, setFlowState] = useState<FlowState>({ status: "idle" });
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY!);
  const recorderState = useAudioRecorderState(audioRecorder);
  const isConnected = useNetworkStatus();
  const speakAnswer = useAnswerSpeech();

  useEffect(() => {
    let isMounted = true;
    AudioModule.getRecordingPermissionsAsync()
      .then((response) => {
        if (!isMounted) return;
        setPermissionState(
          response.granted ? "granted" : response.canAskAgain ? "needs-request" : "denied",
        );
      })
      .catch(() => {
        if (isMounted) setPermissionState("needs-request");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const response = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionState(
        response.granted ? "granted" : response.canAskAgain ? "needs-request" : "denied",
      );
    } catch {
      setPermissionState("denied");
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setFlowState({ status: "recording" });
    } catch (error) {
      setFlowState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not start recording.",
      });
    }
  }, [audioRecorder]);

  const stopRecordingAndAsk = useCallback(async () => {
    setFlowState({ status: "processing" });
    try {
      await audioRecorder.stop();
      const audioUri = audioRecorder.uri;
      if (!audioUri) {
        throw new Error("No recording was captured. Please try again.");
      }
      const transcription = await getServices().transcription.transcribe({ audioUri });
      const answer = await getServices().question.ask({ text: transcription.text });
      recordLastAnswer(answer.answerText, "voice");
      setFlowState({
        status: "success",
        questionText: transcription.text,
        answerText: answer.answerText,
      });
      void speakAnswer(answer);
    } catch (error) {
      setFlowState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong processing your question.",
      });
    }
  }, [audioRecorder, speakAnswer]);

  if (permissionState === "checking") {
    return <LoadingState label="Checking microphone permission" />;
  }

  if (permissionState === "denied") {
    return (
      <ScreenContainer testID="voice-screen">
        <Heading>Ask by voice</Heading>
        <PermissionDeniedState permissionLabel="microphone" />
      </ScreenContainer>
    );
  }

  if (permissionState === "needs-request") {
    return (
      <ScreenContainer testID="voice-screen">
        <Heading>Ask by voice</Heading>
        <BodyText style={styles.permissionBody}>
          Access AI needs microphone access so you can ask questions by voice.
        </BodyText>
        <AccessibleButton
          label="Allow microphone access"
          onPress={requestPermission}
          testID="voice-request-permission"
        />
      </ScreenContainer>
    );
  }

  const isRecording = flowState.status === "recording" && recorderState.isRecording;
  const isBusy = flowState.status === "processing";

  return (
    <ScreenContainer scroll testID="voice-screen">
      <Heading>Ask by voice</Heading>
      {!isConnected ? <OfflineBanner /> : null}

      <BodyText style={styles.instructions}>
        Activate Start recording, ask your question out loud, then activate Stop and ask.
      </BodyText>

      <View style={styles.controls}>
        {!isRecording ? (
          <AccessibleButton
            label="Start recording"
            leadingGlyph="🎙️"
            onPress={startRecording}
            disabled={isBusy}
            testID="voice-start-recording"
          />
        ) : (
          <AccessibleButton
            label="Stop and ask"
            leadingGlyph="⏹️"
            variant="danger"
            onPress={stopRecordingAndAsk}
            testID="voice-stop-recording"
          />
        )}
      </View>

      {isBusy ? <LoadingState label="Working on your question" /> : null}

      {flowState.status === "error" ? (
        <RetryableError message={flowState.message} onRetry={startRecording} testID="voice-error" />
      ) : null}

      {flowState.status === "success" ? (
        <View style={styles.resultPanel} testID="voice-result-panel">
          <Heading level={2}>You asked</Heading>
          <BodyText>{flowState.questionText}</BodyText>
          <Heading level={2}>Answer</Heading>
          <BodyText>{flowState.answerText}</BodyText>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  permissionBody: {
    marginBottom: spacing.md,
  },
  instructions: {
    marginBottom: spacing.md,
  },
  controls: {
    marginBottom: spacing.md,
  },
  resultPanel: {
    marginTop: spacing.md,
  },
});
