import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";

import { useMemo, useCallback } from "react";

let getMMatrix = (zoom) => [
  1 / 2 ** zoom,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
]; // new Matrix4().scale([Math.max(1, zoom), 1, 1]);

const useLayers = (data, viewState, colorHook, setHoverInfo) => {
  if (!data.data && data.base_data) {
    data.data = data.base_data;
  }
  const { toRGB } = colorHook;
  const accessor = "meta_Lineage";
  const layers = [];

  const combo = useMemo(() => {
    if (
      data.data.leaves &&
      data.base_data.leaves &&
      (data.status === "loading" || data.status === "pending")
    ) {
      return [...data.data.leaves, ...data.base_data.leaves];
    } else if (data.data.leaves && data.status === "loaded") {
      return data.data.leaves;
    } else {
      return [];
    }
  }, [data.data, data.base_data, data.status]);
  const outer_bounds = [
    [-1000, -1000],
    [1000, -1000],
    [10000, 10000],
    [-1000, 10000],
    [-1000, -1000],
  ];
  const inner_bounds = [
    [viewState.min_x, viewState.min_y],
    [viewState.max_x, viewState.min_y],
    [viewState.max_x, viewState.max_y],
    [viewState.min_x, viewState.max_y],
  ];

  const bound_contour = [[outer_bounds, inner_bounds]];

  if (data.data.leaves) {
    const temp_scatter_layer = new ScatterplotLayer({
      id: "main-scatter",
      data: combo,
      getPosition: (d) => [d.x, d.y],
      getColor: (d) => toRGB(d[accessor]),
      // radius in pixels
      getRadius: 3,
      getLineColor: [100, 100, 100],
      opacity: 0.6,
      stroked: data.data.leaves && data.data.leaves.length < 3000,
      lineWidthUnits: "pixels",
      lineWidthScale: 1,
      pickable: true,
      radiusUnits: "pixels",
      onHover: (info) => setHoverInfo(info),
      modelMatrix: getMMatrix(viewState.zoom),
    });

    const bound_layer = new ScatterplotLayer({
      id: "main-bounds",
      data: outer_bounds,
      getPosition: (d) => [d[0], d[1]],
      getColor: (d) => [0, 0, 0, 255],
      // radius in pixels
      getRadius: 4,
      pickable: true,
      radiusUnits: "pixels",
      modelMatrix: getMMatrix(viewState.zoom),
    });

    const lineColor = [150, 150, 150];
    const temp_line_layer = new LineLayer({
      id: "main-line-horiz",
      data: data.data.lines,
      getSourcePosition: (d) => [d.x, d.y],
      getTargetPosition: (d) => [d.parent_x, d.y],
      getColor: lineColor,
      pickable: true,

      modelMatrix: getMMatrix(viewState.zoom),
    });

    const temp_line_layer2 = new LineLayer({
      id: "main-line-vert",
      data: data.data.lines,
      getSourcePosition: (d) => [d.parent_x, d.y],
      getTargetPosition: (d) => [d.parent_x, d.parent_y],
      getColor: lineColor,
      pickable: true,
      modelMatrix: getMMatrix(viewState.zoom),
    });
    layers.push(
      bound_layer,
      temp_line_layer,
      temp_line_layer2,
      temp_scatter_layer
    );
  }

  const max_text_number = 400;
  // If leaves are fewer than max_text_number, add a text layer
  if (data.data.leaves && data.data.leaves.length < max_text_number) {
    console.log("Adding text layer");
    const node_label_layer = new TextLayer({
      id: "main-text-node",

      data: data.data.leaves,
      getPosition: (d) => [d.x + 10, d.y],
      getText: (d) => d.name,

      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.leaves.length < 200 ? 12 : 9.5,
      modelMatrix: getMMatrix(viewState.zoom),
    });

    layers.push(node_label_layer);
  }

  const minimap_scatter = new ScatterplotLayer({
    id: "minimap-scatter",
    data: data.base_data ? data.base_data.leaves : [],
    getPosition: (d) => [d.x, d.y],
    getColor: (d) => toRGB(d[accessor]),
    // radius in pixels
    getRadius: 2,
    getLineColor: [100, 100, 100],
    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
  });

  const minimap_polygon_background = new PolygonLayer({
    id: "minimap-bound-polygon",
    data: [outer_bounds],
    getPolygon: (d) => d,
    pickable: true,
    stroked: true,
    opacity: 0.1,
    filled: true,
    wireframe: true,
    getFillColor: (d) => [240, 240, 240],
    getLineColor: [80, 80, 80],
    getLineWidth: 1,
    getElevation: 20,
    lineWidthUnits: "pixels",
  });

  const minimap_bound_polygon = new PolygonLayer({
    id: "minimap-bound-polygon",
    data: bound_contour,
    getPolygon: (d) => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    wireframe: true,
    getFillColor: (d) => [240, 240, 240],
    getLineColor: [80, 80, 80],
    getLineWidth: 1,
    lineWidthUnits: "pixels",
  });

  layers.push(
    minimap_polygon_background,
    minimap_scatter,
    minimap_bound_polygon
  );

  const layerFilter = useCallback(({ layer, viewport }) => {
    const first_bit =
      (layer.id.startsWith("main") && viewport.id === "main") ||
      (layer.id.startsWith("mini") && viewport.id === "minimap");

    return first_bit;
  }, []);

  return { layers, layerFilter };
};

export default useLayers;
