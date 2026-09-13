import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

jest.mock("@/utils/accessibilityFocus", () => ({
  focusAccessibilityNode: jest.fn(),
}));

import { VoiceScreen } from "@/screens/VoiceScreen";
import { focusAccessibilityNode } from "@/utils/accessibilityFocus";
import {
  MICROPHONE_PERMISSION_CONTEXT,
  VOICE_MIC_READY_MESSAGE,
  VOICE_PROCESSING_MESSAGE,
  VOICE_RECORDING_CANCELLED_MESSAGE,
  VOICE_RECORDING_STARTED_MESSAGE,
} from "@/constants/statusMessages";

function accessibilityInfoMock() {
  return require("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo");
}

/**
 * Covers requirement 5 (permission context spoken before the OS dialog,
 * denied-state retry) and requirement 7 (voice workflow status
 * announcements: mic-ready, recording-started, cancellation, processing,
 * failure/retry) of the blind-first accessibility pass. The transcription
 * success path is exercised indirectly: this suite relies on the shared
 * jest.setup.ts mock's `useAudioRecorder().uri` staying `null`, which
 * exercises the "no recording captured" failure path without needing to
 * mock the transcription/question services.
 */
describe("VoiceScreen", () => {
  beforeEach(() => {
    (focusAccessibilityNode as jest.Mock).mockClear();
    accessibilityInfoMock().__emitScreenReaderChanged(false);
  });

  it("speaks the permission context before requesting, when access has not been granted", async () => {
    const AudioModule = require("expo-audio").AudioModule;
    AudioModule.getRecordingPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      canAskAgain: true,
    });
    const Speech = require("expo-speech");

    render(<VoiceScreen />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Allow microphone access" })).toBeTruthy(),
    );
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(MICROPHONE_PERMISSION_CONTEXT, expect.anything()),
    );
  });

  it("shows a working retry from the permission-denied state", async () => {
    const AudioModule = require("expo-audio").AudioModule;
    AudioModule.getRecordingPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
    });
    AudioModule.requestRecordingPermissionsAsync.mockResolvedValueOnce({
      granted: true,
      canAskAgain: true,
    });

    render(<VoiceScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("voice-permission-denied")).toBeTruthy(),
    );
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Start recording" })).toBeTruthy(),
    );
  });

  it("announces microphone readiness once access is already granted", async () => {
    const Speech = require("expo-speech");
    render(<VoiceScreen />);

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(VOICE_MIC_READY_MESSAGE, expect.anything()),
    );
  });

  it("announces recording start and offers Stop and Cancel controls", async () => {
    const Speech = require("expo-speech");
    render(<VoiceScreen />);
    await waitFor(() => expect(screen.getByTestId("voice-start-recording")).toBeTruthy());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByTestId("voice-start-recording"));

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        VOICE_RECORDING_STARTED_MESSAGE,
        expect.anything(),
      ),
    );
    expect(screen.getByTestId("voice-stop-recording")).toBeTruthy();
    expect(screen.getByTestId("voice-cancel-recording")).toBeTruthy();
  });

  it("cancels a recording without submitting it", async () => {
    const Speech = require("expo-speech");
    render(<VoiceScreen />);
    await waitFor(() => expect(screen.getByTestId("voice-start-recording")).toBeTruthy());
    fireEvent.press(screen.getByTestId("voice-start-recording"));
    await waitFor(() => expect(screen.getByTestId("voice-cancel-recording")).toBeTruthy());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByTestId("voice-cancel-recording"));

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        VOICE_RECORDING_CANCELLED_MESSAGE,
        expect.anything(),
      ),
    );
    expect(screen.getByTestId("voice-start-recording")).toBeTruthy();
  });

  it("announces processing, then the failure and retry guidance, when no recording was captured", async () => {
    const Speech = require("expo-speech");
    render(<VoiceScreen />);
    await waitFor(() => expect(screen.getByTestId("voice-start-recording")).toBeTruthy());
    fireEvent.press(screen.getByTestId("voice-start-recording"));
    await waitFor(() => expect(screen.getByTestId("voice-stop-recording")).toBeTruthy());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByTestId("voice-stop-recording"));

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(VOICE_PROCESSING_MESSAGE, expect.anything()),
    );
    await waitFor(() => expect(screen.getByTestId("voice-error")).toBeTruthy());
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        expect.stringContaining("Activate Try again to retry."),
        expect.anything(),
      ),
    );
  });

  it("moves accessibility focus into the status region when recording starts", async () => {
    render(<VoiceScreen />);
    await waitFor(() => expect(screen.getByTestId("voice-start-recording")).toBeTruthy());
    const callsBeforeStart = (focusAccessibilityNode as jest.Mock).mock.calls.length;

    fireEvent.press(screen.getByTestId("voice-start-recording"));

    await waitFor(() => expect(screen.getByTestId("voice-stop-recording")).toBeTruthy());
    expect((focusAccessibilityNode as jest.Mock).mock.calls.length).toBeGreaterThan(
      callsBeforeStart,
    );
  });

  it("announces recording start through TalkBack instead of device TTS when a screen reader is active", async () => {
    const AccessibilityInfo = accessibilityInfoMock();
    const Speech = require("expo-speech");
    AccessibilityInfo.__emitScreenReaderChanged(true);

    render(<VoiceScreen />);
    await waitFor(() => expect(screen.getByTestId("voice-start-recording")).toBeTruthy());
    Speech.speak.mockClear();
    AccessibilityInfo.announceForAccessibility.mockClear();

    fireEvent.press(screen.getByTestId("voice-start-recording"));

    await waitFor(() =>
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        VOICE_RECORDING_STARTED_MESSAGE,
      ),
    );
    expect(Speech.speak).not.toHaveBeenCalled();
  });
});
