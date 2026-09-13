import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibleToggle } from "@/components/AccessibleToggle";

describe("AccessibleToggle", () => {
  it("exposes switch role, label, and current checked state", () => {
    render(
      <AccessibleToggle
        label="Automatically speak answers"
        value={false}
        onValueChange={jest.fn()}
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Automatically speak answers" });
    expect(toggle.props.accessibilityState?.checked).toBe(false);
  });

  it("calls onValueChange with the flipped value when pressed", () => {
    const onValueChange = jest.fn();
    render(<AccessibleToggle label="Startup speech" value={false} onValueChange={onValueChange} />);

    fireEvent.press(screen.getByRole("switch", { name: "Startup speech" }));

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("reflects a true value in its accessibility state", () => {
    render(<AccessibleToggle label="Startup speech" value={true} onValueChange={jest.fn()} />);
    const toggle = screen.getByRole("switch", { name: "Startup speech" });
    expect(toggle.props.accessibilityState?.checked).toBe(true);
  });
});
