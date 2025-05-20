import { useState } from "react";
import ColorPicker from "./ColorPicker";

export default {
  title: "Taxonium/ColorPicker",
  component: ColorPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// Wrapper component to manage state for the ColorPicker
interface ColorPickerWithStateProps {
  initialColor: number[];
}

const ColorPickerWithState = ({ initialColor }: ColorPickerWithStateProps) => {
  const [color, setColor] = useState(initialColor);
  return <ColorPicker color={color} setColor={setColor} />;
};

export const Red = {
  render: () => <ColorPickerWithState initialColor={[255, 0, 0]} />,
};

export const Green = {
  render: () => <ColorPickerWithState initialColor={[0, 255, 0]} />,
};

export const Blue = {
  render: () => <ColorPickerWithState initialColor={[0, 0, 255]} />,
};

export const Black = {
  render: () => <ColorPickerWithState initialColor={[0, 0, 0]} />,
};

export const White = {
  render: () => <ColorPickerWithState initialColor={[255, 255, 255]} />,
  parameters: {
    backgrounds: { default: "dark" },
  },
};
