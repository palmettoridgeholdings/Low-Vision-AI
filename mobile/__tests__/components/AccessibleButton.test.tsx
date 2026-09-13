import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibleButton } from "@/components/AccessibleButton";

describe("AccessibleButton", () => {
  it("exposes the label as its accessible name and role", () => {
    render(<AccessibleButton label="Ask by voice" onPress={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Ask by voice" })).toBeTruthy();
  });

  it("calls onPress when activated", () => {
    const onPress = jest.fn();
    render(<AccessibleButton label="Get answer" onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: "Get answer" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("reports a disabled accessibility state and does not fire onPress", () => {
    const onPress = jest.fn();
    render(<AccessibleButton label="Get answer" onPress={onPress} disabled />);

    const button = screen.getByRole("button", { name: "Get answer" });
    expect(button.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("includes an accessibility hint when provided", () => {
    render(
      <AccessibleButton label="Camera assistance" hint="Read text aloud" onPress={jest.fn()} />,
    );
    const button = screen.getByRole("button", { name: "Camera assistance" });
    expect(button.props.accessibilityHint).toBe("Read text aloud");
  });
});
