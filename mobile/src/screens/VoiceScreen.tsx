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
 *
 * Spoken status narration (mic ready, recording started/stopped,
 * processing, recognized question, failure/retry) goes through
 * useSpokenGuidance rather than raw TTS, so each announcement cancels any
 * still-playing one instead of queuing behind it. Narration is deliberately
 * limited to before recording starts and after it stops — never while
 * `isRecording` is true — so TTS output is never picked up by the
 * microphone mid-recording.
 */
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSpokenGuidance } from "@/hooks/useSpokenGuidance";
import { getServices } from "@/services/serviceRegistry";
import { recordLastAnswer } from "@/state/lastAnswerStore";
import {
  MICROPHONE_PERMISSION_CONTEXT,
  VOICE_MIC_READY_MESSAGE,
  VOICE_PROCESSING_MESSAGE,
  VOICE_RECORDING_CANCELLED_MESSAGE,
  VOICE_RECORDING_STARTED_MESSAGE,
  buildRecognizedQuestionMessage,
  buildRetryMessage,
} from "@/constants/statusMessages";
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
  const isConnected = useNetworkStatus();
  const speakAnswer = useAnswerSpeech();
  const { speak, stop, repeat } = useSpokenGuidance();
  const isRecordingRef = useRef(false);

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

  // Speak the permission context before the OS shows its own dialog (the
  // dialog appears only once "Allow microphone access" below is pressed),
  // and confirm mic readiness once access is already granted.
  useAutoSpeakOnMount(MICROPHONE_PERMISSION_CONTEXT, permissionState === "needs-request");
  useAutoSpeakOnMount(
    VOICE_MIC_READY_MESSAGE,
    permissionState === "granted" && flowState.status === "idle",
  );

  // Best-effort safety net: if the screen is left mid-recording (Back,
  // navigating elsewhere), stop the recorder rather than leaving it running
  // unattended. Never throws — this is cleanup, not a user-facing action.
  useEffect(() => {
    isRecordingRef.current = flowState.status === "recording";
  }, [flowState.status]);
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        // Promise.resolve(...) normalizes whatever audioRecorder.stop()
        // returns into a real promise before calling .catch() on it.
        Promise.resolve(audioRecorder.stop()).catch(() => {
          // Nothing more this cleanup can do if the native stop fails.
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await speak(VOICE_RECORDING_STARTED_MESSAGE);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start recording.";
      setFlowState({ status: "error", message });
      void speak(buildRetryMessage(message));
    }
  }, [audioRecorder, speak]);

  const cancelRecording = useCallback(async () => {
    try {
      await audioRecorder.stop();
    } catch {
      // The recorder may already have stopped on its own; proceed regardless.
    }
    setFlowState({ status: "idle" });
    await speak(VOICE_RECORDING_CANCELLED_MESSAGE);
  }, [audioRecorder, speak]);

  const stopRecordingAndAsk = useCallback(async () => {
    setFlowState({ status: "processing" });
    await speak(VOICE_PROCESSING_MESSAGE);
    try {
      await audioRecorder.stop();
      const audioUri = audioRecorder.uri;
      if (!audioUri) {
        throw new Error("No recording was captured. Please try again.");
      }
      const transcription = await getServices().transcription.transcribe({ audioUri });
      await speak(buildRecognizedQuestionMessage(transcription.text));
      const answer = await getServices().question.ask({ text: transcription.text });
      recordLastAnswer(answer.answerText, "voice");
      setFlowState({
        status: "success",
        questionText: transcription.text,
        answerText: answer.answerText,
      });
      void speakAnswer(answer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong processing your question.";
      setFlowState({ status: "error", message });
      void speak(buildRetryMessage(message));
    }
  }, [audioRecorder, speak, speakAnswer]);

  if (permissionState === "checking") {
    return <LoadingState label="Checking microphone permission" />;
  }

  if (permissionState === "denied") {
    return (
      <ScreenContainer testID="voice-screen">
        <Heading>Ask by voice</Heading>
        <PermissionDeniedState
          permissionLabel="microphone"
          onRetry={requestPermission}
          testID="voice-permission-denied"
        />
      </ScreenContainer>
    );
  }

  if (permissionState === "needs-request") {
    return (
      <ScreenContainer testID="voice-screen">
        <Heading>Ask by voice</Heading>
        <BodyText style={styles.permissionBody}>{MICROPHONE_PERMISSION_CONTEXT}</BodyText>
        <AccessibleButton
          label="Allow microphone access"
          onPress={requestPermission}
          testID="voice-request-permission"
        />
      </ScreenContainer>
    );
  }

  // The app owns this flow state. Native recorder-state hooks can update a
  // render later, which must not briefly hide Stop/Cancel from TalkBack.
  const isRecording = flowState.status === "recording";
  const isBusy = flowState.status === "processing";

  return (
    <ScreenContainer scroll testID="voice-screen">
      <Heading>Ask by voice</Heading>
      {!isConnected ? <OfflineBanner /> : null}

      <BodyText style={styles.instructions}>
        Activate Start recording, ask your question out loud, then activate Stop and ask.
      </BodyText>

      <View style={styles.speechControls}>
        <AccessibleButton
          label="Repeat last spoken message"
          size="secondary"
          variant="secondary"
          onPress={() => void repeat()}
          testID="voice-repeat-status"
        />
        <AccessibleButton
          label="Stop speech"
          size="secondary"
          variant="secondary"
          onPress={() => void stop()}
          testID="voice-stop-speech"
        />
      </View>

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
          <>
            <AccessibleButton
              label="Stop and ask"
              leadingGlyph="⏹️"
              variant="danger"
              onPress={stopRecordingAndAsk}
              testID="voice-stop-recording"
            />
            <AccessibleButton
              label="Cancel recording"
              size="secondary"
              variant="secondary"
              onPress={cancelRecording}
              testID="voice-cancel-recording"
            />
          </>
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
  speechControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  controls: {
    marginBottom: spacing.md,
  },
  resultPanel: {
    marginTop: spacing.md,
  },
});
