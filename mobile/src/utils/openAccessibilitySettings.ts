import { Linking, Platform } from "react-native";

/**
 * Opens the system Accessibility settings screen so the user can turn on
 * TalkBack (or any other accessibility service) themselves. Access AI never
 * requests an invasive permission or tries to enable a service
 * programmatically — this only navigates to the OS screen where the person
 * makes that choice (blind-first accessibility pass, requirement 4).
 *
 * Tries the direct Android "Accessibility settings" intent first (the
 * safest Expo/React Native-compatible way to reach it — a standard
 * `Linking.sendIntent` call, no custom native module). If that intent isn't
 * available on this device/platform, falls back to the general app/device
 * settings screen via `Linking.openSettings()` so the control still does
 * something useful rather than silently failing.
 *
 * Returns true if either path reports success, false if both failed. Never
 * throws.
 */
export async function openAndroidAccessibilitySettings(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      await Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS");
      return true;
    } catch {
      // Fall through to the generic fallback below.
    }
  }

  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}
