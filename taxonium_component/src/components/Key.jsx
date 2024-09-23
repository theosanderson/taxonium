import React, { useState, useEffect } from "react";
import classNames from "classnames";
import prettifyName from "../utils/prettifyName";

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
}) => {
  const numLegendEntries = 10;
  const [collapsed, setCollapsed] = useState(window.innerWidth < 800);
  const [colorRamp, setColorRamp] = useState(null);

  useEffect(() => {
    if (config.colorRamps && config.colorRamps[colorByField]) {
      setColorRamp(config.colorRamps[colorByField]);
    } else {
      setColorRamp(null);
    }
  }, [colorByField, config.colorRamps]);

  if (colorByField === "None" || !keyStuff || keyStuff.length === 0) {
    return null;
  }

  const sortedKeyStuff = keyStuff
    .sort((a, b) => b.count - a.count)
    .filter((item) => item.value !== "");
  const isTruncated = sortedKeyStuff.length > numLegendEntries;
  const topKeyStuff = sortedKeyStuff.slice(0, numLegendEntries);

  const ColorRampScale = ({ colorRamp }) => {
    const { scale } = colorRamp;
    const minValue = scale[0][0];
    const maxValue = scale[scale.length - 1][0];
    const range = maxValue - minValue;

    const getPositionPercentage = (value) => {
      return ((value - minValue) / range) * 100;
    };

    const gradientStops = scale
      .map(([value, color]) => {
        const percentage = getPositionPercentage(value);
        return `${color} ${percentage}%`;
      })
      .join(", ");

    return (
      <div className="w-full h-32 relative mt-2">
        <div
          className="w-4 h-full absolute right-0"
          style={{
            background: `linear-gradient(to bottom, ${gradientStops})`,
          }}
        />
        <div className="absolute left-0 right-6 h-full">
          {scale.map(([value, color], index) => {
            const positionPercentage = getPositionPercentage(value);
            return (
              <div
                key={index}
                className="absolute right-6 text-xs text-gray-700 transform -translate-y-1/2"
                style={{ top: `${positionPercentage}%` }}
              >
                <span className="mr-1">{value}</span>
                <div
                  className="w-2 h-0.5 inline-block"
                  style={{ backgroundColor: color }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={classNames(
        "px-2 border-right border bg-white opacity-90 absolute bottom-2 left-2 pt-1 pb-2",
        collapsed ? "w-20" : colorRamp ? "w-40" : "w-32"
      )}
      style={{ zIndex: 10, cursor: "default" }}
    >
      <h3
        className="font-bold text-gray-600 text-xs cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed
          ? "Key"
          : colorByField === "genotype"
          ? `${colorByGene}:${colorByPosition}`
          : prettifyName(colorByField, config)}
        <span className="float-right text-xs cursor-pointer text-gray-600">
          {collapsed ? "▲" : "▼"}
        </span>
      </h3>
      {!collapsed && (
        <>
          {colorRamp ? (
            <ColorRampScale colorRamp={colorRamp} />
          ) : (
            topKeyStuff.map((item, index) => {
              const rgb = item.color;
              const color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
              return (
                <div
                  className="key-text text-xs text-gray-700 mt-0.5 break-all cursor-pointer"
                  key={index}
                  onClick={() => {
                    setCurrentColorSettingKey(item.value);
                    setColorSettingOpen(true);
                  }}
                  onMouseEnter={() => setHoveredKey(item.value)}
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
            })
          )}
          {isTruncated && <div className="text-xs text-gray-700">...</div>}
        </>
      )}
    </div>
  );
};

export default Key;
