import { findNodeHandle } from "react-native";

import { focusAccessibilityNode } from "@/utils/accessibilityFocus";

// Mock only findNodeHandle on the real react-native module — everything
// else (View, Text, StyleSheet, ...) stays the genuine implementation, and
// AccessibilityInfo still resolves to jest.setup.ts's mock since that mocks
// react-native's internal AccessibilityInfo submodule path directly, which
// requireActual's own internal imports still go through.
jest.mock("react-native/Libraries/ReactNative/RendererProxy", () => ({
  findNodeHandle: jest.fn(),
}));

/**
 * Covers the low-level half of requirement 6 (predictable accessibility
 * focus): the focus helper calls the native API with a real handle when one
 * resolves, and never throws for the situations that make it a "best
 * effort" nicety rather than something anything else depends on — a null
 * ref, a ref with no current instance, or a handle that fails to resolve.
 */
describe("focusAccessibilityNode", () => {
  const AccessibilityInfo = require("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo").default;

  beforeEach(() => {
    AccessibilityInfo.setAccessibilityFocus.mockClear();
    (findNodeHandle as jest.Mock).mockReset();
  });

  it("focuses the resolved native handle", () => {
    (findNodeHandle as jest.Mock).mockReturnValue(42);
    const ref = { current: {} };

    focusAccessibilityNode(ref);

    expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(42);
  });

  it("does nothing when the ref has no current instance", () => {
    expect(() => focusAccessibilityNode({ current: null })).not.toThrow();
    expect(() => focusAccessibilityNode(null)).not.toThrow();
    expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
  });

  it("does nothing when no native handle can be resolved", () => {
    (findNodeHandle as jest.Mock).mockReturnValue(null);

    focusAccessibilityNode({ current: {} });

    expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
  });

  it("never throws even if the native call itself fails", () => {
    (findNodeHandle as jest.Mock).mockReturnValue(7);
    AccessibilityInfo.setAccessibilityFocus.mockImplementationOnce(() => {
      throw new Error("native failure");
    });

    expect(() => focusAccessibilityNode({ current: {} })).not.toThrow();
  });
});
