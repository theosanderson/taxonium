import { useCallback, useMemo } from "react";
import scale from "scale-color-perceptual";

let rgb_cache = {};

const useColor = (colorMapping) => {
  const toRGB_uncached = useCallback(
    (string) => {
      if (typeof string === "number") {
        const log10 = Math.log10(string);

        const color = scale.plasma(log10 / 10);
        // convert from hex to rgb
        const rgb = [
          parseInt(color.slice(1, 3), 16),
          parseInt(color.slice(3, 5), 16),
          parseInt(color.slice(5, 7), 16),
        ];
        console.log(rgb);
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

      if (string === "USA") {
        return [95, 158, 245]; //This is just because the default is ugly
      }

      if (string === "B.1.2") {
        return [95, 158, 245]; //This is near B.1.617.2
      }
      if (string === "South_Africa") {
        return [9, 191, 255]; // otherwise collides with Kenya
      }
      if (string === "England") {
        return [214, 58, 15]; // UK all brick
      }

      if (string === "Scotland") {
        return [255, 130, 82]; // UK all brick
      }
      if (string === "North America") {
        return [200, 200, 50];
      }
      if (string === "South America") {
        return [200, 100, 50];
      }
      if (string === "Wales") {
        return [148, 49, 22]; // UK all brick
      }
      if (string === "Northern Ireland") {
        return [140, 42, 15]; // UK all brick
      }
      if (string === "France") {
        return [140, 28, 120]; // diff to UK
      }
      if (string === "Germany") {
        return [106, 140, 28]; // diff to UK
      }
      if (string === "India") {
        return [61, 173, 166]; // diff to UK
      }
      if (string === "Denmark") {
        return [24, 112, 32]; // diff to UK
      }
      if (string === "OXFORD_NANOPORE") {
        return [24, 32, 200];
      }

      if (string === "ION_TORRENT") {
        return [24, 160, 32];
      }

      if (string === "Democratic Republic of the Congo") {
        return [17, 58, 99]; // otherwise too similar to CAR
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
    [colorMapping],
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
    [toRGB_uncached],
  );

  const toRGBCSS = useCallback(
    (string) => {
      const output = toRGB(string);
      return `rgb(${output[0]},${output[1]},${output[2]})`;
    },
    [toRGB],
  );

  const output = useMemo(() => {
    return { toRGB, toRGBCSS };
  }, [toRGB, toRGBCSS]);
  return output;
};

export default useColor;
