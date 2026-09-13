/**
 * Covers requirement 1 (screen-reader detection) of the blind-first
 * accessibility pass: an initial "unknown" state rather than assuming
 * either enabled or disabled, resolving to the real detected value,
 * reacting to a native "screenReaderChanged" event, and cleaning up its
 * native listener correctly.
 *
 * The service is a module-level singleton created at import time (like
 * spokenGuidanceController), so — mirroring the module-isolation pattern
 * already used in __tests__/services/serviceRegistry.test.ts —
 * jest.resetModules() plus a fresh inline require() per test gives each
 * scenario its own instance instead of sharing one across the whole file.
 */
describe("screenReaderStatusService", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function loadService() {
    return require("@/services/accessibility/screenReaderStatusService")
      .screenReaderStatusService;
  }

  function loadMockedAccessibilityInfo() {
    return require("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo").default;
  }

  it("starts unknown rather than assuming enabled or disabled", () => {
    const service = loadService();
    expect(service.getSnapshot().status).toBe("unknown");
  });

  it("resolves to disabled when the native check reports no screen reader", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
    const service = loadService();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.getSnapshot().status).toBe("disabled");
  });

  it("resolves to enabled when the native check reports a screen reader is active", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
    const service = loadService();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.getSnapshot().status).toBe("enabled");
  });

  it("reacts to a screenReaderChanged event after the initial check", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
    const service = loadService();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.getSnapshot().status).toBe("disabled");

    AccessibilityInfo.__emitScreenReaderChanged(true);
    expect(service.getSnapshot().status).toBe("enabled");

    AccessibilityInfo.__emitScreenReaderChanged(false);
    expect(service.getSnapshot().status).toBe("disabled");
  });

  it("never reports disabled just because a check failed", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    AccessibilityInfo.isScreenReaderEnabled.mockRejectedValue(new Error("native error"));
    const service = loadService();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.getSnapshot().status).toBe("unknown");
  });

  it("registers exactly one native listener and removes it on teardown", () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    const service = loadService();

    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      "screenReaderChanged",
      expect.anything(),
    );
    const removeMock = AccessibilityInfo.addEventListener.mock.results[0].value.remove;

    service.teardown();

    expect(removeMock).toHaveBeenCalled();
  });

  it("notifies subscribers exactly when the status actually changes", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
    const service = loadService();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const listener = jest.fn();
    const unsubscribe = service.subscribe(listener);

    AccessibilityInfo.__emitScreenReaderChanged(true);
    expect(listener).toHaveBeenCalledTimes(1);

    // Re-emitting the same value must not produce a redundant notification.
    AccessibilityInfo.__emitScreenReaderChanged(true);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    AccessibilityInfo.__emitScreenReaderChanged(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
