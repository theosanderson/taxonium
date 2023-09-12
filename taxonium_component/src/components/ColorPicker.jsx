import React, { useState } from "react";
import { SketchPicker } from "react-color";

const rgbToList = (rgb) => {
  return [rgb.r, rgb.g, rgb.b];
};
const listToRgb = (list) => {
  const color = { r: list[0], g: list[1], b: list[2] };
  console.log("COLOR", color);
  return color;
};

function ColorPicker({ color, setColor }) {
  const rgbColor = listToRgb(color);

  const [showPicker, setShowPicker] = useState(false);

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  const handleColorChange = (newColor) => {
    setColor(rgbToList(newColor.rgb));
    setShowPicker(false);
  };
  if (showPicker)
    return (
      <div className="block mt-2">
        <SketchPicker color={rgbColor} onChange={handleColorChange} />
      </div>
    );
  return (
    <div className="inline-block mt-2 ml-2">
      <div
        className="w-4 h-4 cursor-pointer"
        style={{
          backgroundColor: `rgba(${rgbColor.r},${rgbColor.g},${rgbColor.b},${
            rgbColor.a || 1
          })`,
        }}
        onClick={togglePicker}
      ></div>
    </div>
  );
}

export default ColorPicker;
