import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockRequestPermission = jest.fn();
let mockPermissionResponse: { granted: boolean; canAskAgain: boolean } | null = {
  granted: true,
  canAskAgain: true,
};
const mockTakePictureAsync = jest.fn().mockResolvedValue({ uri: "file://photo.jpg" });

jest.mock("expo-camera", () => {
  const ReactActual = require("react");
  return {
    CameraView: ReactActual.forwardRef((_props: unknown, ref: unknown) => {
      ReactActual.useImperativeHandle(ref, () => ({
        takePictureAsync: mockTakePictureAsync,
      }));
      return null;
    }),
    useCameraPermissions: () => [mockPermissionResponse, mockRequestPermission],
  };
});

import { CameraScreen } from "@/screens/CameraScreen";
import {
  CAMERA_ANALYZING_MESSAGE,
  CAMERA_CAPTURING_MESSAGE,
  CAMERA_PERMISSION_CONTEXT,
} from "@/constants/statusMessages";

/**
 * Covers requirement 5 (camera permission context spoken before the OS
 * dialog), requirement 8 (mode/ready/capture/analyzing/result announcements
 * and excluding the live preview from the accessibility tree), and
 * requirement 13's explicit "camera preview excluded from accessibility"
 * test item.
 */
describe("CameraScreen", () => {
  beforeEach(() => {
    mockPermissionResponse = { granted: true, canAskAgain: true };
    mockRequestPermission.mockClear();
    mockTakePictureAsync.mockClear();
  });

  it("speaks the permission context before requesting, when access has not been granted", async () => {
    mockPermissionResponse = { granted: false, canAskAgain: true };
    const Speech = require("expo-speech");

    render(<CameraScreen />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Allow camera access" })).toBeTruthy(),
    );
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(CAMERA_PERMISSION_CONTEXT, expect.anything()),
    );
  });

  it("shows a working retry from the permission-denied state", async () => {
    mockPermissionResponse = { granted: false, canAskAgain: false };

    render(<CameraScreen />);

    await waitFor(() => expect(screen.getByTestId("camera-permission-denied")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it("excludes the live camera preview from the accessibility tree", async () => {
    render(<CameraScreen />);
    await waitFor(() => expect(screen.getByTestId("camera-capture")).toBeTruthy());

    // Walk the rendered tree for a node hiding its descendants from
    // accessibility, rather than relying on exact tree shape.
    const tree = screen.toJSON();
    const findHiddenPreview = (node: unknown): boolean => {
      if (!node || typeof node !== "object") return false;
      const n = node as { props?: Record<string, unknown>; children?: unknown[] };
      if (
        n.props?.accessibilityElementsHidden === true &&
        n.props?.importantForAccessibility === "no-hide-descendants"
      ) {
        return true;
      }
      return (n.children ?? []).some(findHiddenPreview);
    };
    expect(findHiddenPreview(tree)).toBe(true);
  });

  it("announces mode, capture, and analyzing status, then speaks the result and disclaimer", async () => {
    const Speech = require("expo-speech");
    render(<CameraScreen />);
    await waitFor(() => expect(screen.getByTestId("camera-capture")).toBeTruthy());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByTestId("camera-capture"));

    // speak() cancels in-flight speech first, so each mocked Speech.speak
    // call lands a couple of microtask ticks after the triggering action.
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(CAMERA_CAPTURING_MESSAGE, expect.anything()),
    );
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(CAMERA_ANALYZING_MESSAGE, expect.anything()),
    );
    await waitFor(() => expect(screen.getByTestId("camera-result-panel")).toBeTruthy());
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        expect.stringContaining("mock description"),
        expect.anything(),
      ),
    );
  });

  it("announces a mode change", async () => {
    const Speech = require("expo-speech");
    render(<CameraScreen />);
    await waitFor(() => expect(screen.getByTestId("camera-capture")).toBeTruthy());
    Speech.speak.mockClear();

    fireEvent.press(screen.getByRole("radio", { name: "Describe scene" }));

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith("Describe scene selected.", expect.anything()),
    );
  });
});
