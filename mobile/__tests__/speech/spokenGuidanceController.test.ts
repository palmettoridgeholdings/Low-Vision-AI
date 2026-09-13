import { spokenGuidanceController } from "@/services/speech/spokenGuidanceController";

/**
 * Covers the blind-first accessibility pass's spoken-guidance controller:
 * Speak/Stop/Repeat-last-prompt, and — the requirement this exists for —
 * that a fast sequence of speak() calls never plays overlapping/stale
 * speech, because each call cancels whatever came before it and a
 * superseded call's callback can never overwrite newer state.
 */
describe("spokenGuidanceController", () => {
  beforeEach(async () => {
    const Speech = require("expo-speech");
    Speech.speak.mockClear();
    Speech.stop.mockClear();
    await spokenGuidanceController.stop();
    spokenGuidanceController.reset();
  });

  it("speaks and settles in the stopped state once the utterance finishes", async () => {
    await spokenGuidanceController.speak("Hello there.");

    const Speech = require("expo-speech");
    expect(Speech.speak).toHaveBeenCalledWith("Hello there.", expect.anything());
    expect(spokenGuidanceController.getSnapshot().state).toBe("stopped");
    expect(spokenGuidanceController.getSnapshot().lastPrompt).toBe("Hello there.");
  });

  it("stops in-flight/playing speech and reports the stopped state", async () => {
    const Speech = require("expo-speech");
    await spokenGuidanceController.speak("Hello there.");
    Speech.stop.mockClear();

    await spokenGuidanceController.stop();

    expect(Speech.stop).toHaveBeenCalled();
    expect(spokenGuidanceController.getSnapshot().state).toBe("stopped");
  });

  it("repeatLast() re-speaks the most recent prompt", async () => {
    const Speech = require("expo-speech");
    await spokenGuidanceController.speak("Recording started.");
    Speech.speak.mockClear();

    await spokenGuidanceController.repeatLast();

    expect(Speech.speak).toHaveBeenCalledWith("Recording started.", expect.anything());
  });

  it("repeatLast() does nothing when nothing has been spoken yet", async () => {
    const Speech = require("expo-speech");
    await spokenGuidanceController.repeatLast();
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it("cancels a superseded speak() so only the latest utterance actually plays", async () => {
    const Speech = require("expo-speech");

    const first = spokenGuidanceController.speak("First announcement.");
    const second = spokenGuidanceController.speak("Second announcement.");
    await Promise.all([first, second]);

    // The first call was superseded before it ever reached deviceTtsService —
    // only the second, latest utterance should have actually played.
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect(Speech.speak).toHaveBeenCalledWith("Second announcement.", expect.anything());
    expect(spokenGuidanceController.getSnapshot().lastPrompt).toBe("Second announcement.");
    expect(spokenGuidanceController.getSnapshot().state).toBe("stopped");
  });

  it("reports the error state when the underlying speech callback reports a failure", async () => {
    const Speech = require("expo-speech");
    Speech.speak.mockImplementationOnce((_text: string, options?: { onError?: (e: unknown) => void }) => {
      options?.onError?.(new Error("synthesis failed"));
    });

    await spokenGuidanceController.speak("This will fail.");

    expect(spokenGuidanceController.getSnapshot().state).toBe("error");
  });
});
