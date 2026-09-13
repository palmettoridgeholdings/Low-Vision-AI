import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

import { AccessibilitySettingsButton } from "@/components/AccessibilitySettingsButton";
import { RETURNED_FROM_ACCESSIBILITY_SETTINGS_MESSAGE } from "@/constants/accessibilityCopy";
import { openAndroidAccessibilitySettings } from "@/utils/openAccessibilitySettings";

let appStateHandler: ((status: AppStateStatus) => void) | undefined;

jest.mock("@/utils/openAccessibilitySettings", () => ({
  openAndroidAccessibilitySettings: jest.fn().mockResolvedValue(true),
}));

/**
 * Covers requirement 4: pressing the control opens the system Accessibility
 * settings, and returning to the app afterward announces the return and
 * re-checks screen-reader status rather than waiting indefinitely on a
 * native event that may not always fire promptly.
 */
describe("AccessibilitySettingsButton", () => {
  beforeEach(() => {
    appStateHandler = undefined;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_event, handler) => {
      appStateHandler = handler;
      return { remove: jest.fn() };
    });
    (openAndroidAccessibilitySettings as jest.Mock).mockClear();
    require("expo-speech").speak.mockClear();
  });

  it("exposes an accessible button that opens Accessibility settings when pressed", () => {
    render(<AccessibilitySettingsButton />);

    fireEvent.press(screen.getByRole("button", { name: "Open Android accessibility settings" }));

    expect(openAndroidAccessibilitySettings).toHaveBeenCalled();
  });

  it("announces the return and rechecks screen-reader status once the app is foregrounded again", async () => {
    const Speech = require("expo-speech");
    render(<AccessibilitySettingsButton />);

    fireEvent.press(screen.getByRole("button", { name: "Open Android accessibility settings" }));
    Speech.speak.mockClear();

    appStateHandler?.("active");

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        RETURNED_FROM_ACCESSIBILITY_SETTINGS_MESSAGE,
        expect.anything(),
      ),
    );
  });

  it("does not announce a return that was never preceded by opening settings", () => {
    const Speech = require("expo-speech");
    render(<AccessibilitySettingsButton />);
    Speech.speak.mockClear();

    appStateHandler?.("active");

    expect(Speech.speak).not.toHaveBeenCalledWith(
      RETURNED_FROM_ACCESSIBILITY_SETTINGS_MESSAGE,
      expect.anything(),
    );
  });
});
