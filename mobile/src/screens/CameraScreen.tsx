import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  AccessibleButton,
  BodyText,
  ChoiceList,
  Heading,
  LoadingState,
  OfflineBanner,
  PermissionDeniedState,
  RetryableError,
} from "@/components";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAccessibilityFocusRef } from "@/hooks/useAccessibilityFocusRef";
import { useAutoSpeakOnMount } from "@/hooks/useAutoSpeakOnMount";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSpokenGuidance } from "@/hooks/useSpokenGuidance";
import { getServices } from "@/services/serviceRegistry";
import { recordLastAnswer } from "@/state/lastAnswerStore";
import type { ImageAnalysisMode } from "@/types/services";
import {
  CAMERA_ANALYZING_MESSAGE,
  CAMERA_CAPTURING_MESSAGE,
  CAMERA_PERMISSION_CONTEXT,
  buildCameraReadyMessage,
  buildRetryMessage,
} from "@/constants/statusMessages";
import { colors } from "@/theme/colors";
import { fontSize, lineHeight } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { MIN_TOUCH_TARGET } from "@/theme/a11y";

const MODE_OPTIONS: { value: ImageAnalysisMode; label: string }[] = [
  { value: "read_text", label: "Read text / mail" },
  { value: "describe_scene", label: "Describe scene" },
  { value: "find_inspect", label: "Find / inspect" },
];

const MODE_LABELS: Record<ImageAnalysisMode, string> = Object.fromEntries(
  MODE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ImageAnalysisMode, string>;

type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "error"; message: string }
  | { status: "success"; description: string; disclaimer: string };

/**
 * "Camera assistance" screen: capture behind expo-camera, analysis behind
 * the typed ImageAnalysisService (mock by default). Never presents its
 * output as safe for navigation — see the disclaimer rendered with every
 * result, sourced from the service response itself, not invented here.
 *
 * Every result (description + safety disclaimer) is spoken unconditionally
 * through useSpokenGuidance, regardless of the "Automatically speak
 * answers" setting: that setting governs conversational Q&A answers, while
 * a camera analysis's safety disclaimer is safety-critical information a
 * totally blind user must hear every time, not an optional personalization.
 */
export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ImageAnalysisMode>("read_text");
  const [question, setQuestion] = useState("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: "idle" });
  const cameraRef = useRef<CameraView>(null);
  const isConnected = useNetworkStatus();
  const { speak, stop, repeat } = useSpokenGuidance();

  // Speak the permission context before the OS shows its own dialog, and
  // confirm camera readiness (current mode + how to change it + nonvisual
  // positioning guidance) once access is already granted.
  useAutoSpeakOnMount(
    CAMERA_PERMISSION_CONTEXT,
    !!permission && !permission.granted && permission.canAskAgain,
  );
  useAutoSpeakOnMount(
    buildCameraReadyMessage(MODE_LABELS[mode]),
    !!permission?.granted && analysisState.status === "idle",
  );
  // Declared unconditionally (Rules of Hooks) even though the elements they
  // attach to only exist on some branches below.
  const permissionHeadingRef = useAccessibilityFocusRef<Text>("camera-needs-request");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shared
  // across three mutually-exclusive result elements of different native
  // types (LoadingState/RetryableError's View, the result Heading's Text).
  const statusRef = useAccessibilityFocusRef<any>(analysisState.status);

  const capture = useCallback(async () => {
    if (!cameraRef.current) {
      return;
    }
    setAnalysisState({ status: "analyzing" });
    await speak(CAMERA_CAPTURING_MESSAGE);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) {
        throw new Error("The camera did not return a photo. Please try again.");
      }
      await speak(CAMERA_ANALYZING_MESSAGE);
      const result = await getServices().imageAnalysis.analyze({
        imageUri: photo.uri,
        mode,
        question: mode === "find_inspect" ? question.trim() || undefined : undefined,
      });
      recordLastAnswer(result.description, "camera");
      setAnalysisState({
        status: "success",
        description: result.description,
        disclaimer: result.disclaimer,
      });
      void speak(`${result.description} ${result.disclaimer}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong analyzing the photo.";
      setAnalysisState({ status: "error", message });
      void speak(buildRetryMessage(message));
    }
  }, [mode, question, speak]);

  if (!permission) {
    return <LoadingState label="Checking camera permission" />;
  }

  if (!permission.granted) {
    if (!permission.canAskAgain) {
      return (
        <ScreenContainer testID="camera-screen">
          <Heading>Camera assistance</Heading>
          <PermissionDeniedState
            permissionLabel="camera"
            onRetry={() => void requestPermission()}
            testID="camera-permission-denied"
          />
        </ScreenContainer>
      );
    }
    return (
      <ScreenContainer testID="camera-screen">
        <Heading ref={permissionHeadingRef}>Camera assistance</Heading>
        <BodyText style={styles.permissionBody}>{CAMERA_PERMISSION_CONTEXT}</BodyText>
        <AccessibleButton
          label="Allow camera access"
          onPress={() => void requestPermission()}
          testID="camera-request-permission"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll testID="camera-screen">
      <Heading>Camera assistance</Heading>
      {!isConnected ? <OfflineBanner /> : null}

      <View style={styles.speechControls}>
        <AccessibleButton
          label="Repeat last spoken message"
          size="secondary"
          variant="secondary"
          onPress={() => void repeat()}
          testID="camera-repeat-status"
        />
        <AccessibleButton
          label="Stop speech"
          size="secondary"
          variant="secondary"
          onPress={() => void stop()}
          testID="camera-stop-speech"
        />
      </View>

      <ChoiceList
        groupLabel="What should Access AI do with the photo?"
        options={MODE_OPTIONS}
        selectedValue={mode}
        onSelect={setMode}
        announceSelection
      />

      {mode === "find_inspect" ? (
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="What are you looking for? (optional)"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="What are you looking for"
          testID="camera-find-question"
        />
      ) : null}

      <View
        style={styles.previewWrapper}
        // The live camera preview conveys nothing a totally blind user can
        // act on and has no stable accessible name, so TalkBack should skip
        // over it entirely rather than stopping on an unhelpful node.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <CameraView ref={cameraRef} style={styles.preview} facing="back" />
      </View>

      <AccessibleButton
        label="Take photo"
        leadingGlyph="📸"
        onPress={capture}
        disabled={analysisState.status === "analyzing"}
        testID="camera-capture"
      />

      {analysisState.status === "analyzing" ? (
        <LoadingState ref={statusRef} label="Analyzing photo" />
      ) : null}

      {analysisState.status === "error" ? (
        <RetryableError
          ref={statusRef}
          message={analysisState.message}
          onRetry={capture}
          testID="camera-error"
        />
      ) : null}

      {analysisState.status === "success" ? (
        <View style={styles.resultPanel} testID="camera-result-panel">
          <Heading ref={statusRef} level={2}>
            Result
          </Heading>
          <BodyText>{analysisState.description}</BodyText>
          <BodyText secondary style={styles.disclaimer}>
            {analysisState.disclaimer}
          </BodyText>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  permissionBody: {
    marginBottom: spacing.md,
  },
  speechControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewWrapper: {
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  preview: {
    flex: 1,
  },
  resultPanel: {
    marginTop: spacing.md,
  },
  disclaimer: {
    marginTop: spacing.sm,
  },
});
