import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

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
import { useAnswerSpeech } from "@/hooks/useAnswerSpeech";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { getServices } from "@/services/serviceRegistry";
import { recordLastAnswer } from "@/state/lastAnswerStore";
import type { ImageAnalysisMode } from "@/types/services";
import { colors } from "@/theme/colors";
import { fontSize, lineHeight } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { MIN_TOUCH_TARGET } from "@/theme/a11y";

const MODE_OPTIONS: { value: ImageAnalysisMode; label: string }[] = [
  { value: "read_text", label: "Read text / mail" },
  { value: "describe_scene", label: "Describe scene" },
  { value: "find_inspect", label: "Find / inspect" },
];

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
 */
export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ImageAnalysisMode>("read_text");
  const [question, setQuestion] = useState("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: "idle" });
  const cameraRef = useRef<CameraView>(null);
  const isConnected = useNetworkStatus();
  const speakAnswer = useAnswerSpeech();

  const capture = useCallback(async () => {
    if (!cameraRef.current) {
      return;
    }
    setAnalysisState({ status: "analyzing" });
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) {
        throw new Error("The camera did not return a photo. Please try again.");
      }
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
      void speakAnswer({ answerText: `${result.description} ${result.disclaimer}` });
    } catch (error) {
      setAnalysisState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong analyzing the photo.",
      });
    }
  }, [mode, question, speakAnswer]);

  if (!permission) {
    return <LoadingState label="Checking camera permission" />;
  }

  if (!permission.granted) {
    if (!permission.canAskAgain) {
      return (
        <ScreenContainer testID="camera-screen">
          <Heading>Camera assistance</Heading>
          <PermissionDeniedState permissionLabel="camera" />
        </ScreenContainer>
      );
    }
    return (
      <ScreenContainer testID="camera-screen">
        <Heading>Camera assistance</Heading>
        <BodyText style={styles.permissionBody}>
          Access AI needs camera access to read text, describe a scene, or help find an object.
        </BodyText>
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

      <ChoiceList
        groupLabel="What should Access AI do with the photo?"
        options={MODE_OPTIONS}
        selectedValue={mode}
        onSelect={setMode}
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

      <View style={styles.previewWrapper}>
        <CameraView ref={cameraRef} style={styles.preview} facing="back" />
      </View>

      <AccessibleButton
        label="Take photo"
        leadingGlyph="📸"
        onPress={capture}
        disabled={analysisState.status === "analyzing"}
        testID="camera-capture"
      />

      {analysisState.status === "analyzing" ? <LoadingState label="Analyzing photo" /> : null}

      {analysisState.status === "error" ? (
        <RetryableError message={analysisState.message} onRetry={capture} testID="camera-error" />
      ) : null}

      {analysisState.status === "success" ? (
        <View style={styles.resultPanel} testID="camera-result-panel">
          <Heading level={2}>Result</Heading>
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
