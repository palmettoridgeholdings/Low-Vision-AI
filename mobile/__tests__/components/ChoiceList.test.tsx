import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ChoiceList, type ChoiceOption } from "@/components/ChoiceList";

const OPTIONS: ChoiceOption<"a" | "b">[] = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

describe("ChoiceList", () => {
  it("exposes a radiogroup with each option as a labeled, selectable radio", () => {
    render(
      <ChoiceList groupLabel="Pick one" options={OPTIONS} selectedValue={null} onSelect={jest.fn()} testID="choice-group" />,
    );
    expect(screen.getByTestId("choice-group").props.accessibilityRole).toBe("radiogroup");
    expect(screen.getByTestId("choice-group").props.accessibilityLabel).toBe("Pick one");
    const optionA = screen.getByRole("radio", { name: "Option A" });
    expect(optionA.props.accessibilityState?.selected).toBe(false);
  });

  it("calls onSelect with the chosen value", () => {
    const onSelect = jest.fn();
    render(
      <ChoiceList groupLabel="Pick one" options={OPTIONS} selectedValue={null} onSelect={onSelect} />,
    );

    fireEvent.press(screen.getByRole("radio", { name: "Option B" }));

    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("does not speak a selection confirmation by default", () => {
    const Speech = require("expo-speech");
    render(
      <ChoiceList groupLabel="Pick one" options={OPTIONS} selectedValue={null} onSelect={jest.fn()} />,
    );

    fireEvent.press(screen.getByRole("radio", { name: "Option A" }));

    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it("speaks a selection confirmation when announceSelection is set", async () => {
    const Speech = require("expo-speech");
    render(
      <ChoiceList
        groupLabel="Pick one"
        options={OPTIONS}
        selectedValue={null}
        onSelect={jest.fn()}
        announceSelection
      />,
    );

    fireEvent.press(screen.getByRole("radio", { name: "Option A" }));

    // speak() cancels any in-flight speech before it actually plays, so the
    // mocked Speech.speak call lands a couple of microtask ticks after
    // press — wait for it rather than asserting immediately.
    await waitFor(() =>
      expect(Speech.speak).toHaveBeenCalledWith("Option A selected.", expect.anything()),
    );
  });
});
