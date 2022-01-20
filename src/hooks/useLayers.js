import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";

import { useMemo } from "react";

const useLayers = (processedData) => {
  console.log(processedData);
  const temp_scatter_layer = new ScatterplotLayer({
    id: "scatter-layer",
  });
  const layers = [temp_scatter_layer];

  return { layers };
};

export default useLayers;
