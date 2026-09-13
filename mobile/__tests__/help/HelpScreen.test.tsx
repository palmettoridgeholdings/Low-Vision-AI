import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { HelpScreen } from "@/screens/HelpScreen";
import { HELP_MESSAGE } from "@/constants/onboardingCopy";
import { TALKBACK_HELP_SECTION } from "@/constants/accessibilityCopy";

const FULL_HELP_SPEECH = `${HELP_MESSAGE} ${TALKBACK_HELP_SECTION}`;

/**
 * Covers requirement 8 (Help screen TalkBack/Explore-by-Touch section):
 * shown and spoken unconditionally alongside the existing Help content, and
 * offers the same "Open Android accessibility settings" control as Welcome.
 */
describe("HelpScreen", () => {
  it("speaks the combined help and TalkBack guidance on mount", async () => {
    const Speech = require("expo-speech");
    render(<HelpScreen />);

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(FULL_HELP_SPEECH, expect.anything()),
    );
  });

  it("shows the TalkBack/Explore-by-Touch section and the accessibility settings control", () => {
    render(<HelpScreen />);

    expect(screen.getByText(TALKBACK_HELP_SECTION)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Open Android accessibility settings" }),
    ).toBeTruthy();
  });

  it("repeats the full combined message", async () => {
    const Speech = require("expo-speech");
    render(<HelpScreen />);
    await waitFor(() => expect(Speech.speak).toHaveBeenCalled());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByRole("button", { name: "Repeat this help message" }));

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(FULL_HELP_SPEECH, expect.anything()),
    );
  });
});
