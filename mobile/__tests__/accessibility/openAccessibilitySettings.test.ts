import { Linking, Platform } from "react-native";

import { openAndroidAccessibilitySettings } from "@/utils/openAccessibilitySettings";

/**
 * Covers requirement 4 (accessibility settings control): the direct Android
 * intent is tried first, with a graceful fallback to general device
 * settings if that intent isn't available — and it never requests any
 * permission or tries to enable an accessibility service itself, since it
 * only ever calls the two Linking entry points above.
 */
describe("openAndroidAccessibilitySettings", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "sendIntent").mockReset();
    jest.spyOn(Linking, "openSettings").mockReset();
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
  });

  it("opens the direct Android accessibility settings intent", async () => {
    (Linking.sendIntent as jest.Mock).mockResolvedValue(undefined);

    const result = await openAndroidAccessibilitySettings();

    expect(Linking.sendIntent).toHaveBeenCalledWith("android.settings.ACCESSIBILITY_SETTINGS");
    expect(Linking.openSettings).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("falls back to general settings when the direct intent fails", async () => {
    (Linking.sendIntent as jest.Mock).mockRejectedValue(new Error("intent not available"));
    (Linking.openSettings as jest.Mock).mockResolvedValue(undefined);

    const result = await openAndroidAccessibilitySettings();

    expect(Linking.openSettings).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("reports failure (without throwing) when both paths fail", async () => {
    (Linking.sendIntent as jest.Mock).mockRejectedValue(new Error("intent not available"));
    (Linking.openSettings as jest.Mock).mockRejectedValue(new Error("settings not available"));

    const result = await openAndroidAccessibilitySettings();

    expect(result).toBe(false);
  });

  it("skips the Android-only intent on other platforms", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    (Linking.openSettings as jest.Mock).mockResolvedValue(undefined);

    const result = await openAndroidAccessibilitySettings();

    expect(Linking.sendIntent).not.toHaveBeenCalled();
    expect(Linking.openSettings).toHaveBeenCalled();
    expect(result).toBe(true);

    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
  });
});
