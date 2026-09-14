import { useEffect, useRef, type RefObject } from "react";

import { focusAccessibilityNode } from "@/utils/accessibilityFocus";

/**
 * Commands TalkBack/screen-reader accessibility focus onto a real,
 * already-accessible element whenever `focusKey` changes, and returns the
 * ref to attach to that element.
 *
 * Attach the returned ref directly onto an element that is already a
 * legitimate accessibility node — a `Heading`, `BodyText`,
 * `AccessibleButton`, `LoadingState`, `RetryableError`, or any other
 * element that already carries a proper `accessibilityRole`/label — never
 * onto a new, unlabeled wrapper created just to hold the ref.
 *
 * This replaces the earlier `AccessibilityFocusRegion` component, which
 * wrapped its children in a synthetic, unmarked `View` and focused that
 * wrapper directly. A plain `View` with no accessible name or role is not a
 * well-defined accessibility node, so commanding focus onto it produced
 * inconsistent TalkBack behavior — including TalkBack falling back to
 * announcing incidental visual details about the node (colors, pixel
 * dimensions, layout metadata) instead of anything meaningful. Focusing a
 * real, already-labeled element avoids that fallback entirely: TalkBack
 * always has a legitimate label/role to announce.
 *
 * `focusKey` follows the same contract as before: pass a screen's own name
 * (fires once on mount) or a piece of state (a permission result, a
 * validation message, a recording/analysis status) so focus follows that
 * specific transition. Passing the same value across rerenders never
 * re-fires — this is what keeps focus predictable rather than being stolen
 * back mid-exploration.
 *
 * When the same region can show one of several distinct real elements
 * depending on state (e.g. a loading indicator, an error, or a result
 * panel, only one of which is mounted at a time), attach the same ref to
 * each of them — whichever one is actually mounted when `focusKey` changes
 * is the one that receives focus.
 */
export function useAccessibilityFocusRef<T>(focusKey: unknown): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    focusAccessibilityNode(ref);
    // Intentionally keyed only on `focusKey` — see the doc above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return ref;
}
