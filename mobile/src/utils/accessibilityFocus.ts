import { AccessibilityInfo, findNodeHandle } from "react-native";

/**
 * Best-effort imperative accessibility focus. Moving focus is a nicety on
 * top of standard navigation/labels/roles/live regions — never a
 * requirement for anything to work — so this never throws: a missing ref, a
 * platform that can't resolve a native handle, or a native call that fails
 * must never block navigation or any other control (see
 * docs/BLIND_FIRST_ONBOARDING_SPEC.md section 10, "Failure Behavior").
 *
 * Kept as a standalone function (rather than inlined in a hook) so
 * components/tests can mock it directly instead of depending on
 * `findNodeHandle` actually resolving a native tag in the test renderer.
 */
export function focusAccessibilityNode(ref: { current: unknown } | null | undefined): void {
  const instance = ref?.current;
  if (!instance) {
    return;
  }
  try {
    const handle = findNodeHandle(instance as never);
    if (handle != null) {
      AccessibilityInfo.setAccessibilityFocus(handle);
    }
  } catch {
    // Never let an accessibility nicety break the screen.
  }
}
