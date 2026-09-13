import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

import { OnboardingWelcomeScreen } from "@/screens/onboarding/OnboardingWelcomeScreen";
import { appStateStore } from "@/state/appStateStore";
import { ONBOARDING_WELCOME_MESSAGE } from "@/constants/onboardingCopy";
import { DEFAULT_APP_STATE } from "@/types/onboarding";

/**
 * Covers requirement 1 (first-launch speech decision) and requirement 2
 * (the "Use recommended blind settings" shortcut) of the blind-first
 * accessibility pass.
 */
describe("OnboardingWelcomeScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    appStateStore.setState({ ...DEFAULT_APP_STATE, hydrated: true });
  });

  it("speaks the introduction unconditionally on first launch, with no prior selection needed", async () => {
    const Speech = require("expo-speech");
    render(<OnboardingWelcomeScreen />);

    // speak() cancels in-flight speech first, so the mocked Speech.speak
    // call lands a couple of microtask ticks after the mount effect fires.
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(ONBOARDING_WELCOME_MESSAGE, expect.anything()),
    );
  });

  it("places 'Use recommended blind settings' ahead of every other route control", () => {
    render(<OnboardingWelcomeScreen />);

    const labels = screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel as string);
    const shortcutIndex = labels.indexOf("Use recommended blind settings");
    const spokenIndex = labels.indexOf("Start spoken setup");
    const visualIndex = labels.indexOf("Start visual guided setup");

    expect(shortcutIndex).toBeGreaterThanOrEqual(0);
    expect(shortcutIndex).toBeLessThan(spokenIndex);
    expect(shortcutIndex).toBeLessThan(visualIndex);
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
  });

  it("offers working Repeat and Stop speech controls", async () => {
    const Speech = require("expo-speech");
    render(<OnboardingWelcomeScreen />);
    await waitFor(() => expect(Speech.speak).toHaveBeenCalled());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByRole("button", { name: "Repeat this introduction" }));
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(ONBOARDING_WELCOME_MESSAGE, expect.anything()),
    );

    fireEvent.press(screen.getByRole("button", { name: "Stop speech" }));
    // Speech.stop is invoked synchronously as the first step of stop(), so
    // this assertion does not need to wait.
    expect(Speech.stop).toHaveBeenCalled();
  });
});
