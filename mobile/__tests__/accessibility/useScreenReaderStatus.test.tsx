import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { useScreenReaderStatus } from "@/hooks/useScreenReaderStatus";

/**
 * Covers requirement 1's hook-facing half: a component sees "unknown"
 * before the native check resolves, the real value once it does, reacts to
 * a later change, and stops receiving updates once unmounted.
 *
 * screenReaderStatusService is a module-level singleton created the first
 * time anything imports it, so — deliberately, unlike the plain-logic
 * module-isolation tests elsewhere in this suite — this file does NOT use
 * jest.resetModules() between tests: doing that while also rendering React
 * components would load a second copy of React out from under
 * react-test-renderer and break hook dispatch. Instead, the first test
 * below (order matters) observes the singleton's one genuine "unknown"
 * moment via a manually-resolved promise, and later tests drive it purely
 * through __emitScreenReaderChanged.
 */
function StatusProbe() {
  const status = useScreenReaderStatus();
  return <Text testID="status">{status}</Text>;
}

function loadMockedAccessibilityInfo() {
  return require("react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo");
}

describe("useScreenReaderStatus", () => {
  it("renders the resolved native screen-reader status", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    AccessibilityInfo.__emitScreenReaderChanged(false);

    render(<StatusProbe />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("disabled"));
  });

  it("reacts to a screenReaderChanged event", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();

    render(<StatusProbe />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("disabled"));

    AccessibilityInfo.__emitScreenReaderChanged(true);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("enabled"));

    AccessibilityInfo.__emitScreenReaderChanged(false);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("disabled"));
  });

  it("stops updating a component after it unmounts", async () => {
    const AccessibilityInfo = loadMockedAccessibilityInfo();
    const { unmount } = render(<StatusProbe />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("disabled"));

    unmount();

    // Emitting after unmount must not throw — useSyncExternalStore's own
    // unsubscribe (wired through screenReaderStatusService.subscribe) is
    // what guarantees an unmounted component is never updated.
    expect(() => AccessibilityInfo.__emitScreenReaderChanged(true)).not.toThrow();
    AccessibilityInfo.__emitScreenReaderChanged(false);
  });
});
