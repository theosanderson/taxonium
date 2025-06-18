import { useCallback, useMemo } from "react";
import scale from "scale-color-perceptual";
import { scaleLinear, ScaleLinear } from "d3-scale";
import type { Config } from "../types/backend";
import type { ColorHook } from "../types/color";

const rgb_cache: Record<string, [number, number, number]> = {};

const useColor = (
  config: Config,
  colorMapping: Record<string, [number, number, number]>,
  colorByField: string
): ColorHook => {
  const colorScales = useMemo(() => {
    const scales: { colorRamp?: ScaleLinear<string, string> } = {};
    if (config.colorRamps && config.colorRamps[colorByField]) {
      const { scale: rampScale } = config.colorRamps[colorByField];
      const domain: number[] = rampScale.map((d) => d[0]);
      const range: string[] = rampScale.map((d) => d[1]);
      scales.colorRamp = scaleLinear<string, string>()
        .domain(domain)
        .range(range);
    }
    return scales;
  }, [config.colorRamps, colorByField]);

  const toRGB_uncached = useCallback(
    (value: string | number): [number, number, number] => {
      if (config.colorRamps && config.colorRamps[colorByField]) {
        const numeric = parseFloat(String(value));
        const output = colorScales.colorRamp?.(numeric);
        if (!output) {
          return [120, 120, 120];
        }
        const as_list = output
          .slice(4, -1)
          .split(",")
          .map((d) => parseInt(d)) as [number, number, number];
        return as_list;
      }

      if (typeof value === "number") {
        const log10 = Math.log10(value);
        const scaled = log10 / 10;
        const clamped = Math.min(1, Math.max(0, scaled));
        const color = scale.plasma(clamped);
        // convert from hex to rgb
        const rgb: [number, number, number] = [
          parseInt(color.slice(1, 3), 16),
          parseInt(color.slice(3, 5), 16),
          parseInt(color.slice(5, 7), 16),
        ];
        return rgb;
      }

      if (typeof value === "string" && value in colorMapping) {
        return colorMapping[value];
      }

      const amino_acids: Record<string, [number, number, number]> = {
        A: [230, 25, 75],
        R: [60, 180, 75],
        N: [255, 225, 25],
        D: [67, 99, 216],
        C: [245, 130, 49],
        Q: [70, 240, 240],
        E: [145, 30, 180],
        G: [240, 50, 230],
        H: [188, 246, 12],
        I: [250, 190, 190],
        L: [230, 0, 255],
        K: [0, 128, 128],
        M: [154, 99, 36],
        F: [154, 60, 255],
        P: [128, 0, 0],
        T: [170, 255, 195],
        W: [128, 128, 0],
        Y: [0, 0, 117],
        V: [0, 100, 177],
        X: [128, 128, 128],
        O: [255, 255, 255],
        Z: [0, 0, 0],
      };

      if (typeof value === "string" && amino_acids[value]) {
        return amino_acids[value];
      }

      if (value === undefined) {
        return [200, 200, 200];
      }
      if (value === "") {
        return [200, 200, 200];
      }
      if (value === "unknown") {
        return [200, 200, 200];
      }
      if (value === "None") {
        return [220, 220, 220];
      }
      if (value === "N/A") {
        return [180, 180, 180];
      }
      if (value === "NA") {
        return [180, 180, 180];
      }

      // Special cases for specific strings
      const specialCases: Record<string, [number, number, number]> = {
        USA: [95, 158, 245],
        "B.1.2": [95, 158, 245],
        South_Africa: [9, 191, 255],
        England: [214, 58, 15],
        Scotland: [255, 130, 82],
        "North America": [200, 200, 50],
        "South America": [200, 100, 50],
        Wales: [148, 49, 22],
        "Northern Ireland": [140, 42, 15],
        France: [140, 28, 120],
        Germany: [106, 140, 28],
        India: [61, 173, 166],
        Denmark: [24, 112, 32],
        OXFORD_NANOPORE: [24, 32, 200],
        ION_TORRENT: [24, 160, 32],
        "Democratic Republic of the Congo": [17, 58, 99],
        Avian: [214, 58, 15],
      };

      if (typeof value === "string" && value in specialCases) {
        return specialCases[value];
      }

      let str = String(value);
      str = str.split("").reverse().join("");
      let hash = 0;
      if (str.length === 0) return [0, 0, 0];
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }
      let rgb: [number, number, number] = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 255;
        rgb[i] = value;
      }
      if (rgb[0] + rgb[1] + rgb[2] < 150 || rgb[0] + rgb[1] + rgb[2] > 500) {
        return toRGB_uncached(str + "_");
      }
      return rgb;
    },
    [colorMapping, config, colorByField, colorScales]
  );

  const toRGB = useCallback(
    (val: string | number): [number, number, number] => {
      if (typeof val === "string" && rgb_cache[val] && !colorMapping[val]) {
        return rgb_cache[val];
      } else {
        const result = toRGB_uncached(val);
        if (typeof val === "string") {
          rgb_cache[val] = result;
        }
        return result;
      }
    },
    [toRGB_uncached, colorMapping]
  );

  const toRGBCSS = useCallback(
    (val: string | number): string => {
      const output = toRGB(val);
      return `rgb(${output[0]},${output[1]},${output[2]})`;
    },
    [toRGB]
  );

  const output = useMemo(() => {
    return { toRGB, toRGBCSS };
  }, [toRGB, toRGBCSS]);
  return output;
};

export default useColor;
