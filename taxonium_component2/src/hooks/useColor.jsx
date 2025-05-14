import { useCallback, useMemo } from "react";
import scale from "scale-color-perceptual";
import { scaleLinear } from "d3-scale";

let rgb_cache = {};

const useColor = (config, colorMapping, colorByField) => {
  const colorScales = useMemo(() => {
    const scales = {};
    if (config.colorRamps && config.colorRamps[colorByField]) {
      const { scale: rampScale } = config.colorRamps[colorByField];
      const domain = rampScale.map((d) => d[0]);
      const range = rampScale.map((d) => d[1]);
      scales.colorRamp = scaleLinear().domain(domain).range(range);
    }
    return scales;
  }, [config.colorRamps, colorByField]);

  const toRGB_uncached = useCallback(
    (string) => {
      if (config.colorRamps && config.colorRamps[colorByField]) {
        const value = parseFloat(string);
        const output = colorScales.colorRamp(value);
        if (!output) {
          return [120, 120, 120];
        }
        const as_list = output
          .slice(4, -1)
          .split(",")
          .map((d) => parseInt(d));
        return as_list;
      }

      if (typeof string === "number") {
        const log10 = Math.log10(string);
        const color = scale.plasma(log10 / 10);
        // convert from hex to rgb
        const rgb = [
          parseInt(color.slice(1, 3), 16),
          parseInt(color.slice(3, 5), 16),
          parseInt(color.slice(5, 7), 16),
        ];
        return rgb;
      }

      if (string in colorMapping) {
        return colorMapping[string];
      }

      const amino_acids = {
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
        F: [154, 60, 256],
        P: [128, 0, 0],
        T: [170, 255, 195],
        W: [128, 128, 0],
        Y: [0, 0, 117],
        V: [0, 100, 177],
        X: [128, 128, 128],
        O: [255, 255, 255],
        Z: [0, 0, 0],
      };

      if (amino_acids[string]) {
        return amino_acids[string];
      }

      if (string === undefined) {
        return [200, 200, 200];
      }
      if (string === "") {
        return [200, 200, 200];
      }
      if (string === "unknown") {
        return [200, 200, 200];
      }
      if (string === "None") {
        return [220, 220, 220];
      }
      if (string === "N/A") {
        return [180, 180, 180];
      }
      if (string === "NA") {
        return [180, 180, 180];
      }

      // Special cases for specific strings
      const specialCases = {
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

      if (string in specialCases) {
        return specialCases[string];
      }

      string = string.split("").reverse().join("");
      var hash = 0;
      if (string.length === 0) return hash;
      for (var i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }
      var rgb = [0, 0, 0];
      for (i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 255;
        rgb[i] = value;
      }
      if (rgb[0] + rgb[1] + rgb[2] < 150 || rgb[0] + rgb[1] + rgb[2] > 500) {
        return toRGB_uncached(string + "_");
      }
      return rgb;
    },
    [colorMapping, config, colorByField, colorScales]
  );

  const toRGB = useCallback(
    (string) => {
      if (rgb_cache[string] && !colorMapping[string]) {
        return rgb_cache[string];
      } else {
        const result = toRGB_uncached(string);
        rgb_cache[string] = result;
        return result;
      }
    },
    [toRGB_uncached, colorMapping]
  );

  const toRGBCSS = useCallback(
    (string) => {
      const output = toRGB(string);
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
