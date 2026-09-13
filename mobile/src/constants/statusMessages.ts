/**
 * Spoken status copy for the voice and camera workflows, plus the
 * permission pre-briefings spoken before the OS shows a camera/microphone
 * permission dialog (docs/BLIND_FIRST_ONBOARDING_SPEC.md section 10 and the
 * blind-first accessibility pass requirement that permission context is
 * announced before the OS dialog appears). Kept separate from
 * onboardingCopy.ts, which covers only the onboarding flow itself.
 */

export const MICROPHONE_PERMISSION_CONTEXT =
  "Access AI needs microphone access so you can ask questions by voice. Your device will now show a permission request; choose Allow to continue.";

export const CAMERA_PERMISSION_CONTEXT =
  "Access AI needs camera access to read text, describe a scene, or help find an object. Your device will now show a permission request; choose Allow to continue.";

export const VOICE_MIC_READY_MESSAGE =
  "Microphone ready. Activate Start recording to ask your question by voice.";

export const VOICE_RECORDING_STARTED_MESSAGE =
  "Recording started. Speak your question now. Activate Stop and ask when you're done, or Cancel recording to cancel.";

export const VOICE_RECORDING_CANCELLED_MESSAGE = "Recording cancelled.";

export const VOICE_PROCESSING_MESSAGE = "Recording stopped. Processing your question.";

export function buildRecognizedQuestionMessage(questionText: string): string {
  return `You asked: ${questionText}.`;
}

export function buildRetryMessage(errorMessage: string): string {
  return `${errorMessage} Activate Try again to retry.`;
}

export function buildCameraReadyMessage(currentModeLabel: string): string {
  return (
    "Camera ready. Point your phone's camera toward what you want analyzed, centered and " +
    `about arm's length away. Current mode: ${currentModeLabel}. To change modes, use the mode ` +
    "option above. Activate Take photo when ready."
  );
}

export const CAMERA_CAPTURING_MESSAGE = "Taking photo. Hold steady.";

export const CAMERA_ANALYZING_MESSAGE = "Analyzing photo.";
