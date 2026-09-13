import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

import { HomeScreen } from "@/screens/HomeScreen";
import { appStateStore } from "@/state/appStateStore";
import { clearLastAnswer, recordLastAnswer } from "@/state/lastAnswerStore";
import { DEFAULT_APP_STATE } from "@/types/onboarding";

describe("HomeScreen primary controls", () => {
  beforeEach(() => {
    mockPush.mockClear();
    appStateStore.setState({
      ...DEFAULT_APP_STATE,
      onboarding: { ...DEFAULT_APP_STATE.onboarding, completed: true },
      hydrated: true,
    });
    clearLastAnswer();
  });

  it("renders every required primary and secondary control", () => {
    render(<HomeScreen />);
    expect(screen.getByRole("button", { name: "Ask by voice" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Camera assistance" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Type a question" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Repeat last answer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Help" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
  });

  it("navigates to each feature route when its control is activated", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Ask by voice" }));
    expect(mockPush).toHaveBeenCalledWith("/voice");

    fireEvent.press(screen.getByRole("button", { name: "Camera assistance" }));
    expect(mockPush).toHaveBeenCalledWith("/camera");

    fireEvent.press(screen.getByRole("button", { name: "Type a question" }));
    expect(mockPush).toHaveBeenCalledWith("/ask");

    fireEvent.press(screen.getByRole("button", { name: "Help" }));
    expect(mockPush).toHaveBeenCalledWith("/help");

    fireEvent.press(screen.getByRole("button", { name: "Settings" }));
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("speaks a clear fallback when there is no previous answer to repeat", async () => {
    const Speech = require("expo-speech");
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Repeat last answer" }));

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        "There is no previous answer yet.",
        expect.anything(),
      ),
    );
  });

  it("repeats the actual last answer once one has been recorded", async () => {
    recordLastAnswer("The label says: Ibuprofen 200 milligrams.", "camera");
    const Speech = require("expo-speech");
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Repeat last answer" }));

    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith(
        "The label says: Ibuprofen 200 milligrams.",
        expect.anything(),
      ),
    );
    expect(screen.getByText("The label says: Ibuprofen 200 milligrams.")).toBeTruthy();
  });
});
