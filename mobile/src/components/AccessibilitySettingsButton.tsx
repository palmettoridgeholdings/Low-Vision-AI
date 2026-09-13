import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { AccessibleButton } from "@/components/AccessibleButton";
import { useSpeech } from "@/hooks/useSpeech";
import { screenReaderStatusService } from "@/services/accessibility/screenReaderStatusService";
import { openAndroidAccessibilitySettings } from "@/utils/openAccessibilitySettings";
import {
  OPEN_ACCESSIBILITY_SETTINGS_HINT,
  OPEN_ACCESSIBILITY_SETTINGS_LABEL,
  RETURNED_FROM_ACCESSIBILITY_SETTINGS_MESSAGE,
} from "@/constants/accessibilityCopy";

export interface AccessibilitySettingsButtonProps {
  testID?: string;
}

/**
 * "Open Android accessibility settings" control shared by the Welcome and
 * Help screens (blind-first accessibility pass, requirement 4). Opens the
 * system Accessibility settings screen, then — once the app returns to the
 * foreground — announces the return and re-checks screen-reader status, so
 * the rest of the app reacts immediately if the user turned TalkBack on
 * while away rather than waiting on a native event that may not always fire
 * promptly.
 */
export function AccessibilitySettingsButton({ testID }: AccessibilitySettingsButtonProps) {
  const { speak } = useSpeech();
  const awaitingReturnRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (status === "active" && awaitingReturnRef.current) {
        awaitingReturnRef.current = false;
        screenReaderStatusService.refresh();
        void speak(RETURNED_FROM_ACCESSIBILITY_SETTINGS_MESSAGE);
      }
    });
    return () => subscription.remove();
    // Intentionally run only on mount/unmount — `speak` is stable for the lifetime of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = () => {
    awaitingReturnRef.current = true;
    void openAndroidAccessibilitySettings();
  };

  return (
    <AccessibleButton
      label={OPEN_ACCESSIBILITY_SETTINGS_LABEL}
      hint={OPEN_ACCESSIBILITY_SETTINGS_HINT}
      size="secondary"
      variant="secondary"
      onPress={handlePress}
      testID={testID ?? "open-accessibility-settings"}
    />
  );
}
