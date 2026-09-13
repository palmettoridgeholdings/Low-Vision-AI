import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AccessibilityFocusRegion } from "@/components/AccessibilityFocusRegion";
import { focusAccessibilityNode } from "@/utils/accessibilityFocus";

jest.mock("@/utils/accessibilityFocus", () => ({
  focusAccessibilityNode: jest.fn(),
}));

/**
 * Covers requirement 6 (predictable accessibility focus) at the shared
 * building-block level used across onboarding, Voice, and Camera: focus
 * moves once when `focusKey` changes (mount, then any later transition it's
 * keyed to — a permission result, a validation error, a recording/result
 * state), and — the "predictable" half of the requirement — never fires
 * again on an unrelated rerender, which is what would eventually read as
 * focus being stolen back from a user mid-exploration.
 */
describe("AccessibilityFocusRegion", () => {
  beforeEach(() => {
    (focusAccessibilityNode as jest.Mock).mockClear();
  });

  it("requests focus once when it mounts", () => {
    render(
      <AccessibilityFocusRegion focusKey="mount">
        <Text>Heading</Text>
      </AccessibilityFocusRegion>,
    );

    expect(focusAccessibilityNode).toHaveBeenCalledTimes(1);
  });

  it("requests focus again when focusKey changes, but not on an unrelated rerender", () => {
    const { rerender } = render(
      <AccessibilityFocusRegion focusKey="idle">
        <Text>Status: idle</Text>
      </AccessibilityFocusRegion>,
    );
    expect(focusAccessibilityNode).toHaveBeenCalledTimes(1);

    // Same focusKey, different children — must NOT refocus (this is what
    // keeps focus from being stolen back on every rerender).
    rerender(
      <AccessibilityFocusRegion focusKey="idle">
        <Text>Status: idle (relabeled)</Text>
      </AccessibilityFocusRegion>,
    );
    expect(focusAccessibilityNode).toHaveBeenCalledTimes(1);

    // A genuinely new focusKey (e.g. flowState.status flipping to
    // "recording") must refocus exactly once more.
    rerender(
      <AccessibilityFocusRegion focusKey="recording">
        <Text>Status: recording</Text>
      </AccessibilityFocusRegion>,
    );
    expect(focusAccessibilityNode).toHaveBeenCalledTimes(2);
  });
});
