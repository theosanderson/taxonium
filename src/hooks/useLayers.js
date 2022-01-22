import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";

import { useMemo } from "react";

const useLayers = (data) => {
  const temp_scatter_layer = new ScatterplotLayer({
    id: "scatter-layer",
    data: data.data,
    getPosition: (d) => [d.x, d.y],
    getColor: [255, 0, 0],
    // radius in pixels
    getRadius: 5,
    pickable: true,
    radiusUnits: "pixels",
  });
  const layers = [temp_scatter_layer];

  const layerFilter = () => true;

  return { layers, layerFilter };
};

export default useLayers;
