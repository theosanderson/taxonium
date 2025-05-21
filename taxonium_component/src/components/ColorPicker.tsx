import React, { useState } from "react";
import { SketchPicker } from "react-color";

interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface ColorPickerProps {
  color: number[];
  setColor: (color: number[]) => void;
}
const rgbToList = (rgb: RGBColor): number[] => {
  return [rgb.r, rgb.g, rgb.b];
};
const listToRgb = (list: number[]): RGBColor => {
  const color = { r: list[0], g: list[1], b: list[2] };
  return color;
};

function ColorPicker({ color, setColor }: ColorPickerProps) {
  const rgbColor = listToRgb(color);
  const [showPicker, setShowPicker] = useState(false);

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  const handleClose = () => {
    setShowPicker(false);
  };

  const handleColorChange = (newColor: { rgb: RGBColor }) => {
    setColor(rgbToList(newColor.rgb));
  };

  if (!showPicker) {
    return (
      <div className="inline-block">
        <div
          style={{
            padding: "5px",
            background: "#fff",
            borderRadius: "1px",
            boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
            display: "inline-block",
            cursor: "pointer",
          }}
          onClick={togglePicker}
        >
          <div
            style={{
              width: "36px",
              height: "14px",
              borderRadius: "2px",
              background: `rgba(${rgbColor.r},${rgbColor.g},${rgbColor.b},${
                rgbColor.a || 1
              })`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        zIndex: "2",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
        }}
        onClick={handleClose}
      />

      <SketchPicker
        color={rgbColor}
        onChange={handleColorChange}
        presetColors={[]}
        disableAlpha={true}
      />
    </div>
  );
}

export default ColorPicker;
