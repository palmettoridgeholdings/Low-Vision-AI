import { useEffect, useRef, type ReactNode } from "react";
import { View } from "react-native";

import { focusAccessibilityNode } from "@/utils/accessibilityFocus";

export interface AccessibilityFocusRegionProps {
  children: ReactNode;
  /**
   * Change this value to move accessibility focus into this region again —
   * e.g. a screen's own name (focus once on mount), or a piece of state
   * (permission result, recording status, a validation error, a result or
   * failure) so focus follows that specific transition. Passing the same
   * value across rerenders never re-fires — this is what keeps focus
   * predictable rather than being stolen back on every rerender or while
   * the user is mid-exploration (blind-first accessibility pass,
   * requirement 6).
   */
  focusKey: unknown;
  testID?: string;
}

/**
 * Wraps content that should receive accessibility focus whenever `focusKey`
 * changes. A plain, unmarked View adds nothing to the accessibility tree by
 * itself, so wrapping existing content here never creates a new TalkBack
 * stop or changes what's read — it only adds a one-shot imperative focus
 * move timed to the event `focusKey` represents.
 */
export function AccessibilityFocusRegion({ children, focusKey, testID }: AccessibilityFocusRegionProps) {
  const ref = useRef<View>(null);

  useEffect(() => {
    focusAccessibilityNode(ref);
    // Intentionally keyed only on `focusKey` — see the prop doc above.
  }, [focusKey]);

  return (
    <View ref={ref} testID={testID}>
      {children}
    </View>
  );
}
