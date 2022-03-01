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

const useLayers = (
  data,
  search,
  viewState,
  colorHook,
  setHoverInfo,
  colorBy
) => {
  const lineColor = [150, 150, 150];
  const getNodeColorField = colorBy.getNodeColorField;

  const { toRGB } = colorHook;

  const layers = [];

  const combo = useMemo(() => {
    if (
      data.data &&
      data.base_data &&
      data.data.nodes &&
      data.base_data.nodes &&
      (data.status === "loading" || data.status === "pending")
    ) {
      return [...data.data.nodes, ...data.base_data.nodes];
      console.log("A");
    } else if (data.data.nodes && data.status === "loaded") {
      return data.data.nodes;
      console.log("B");
    } else {
      console.log("C", data.data, data.base_data);
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

  if (data.data.nodes) {
    const temp_scatter_layer = new ScatterplotLayer({
      id: "main-scatter",
      data: data.data.nodes.filter((d) => d.name !== ""),
      getPosition: (d) => [d.x, d.y],
      getColor: (d) => toRGB(getNodeColorField(d, data.data)),
      // radius in pixels
      getRadius: 3,
      getLineColor: [100, 100, 100],
      opacity: 0.6,
      stroked: data.data.nodes && data.data.nodes.length < 3000,
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

    const temp_line_layer = new LineLayer({
      id: "main-line-horiz",
      data: data.data.nodes,
      getSourcePosition: (d) => [d.x, d.y],
      getTargetPosition: (d) => [d.parent_x, d.y],
      getColor: lineColor,
      pickable: true,
      onHover: (info) => setHoverInfo(info),

      modelMatrix: getMMatrix(viewState.zoom),
    });

    const temp_line_layer2 = new LineLayer({
      id: "main-line-vert",
      data: data.data.nodes,
      getSourcePosition: (d) => [d.parent_x, d.y],
      getTargetPosition: (d) => [d.parent_x, d.parent_y],
      onHover: (info) => setHoverInfo(info),
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
  if (data.data.nodes && data.data.nodes.length < max_text_number) {
    console.log("Adding text layer");
    const node_label_layer = new TextLayer({
      id: "main-text-node",

      data: data.data.nodes,
      getPosition: (d) => [d.x + 10, d.y],
      getText: (d) => d.name,

      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.nodes.length < 200 ? 12 : 9.5,
      modelMatrix: getMMatrix(viewState.zoom),
    });

    layers.push(node_label_layer);
  }

  const minimap_scatter = new ScatterplotLayer({
    id: "minimap-scatter",
    data: data.base_data
      ? data.base_data.nodes.filter((node) => node.name !== "")
      : [],
    getPosition: (d) => [d.x, d.y],
    getColor: (d) => toRGB(getNodeColorField(d, data.base_data)),
    // radius in pixels
    getRadius: 2,
    getLineColor: [100, 100, 100],
    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
  });

  const minimap_line_horiz = new LineLayer({
    id: "minimap-line-horiz",
    data: data.base_data ? data.base_data.nodes : [],
    getSourcePosition: (d) => [d.x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: lineColor,
  });

  const minimap_line_vert = new LineLayer({
    id: "minimap-line-vert",
    data: data.base_data ? data.base_data.nodes : [],
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    getColor: lineColor,
  });

  layers.push(minimap_line_horiz, minimap_line_vert, minimap_scatter);

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

    minimap_bound_polygon
  );

  const { searchSpec, searchResults } = search;

  const search_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].result.data
      : [];
    const lineColor = search.getLineColor(i);

    return new ScatterplotLayer({
      data: data,
      id: "main-search-scatter-" + spec.key,
      getPosition: (d) => [d.x, d.y],
      getLineColor: lineColor,
      getRadius: 10 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,

      wireframe: true,
      getLineWidth: 1,
      filled: true,
      getColor: [255, 0, 0, 0],
      modelMatrix: getMMatrix(viewState.zoom),
    });
  });

  const search_mini_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].overview
      : [];
    const lineColor = search.getLineColor(i);

    return new ScatterplotLayer({
      data: data,
      id: "mini-search-scatter-" + spec.key,
      getPosition: (d) => [d.x, d.y],
      getLineColor: lineColor,
      getRadius: 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,

      wireframe: true,
      getLineWidth: 1,
      filled: true,
      getColor: [255, 0, 0, 0],
    });
  });
  layers.push(...search_layers, search_mini_layers);

  const layerFilter = useCallback(({ layer, viewport }) => {
    const first_bit =
      (layer.id.startsWith("main") && viewport.id === "main") ||
      (layer.id.startsWith("mini") && viewport.id === "minimap");

    return first_bit;
  }, []);

  return { layers, layerFilter };
};

export default useLayers;
