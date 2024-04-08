import prettifyName from "../utils/prettifyName";
import { useState } from "react";
import classNames from "classnames";
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
        "px-2 border-right border  bg-white opacity-90 absolute bottom-2 left-2 pt-1 pb-2",
        collapsed ? "w-20" : "w-32",
      )}
      // z index big
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
      {!collapsed && (
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
      )}
    </div>
  );
};

export default Key;
