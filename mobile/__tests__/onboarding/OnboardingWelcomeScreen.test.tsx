import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

import { OnboardingWelcomeScreen } from "@/screens/onboarding/OnboardingWelcomeScreen";
import { appStateStore } from "@/state/appStateStore";
import {
  TALKBACK_DISABLED_WELCOME_MESSAGE,
  TALKBACK_ENABLED_WELCOME_MESSAGE,
} from "@/constants/accessibilityCopy";
import { DEFAULT_APP_STATE } from "@/types/onboarding";

/**
 * Covers requirement 1 (first-launch speech decision), requirement 2 (the
 * "Use recommended blind settings" shortcut), requirement 3 (TalkBack-aware
 * first-launch instructions), and requirement 7 (the Welcome screen's exact
 * control order, including the new "Open Android accessibility settings"
 * control) of the blind-first accessibility pass.
 */
describe("OnboardingWelcomeScreen", () => {
  function accessibilityInfoMock() {
    return require("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo");
  }

  beforeEach(() => {
    mockPush.mockClear();
    require("expo-speech").speak.mockClear();
    accessibilityInfoMock().announceForAccessibility.mockClear();
    appStateStore.setState({ ...DEFAULT_APP_STATE, hydrated: true });
    accessibilityInfoMock().__emitScreenReaderChanged(false);
  });

  it("speaks the device-TTS introduction on first launch when no screen reader is detected", async () => {
    const Speech = require("expo-speech");
    render(<OnboardingWelcomeScreen />);

    // speak() cancels in-flight speech first, so the mocked Speech.speak
    // call lands a couple of microtask ticks after the mount effect fires.
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        TALKBACK_DISABLED_WELCOME_MESSAGE,
        expect.anything(),
      ),
    );
  });

  it("announces through TalkBack instead of device TTS when a screen reader is already on", async () => {
    const AccessibilityInfo = accessibilityInfoMock();
    const Speech = require("expo-speech");
    AccessibilityInfo.__emitScreenReaderChanged(true);

    render(<OnboardingWelcomeScreen />);

    await waitFor(() =>
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        TALKBACK_ENABLED_WELCOME_MESSAGE,
      ),
    );
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it("orders every control exactly as required: heading, shortcut, spoken, visual, repeat, stop, settings", () => {
    render(<OnboardingWelcomeScreen />);

    const labels = screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel as string);

    expect(labels).toEqual([
      "Use recommended blind settings",
      "Start spoken setup",
      "Start visual guided setup",
      "Repeat this introduction",
      "Stop speech",
      "Open Android accessibility settings",
    ]);
  });

  it("applies the full recommended blind profile and jumps to Confirmation", () => {
    render(<OnboardingWelcomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Use recommended blind settings" }));

    const state = appStateStore.getState();
    expect(state.onboarding.visionProfile).toBe("totally_blind");
    expect(state.onboarding.interactionPreference).toBe("voice_first");
    expect(state.onboarding.devicePreference).toBe("android_talkback");
    expect(state.onboarding.answerStyle).toBe("short_direct");
    expect(state.settings.autoSpeakAnswers).toBe(true);
    expect(mockPush).toHaveBeenCalledWith("/onboarding/confirmation");
    // Every value the shortcut sets stays user-overridable afterward — it's
    // a starting point, not a lock (requirement 7).
    expect(state.onboarding.currentStep).toBe("confirmation");
  });

  it("offers working Repeat and Stop speech controls", async () => {
    const Speech = require("expo-speech");
    render(<OnboardingWelcomeScreen />);
    await waitFor(() => expect(Speech.speak).toHaveBeenCalled());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByRole("button", { name: "Repeat this introduction" }));
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        TALKBACK_DISABLED_WELCOME_MESSAGE,
        expect.anything(),
      ),
    );

    fireEvent.press(screen.getByRole("button", { name: "Stop speech" }));
    // Speech.stop is invoked synchronously as the first step of stop(), so
    // this assertion does not need to wait.
    expect(Speech.stop).toHaveBeenCalled();
  });

  it("offers an Open Android accessibility settings control", () => {
    render(<OnboardingWelcomeScreen />);
    expect(
      screen.getByRole("button", { name: "Open Android accessibility settings" }),
    ).toBeTruthy();
  });
});
