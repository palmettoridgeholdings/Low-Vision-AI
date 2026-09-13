import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { OnboardingStepShell } from "@/components/OnboardingStepShell";

/**
 * Covers requirement 3 of the blind-first accessibility pass: Continue is
 * never silently disabled — an incomplete required choice is announced
 * (spoken and shown) instead, and clears once the choice is made — plus the
 * shell's Repeat/Stop speech controls.
 */
describe("OnboardingStepShell", () => {
  it("announces the validation message instead of advancing when canContinue is false", async () => {
    const Speech = require("expo-speech");
    const onContinue = jest.fn();
    render(
      <OnboardingStepShell
        heading="Vision"
        prompt="Choose one."
        autoSpeak={false}
        onContinue={onContinue}
        canContinue={false}
        validationMessage="Please choose a vision option before continuing."
      >
        <Text>content</Text>
      </OnboardingStepShell>,
    );

    fireEvent.press(screen.getByTestId("onboarding-continue"));

    expect(onContinue).not.toHaveBeenCalled();
    expect(
      screen.getByText("Please choose a vision option before continuing."),
    ).toBeTruthy();
    // speak() cancels in-flight speech first, so the mocked Speech.speak
    // call lands a couple of microtask ticks after press.
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        "Please choose a vision option before continuing.",
        expect.anything(),
      ),
    );
  });

  it("advances and shows no validation error once canContinue is true", () => {
    const onContinue = jest.fn();
    const { rerender } = render(
      <OnboardingStepShell
        heading="Vision"
        prompt="Choose one."
        autoSpeak={false}
        onContinue={onContinue}
        canContinue={false}
        validationMessage="Please choose a vision option before continuing."
      >
        <Text>content</Text>
      </OnboardingStepShell>,
    );
    fireEvent.press(screen.getByTestId("onboarding-continue"));
    expect(screen.getByTestId("onboarding-validation-error")).toBeTruthy();

    rerender(
      <OnboardingStepShell
        heading="Vision"
        prompt="Choose one."
        autoSpeak={false}
        onContinue={onContinue}
        canContinue
        validationMessage="Please choose a vision option before continuing."
      >
        <Text>content</Text>
      </OnboardingStepShell>,
    );

    // Making the choice clears the error even before Continue is pressed again.
    expect(screen.queryByTestId("onboarding-validation-error")).toBeNull();

    fireEvent.press(screen.getByTestId("onboarding-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("offers working Repeat and Stop speech controls", async () => {
    const Speech = require("expo-speech");
    render(
      <OnboardingStepShell heading="Vision" prompt="Choose one." autoSpeak={false}>
        <Text>content</Text>
      </OnboardingStepShell>,
    );
    Speech.speak.mockClear();

    fireEvent.press(screen.getByTestId("onboarding-repeat-instruction"));
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith("Choose one.", expect.anything()),
    );

    fireEvent.press(screen.getByTestId("onboarding-stop-speech"));
    // Speech.stop is invoked synchronously as the first step of stop(), so
    // this assertion does not need to wait.
    expect(Speech.stop).toHaveBeenCalled();
  });
});
