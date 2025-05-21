import prettifyName from "../utils/prettifyName";
import { useState } from "react";
import classNames from "classnames";
import type { ColorRamp, ColorRamps } from "../types/common";

export interface KeyItem {
  value: string;
  count: number;
  color: [number, number, number];
}

interface KeyProps {
  keyStuff: KeyItem[];
  colorByField: string;
  colorByGene?: string;
  colorByPosition?: number | string;
  config: Record<string, unknown>;
  setCurrentColorSettingKey: (key: string) => void;
  setColorSettingOpen: (open: boolean) => void;
  hoveredKey: string | null;
  setHoveredKey: (key: string | null) => void;
  colorRamps?: ColorRamps;
}

interface KeyContentProps {
  filteredKeyStuff: KeyItem[];
  setCurrentColorSettingKey: (key: string) => void;
  setColorSettingOpen: (open: boolean) => void;
  setHoveredKey: (key: string | null) => void;
  hoveredKey: string | null;
  isTruncated: boolean;
}

const ColorRamp = ({ ramp }: { ramp: ColorRamp }) => {
  const scale = ramp.scale;

  // Extract values and colors from the scale
  const values = scale.map(([value, color]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Build the gradient string
  const colorStops = scale
    .map(([value, color]) => {
      const position = ((value - min) / (max - min)) * 100;
      return `${color} ${position}%`;
    })
    .join(", ");

  const height = 100;

  const gradientStyle = {
    background: `linear-gradient(to top, ${colorStops})`,
    width: "20px",
    height: `${height + 2}px`,
    border: "1px solid #ccc",
    marginTop: "-15px",
  };

  // Create evenly spaced labels
  const numLabels = 5; // Adjust the number of labels as needed
  const labels = [];
  for (let i = 0; i < numLabels; i++) {
    const value = min + (i / (numLabels - 1)) * (max - min);
    const position = ((value - min) / (max - min)) * 100;
    labels.push({ value, position });
  }

  return (
    <div className=" mt-5">
      <div className="ml-7 " style={{ display: "flex", alignItems: "center" }}>
        {/* Labels and Ticks Container */}
        <div
          style={{
            position: "relative",
            height: `${height}px`,
            marginRight: "5px",
            width: "auto",
          }}
        >
          {labels.map((label, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                bottom: `${label.position}%`,
                left: "-25px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* Label Text */}
              <div
                style={{
                  fontSize: "10px",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  marginRight: "3px",
                }}
              >
                {label.value.toFixed(2)}
              </div>
              {/* Tick */}
              <div
                style={{
                  width: "6px",
                  height: "1px",
                  backgroundColor: "#333",
                }}
              ></div>
            </div>
          ))}
        </div>
        {/* Gradient */}
        <div style={gradientStyle}></div>
      </div>
    </div>
  );
};

const Key = ({
  keyStuff,
  colorByField,
  colorByGene,
  colorByPosition,
  config,
  setCurrentColorSettingKey,
  setColorSettingOpen,
  hoveredKey,
  setHoveredKey,
  colorRamps,
}: KeyProps) => {
  const numLegendEntries = 10;
  const [collapsed, setCollapsed] = useState(window.innerWidth < 800);

  // sort by item.count in descending order
  const sortedKeyStuff = keyStuff.sort((a, b) => b.count - a.count);

  // truncate to 10 items
  const isTruncated = sortedKeyStuff.length > numLegendEntries;
  const topTenKeyStuff = sortedKeyStuff.slice(0, numLegendEntries);

  // if there is an item with value of "", remove it
  const filteredKeyStuff = topTenKeyStuff.filter((item) => item.value !== "");

  if (colorByField === "None") {
    return null;
  }

  if (!filteredKeyStuff || filteredKeyStuff.length == 0) {
    return null;
  }

  return (
    <div
      className={classNames(
        "px-2 border-right border bg-white border-gray-200 opacity-90 absolute bottom-2 left-2 pt-1 pb-2",
        collapsed ? "w-20" : "w-32"
      )}
      style={{
        zIndex: 10,
        cursor: "default",
      }}
    >
      <h3
        className="font-bold text-gray-600 text-xs cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed
          ? "Key"
          : colorByField === "genotype"
          ? colorByGene + ":" + colorByPosition
          : prettifyName(colorByField, config)}
        {/* Arrow to collapse up/down */}
        <span className="float-right text-xs cursor-pointer text-gray-600">
          {collapsed ? "▲" : "▼"}
        </span>
      </h3>

      {!collapsed &&
        (colorRamps && colorByField in colorRamps ? (
          <ColorRamp ramp={colorRamps[colorByField]} />
        ) : (
          <KeyContent
            filteredKeyStuff={filteredKeyStuff}
            setCurrentColorSettingKey={setCurrentColorSettingKey}
            setColorSettingOpen={setColorSettingOpen}
            setHoveredKey={setHoveredKey}
            hoveredKey={hoveredKey}
            isTruncated={isTruncated}
          />
        ))}
    </div>
  );
};

const KeyContent = ({
  filteredKeyStuff,
  setCurrentColorSettingKey,
  setColorSettingOpen,
  setHoveredKey,
  hoveredKey,
  isTruncated,
}: KeyContentProps) => {
  return (
    <>
      {filteredKeyStuff.map((item, index) => {
        // item.color is [r, g, b]
        const rgb = item.color;
        const color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        return (
          <div
            className="key-text text-xs text-gray-700 mt-0.5 break-all cursor-pointer"
            key={index}
            style={{
              pointerEvents: "auto",
            }}
            onClick={() => {
              setCurrentColorSettingKey(item.value);
              setColorSettingOpen(true);
            }}
            onMouseEnter={() => {
              setHoveredKey(item.value);
            }}
            onMouseLeave={() => setHoveredKey(null)}
            title="Edit color"
          >
            <div
              style={{ backgroundColor: color }}
              className={`circle w-2 h-2 mr-2 rounded-full inline-block transform transition-transform ${
                hoveredKey === item.value ? "scale-150" : "scale-100"
              }`}
            />
            {item.value}
          </div>
        );
      })}

      {isTruncated && <div className="text-xs text-gray-700">...</div>}
    </>
  );
};

export default Key;
