import { spokenGuidanceController } from "@/services/speech/spokenGuidanceController";

/**
 * Covers requirement 2 (avoid competing speech) and requirement 9 (no
 * duplicated TalkBack/device-TTS announcements) of the blind-first
 * accessibility pass: every existing call site keeps calling
 * spokenGuidanceController.speak() unchanged, but while a screen reader is
 * active the controller hands the same text to
 * AccessibilityInfo.announceForAccessibility() instead of starting
 * on-device TTS, so the two channels never talk over each other. Once the
 * screen reader is off again, on-device TTS resumes exactly as before this
 * pass (already covered by __tests__/speech/spokenGuidanceController.test.ts).
 */
describe("spokenGuidanceController screen-reader awareness", () => {
  function accessibilityInfoMock() {
    return require("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo");
  }

  beforeEach(async () => {
    const Speech = require("expo-speech");
    Speech.speak.mockClear();
    Speech.stop.mockClear();
    accessibilityInfoMock().announceForAccessibility.mockClear();
    await spokenGuidanceController.stop();
    spokenGuidanceController.reset();
    accessibilityInfoMock().__emitScreenReaderChanged(false);
  });

  it("announces through TalkBack instead of starting device TTS while a screen reader is active", async () => {
    const AccessibilityInfo = accessibilityInfoMock();
    const Speech = require("expo-speech");
    AccessibilityInfo.__emitScreenReaderChanged(true);

    await spokenGuidanceController.speak("Recording started.");

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith("Recording started.");
    expect(Speech.speak).not.toHaveBeenCalled();
    expect(spokenGuidanceController.getSnapshot().state).toBe("stopped");
    expect(spokenGuidanceController.getSnapshot().lastPrompt).toBe("Recording started.");
  });

  it("still tracks lastPrompt for repeatLast() while announcing through TalkBack", async () => {
    const AccessibilityInfo = accessibilityInfoMock();
    AccessibilityInfo.__emitScreenReaderChanged(true);

    await spokenGuidanceController.speak("Camera ready.");
    AccessibilityInfo.announceForAccessibility.mockClear();

    await spokenGuidanceController.repeatLast();

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith("Camera ready.");
  });

  it("resumes on-device TTS once the screen reader is turned back off", async () => {
    const AccessibilityInfo = accessibilityInfoMock();
    const Speech = require("expo-speech");
    AccessibilityInfo.__emitScreenReaderChanged(true);
    await spokenGuidanceController.speak("First, while TalkBack is on.");
    AccessibilityInfo.announceForAccessibility.mockClear();

    AccessibilityInfo.__emitScreenReaderChanged(false);
    await spokenGuidanceController.speak("Second, after TalkBack is off.");

    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith("Second, after TalkBack is off.", expect.anything());
  });

  it("uses on-device TTS as usual when no screen reader is detected (covers the pre-resolution 'unknown' default too)", async () => {
    const Speech = require("expo-speech");

    await spokenGuidanceController.speak("Spoken with no screen reader detected.");

    expect(Speech.speak).toHaveBeenCalledWith(
      "Spoken with no screen reader detected.",
      expect.anything(),
    );
  });
});
