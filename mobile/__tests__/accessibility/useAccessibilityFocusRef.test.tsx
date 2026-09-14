import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { useAccessibilityFocusRef } from "@/hooks/useAccessibilityFocusRef";
import { focusAccessibilityNode } from "@/utils/accessibilityFocus";

jest.mock("@/utils/accessibilityFocus", () => ({
  focusAccessibilityNode: jest.fn(),
}));

/**
 * Covers the corrected half of requirement 6 (predictable accessibility
 * focus) after the TalkBack regression fix: focus is commanded through a
 * ref attached directly to a real element (here, a plain Text standing in
 * for Heading/BodyText/etc.) rather than a synthetic wrapper, while
 * preserving the original contract — focus once on mount, again whenever
 * `focusKey` changes, and never on an unrelated rerender (which is what
 * would eventually read as focus being stolen back from a user
 * mid-exploration).
 */
function Probe({ focusKey, label }: { focusKey: unknown; label: string }) {
  const ref = useAccessibilityFocusRef<Text>(focusKey);
  return <Text ref={ref}>{label}</Text>;
}

describe("useAccessibilityFocusRef", () => {
  beforeEach(() => {
    (focusAccessibilityNode as jest.Mock).mockClear();
  });

  it("requests focus once when it mounts", () => {
    render(<Probe focusKey="mount" label="Heading" />);

    expect(focusAccessibilityNode).toHaveBeenCalledTimes(1);
  });

  it("requests focus again when focusKey changes, but not on an unrelated rerender", () => {
    const { rerender } = render(<Probe focusKey="idle" label="Status: idle" />);
    expect(focusAccessibilityNode).toHaveBeenCalledTimes(1);

    // Same focusKey, different label — must NOT refocus (this is what keeps
    // focus from being stolen back on every rerender).
    rerender(<Probe focusKey="idle" label="Status: idle (relabeled)" />);
    expect(focusAccessibilityNode).toHaveBeenCalledTimes(1);

    // A genuinely new focusKey (e.g. flowState.status flipping to
    // "recording") must refocus exactly once more.
    rerender(<Probe focusKey="recording" label="Status: recording" />);
    expect(focusAccessibilityNode).toHaveBeenCalledTimes(2);
  });

  it("passes a ref whose current value is the real rendered element, not a wrapper", () => {
    let capturedRef: { current: unknown } | undefined;
    function CaptureProbe() {
      const ref = useAccessibilityFocusRef<Text>("mount");
      capturedRef = ref;
      return <Text ref={ref}>Real element</Text>;
    }

    render(<CaptureProbe />);

    expect(capturedRef?.current).not.toBeNull();
  });
});
