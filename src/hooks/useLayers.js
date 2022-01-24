import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";

import { useMemo } from "react";
let getMMatrix = (zoom) => [ 1/2 ** zoom, 0, 0, 0, 0,1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];// new Matrix4().scale([Math.max(1, zoom), 1, 1]);

const useLayers = (data, viewState) => {
  const temp_scatter_layer = new ScatterplotLayer({
    id: "scatter-layer",
    data: data.data.leaves,
    getPosition: (d) => [d.x, d.y],
    getColor: [255, 0, 0],
    // radius in pixels
    getRadius: 2,
    pickable: true,
    radiusUnits: "pixels",
    modelMatrix: getMMatrix(viewState.zoom),

  });

  const temp_line_layer = new LineLayer({
    id: "line-layer",
    data: data.data.lines,
    getSourcePosition: (d) => [d.x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: [200, 200, 200],
    pickable: true,
    modelMatrix: getMMatrix(viewState.zoom),
  });

  const temp_line_layer2 = new LineLayer({
    id: "line-layer",
    data: data.data.lines,
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    getColor: [200, 200, 200],
    pickable: true,
    modelMatrix: getMMatrix(viewState.zoom),
  });

  const layers = [ temp_line_layer,temp_line_layer2,temp_scatter_layer];

  const layerFilter = () => true;

  return { layers, layerFilter };
};

export default useLayers;
