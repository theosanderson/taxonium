import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";

import { useMemo, useCallback } from "react";



const useLayers = ({
  data,
  search,
  viewState,
  colorHook,
  setHoverInfo,
  colorBy,
  xAccessor,
  modelMatrix
}
) => {
  const lineColor = [150, 150, 150];
  const getNodeColorField = colorBy.getNodeColorField;

  const { toRGB } = colorHook;

  const layers = [];

  const init_combo = useMemo(() => {
    if (
      data.data &&
      data.base_data &&
      data.data.nodes &&
      data.base_data.nodes &&
      (data.status === "loading" || data.status === "pending")
    ) {
      // add data.data.nodes and data.base_data.nodes and dedupe
      const nodes_deduped = [
        ...new Set([...data.data.nodes, ...data.base_data.nodes]),
      ];
      return {
        nodes: nodes_deduped,
        nodeLookup: { ...data.data.nodeLookup, ...data.base_data.nodeLookup },
      };
    } else if (data.data.nodes && data.status === "loaded") {
      // add data.data.nodes and data.base_data.nodes and dedupe
      const nodes_deduped = [
        ...new Set([...data.data.nodes, ...data.base_data.nodes]),
      ];
      return {
        nodes: nodes_deduped,
        nodeLookup: { ...data.data.nodeLookup, ...data.base_data.nodeLookup },
      };
    } else {
      console.log("C", data.data, data.base_data);
      return { nodes: [], nodeLookup: {} };
    }
  }, [data.data, data.base_data, data.status]);

  const combo = useMemo(() => {
    init_combo.nodes.forEach((node) => {
      node.final_x = node[xAccessor];
    });
    init_combo.nodes.forEach((node) => {
      node.parent_x = init_combo.nodeLookup[node.parent_id].final_x;
      node.parent_y = init_combo.nodeLookup[node.parent_id].y;
    });
    return { nodes: init_combo.nodes, nodeLookup: init_combo.nodeLookup };
  }, [init_combo, xAccessor]);

  const base_data = useMemo(() => {
    if (data.base_data && data.base_data.nodes) {
      data.base_data.nodes.forEach((node) => {
        node.final_x = node[xAccessor];
      });
      data.base_data.nodes.forEach((node) => {
        node.parent_x = data.base_data.nodeLookup[node.parent_id].final_x;
        node.parent_y = data.base_data.nodeLookup[node.parent_id].y;
      });
      return {
        nodes: data.base_data.nodes,
        nodeLookup: data.base_data.nodeLookup,
      };
    } else {
      return { nodes: [], nodeLookup: {} };
    }
  }, [data.base_data, xAccessor]);

  const combo_scatter = useMemo(() => {
    console.log("new scatter");
    return combo.nodes.filter((d) => d.name !== "");
  }, [combo]);

  const minimap_scatter_data = useMemo(() => {
    return base_data ? base_data.nodes.filter((node) => node.name !== "") : [];
  }, [base_data]);

  const outer_bounds = [
    [-1000, -1000],
    [1000, -1000],
    [10000, 10000],
    [-1000, 10000],
    [-1000, -1000],
  ];
  const inner_bounds = [
    [viewState.min_x, viewState.min_y < -1000 ? -1000 : viewState.min_y],
    [viewState.max_x, viewState.min_y < -1000 ? -1000 : viewState.min_y],
    [viewState.max_x, viewState.max_y > 10000 ? 10000 : viewState.max_y],
    [viewState.min_x, viewState.max_y > 10000 ? 10000 : viewState.max_y],
  ];

  const bound_contour = [[outer_bounds, inner_bounds]];

  if (data.data.nodes) {
    const temp_scatter_layer = new ScatterplotLayer({
      id: "main-scatter",
      data: combo_scatter.filter((x) => true), //this isn't great: how can we remove this. We have it because otherwise colour doesn't always update.
      getPosition: (d) => [d.final_x, d.y],
      getFillColor: (d) => toRGB(getNodeColorField(d, combo)),

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
      modelMatrix: modelMatrix,
      updateTriggers: {
        getFillColor: [combo, getNodeColorField],
      },
    });

    const bound_layer = new ScatterplotLayer({
      id: "main-bounds",
      data: outer_bounds,
      getPosition: (d) => [d[0], d[1]],
      getColor: (d) => [255, 0, 0, 255],
      // radius in pixels
      getRadius: 4,
      pickable: true,
      radiusUnits: "pixels",
      modelMatrix: modelMatrix,
    });

    const temp_line_layer = new LineLayer({
      id: "main-line-horiz",
      data: data.data.nodes,
      getSourcePosition: (d) => [d.final_x, d.y],
      getTargetPosition: (d) => [d.parent_x, d.y],
      getColor: lineColor,
      pickable: true,
      onHover: (info) => setHoverInfo(info),

      modelMatrix: modelMatrix,
      updateTriggers: {
        getSourcePosition: [combo, xAccessor],
        getTargetPosition: [combo, xAccessor],
      },
    });

    const temp_line_layer2 = new LineLayer({
      id: "main-line-vert",
      data: data.data.nodes,
      getSourcePosition: (d) => [d.parent_x, d.y],
      getTargetPosition: (d) => [d.parent_x, d.parent_y],
      onHover: (info) => setHoverInfo(info),
      getColor: lineColor,
      pickable: true,
      modelMatrix: modelMatrix,
      updateTriggers: {
        getSourcePosition: [combo, xAccessor],
        getTargetPosition: [combo, xAccessor],
      },
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
      getPosition: (d) => [d.final_x + 10, d.y],
      getText: (d) => d.name,

      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.nodes.length < 200 ? 12 : 9.5,
      modelMatrix: modelMatrix,
    });

    layers.push(node_label_layer);
  }

  const minimap_scatter = new ScatterplotLayer({
    id: "minimap-scatter",
    data: minimap_scatter_data,
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    getPosition: (d) => [d.final_x, d.y],
    getFillColor: (d) => toRGB(getNodeColorField(d, base_data)),
    // radius in pixels
    getRadius: 2,
    getLineColor: [100, 100, 100],

    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
    updateTriggers: {
      getFillColor: [base_data, getNodeColorField],
      getPosition: [minimap_scatter_data, xAccessor],
    },
  });

  const minimap_line_horiz = new LineLayer({
    id: "minimap-line-horiz",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data ? base_data.nodes : [],
    getSourcePosition: (d) => [d.final_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: lineColor,

    updateTriggers: {
      getSourcePosition: [combo, xAccessor],
      getTargetPosition: [combo, xAccessor],
    },
  });

  const minimap_line_vert = new LineLayer({
    id: "minimap-line-vert",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data ? base_data.nodes : [],
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    getColor: lineColor,

    updateTriggers: {
      getSourcePosition: [combo, xAccessor],
      getTargetPosition: [combo, xAccessor],
    },
  });

  const minimap_polygon_background = new PolygonLayer({
    id: "minimap-bound-background",
    data: [outer_bounds],
    getPolygon: (d) => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    getPolygonOffset: ({ layerIndex }) => [0, -2000],

    getFillColor: (d) => [255, 255, 255],
  });

  const minimap_bound_polygon = new PolygonLayer({
    id: "minimap-bound-line",
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
    getPolygonOffset: ({ layerIndex }) => [0, -6000],
  });

  const { searchSpec, searchResults, searchesEnabled } = search;

  const search_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].result.data
      : [];

    const lineColor = search.getLineColor(i);

    return new ScatterplotLayer({
      data: data,
      id: "main-search-scatter-" + spec.key,
      getPosition: (d) => [d[xAccessor], d.y],
      getLineColor: lineColor,
      getRadius: 10 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,
      visible: searchesEnabled[spec.key],
      wireframe: true,
      getLineWidth: 1,
      filled: true,
      getFillColor: [255, 0, 0, 0],
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [xAccessor],
      },
    });
  });

  const search_mini_layers = searchSpec.map((spec, i) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].overview
      : [];
    const lineColor = search.getLineColor(i);

    return new ScatterplotLayer({
      data: data,
      getPolygonOffset: ({ layerIndex }) => [0, -9000],
      id: "mini-search-scatter-" + spec.key,
      visible: searchesEnabled[spec.key],
      getPosition: (d) => [d[xAccessor], d.y],
      getLineColor: lineColor,
      getRadius: 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,

      wireframe: true,
      getLineWidth: 1,
      filled: false,
      getFillColor: [255, 0, 0, 0],
      updateTriggers: { getPosition: [xAccessor] },
    });
  });
  layers.push(...search_layers, search_mini_layers);

  layers.push(minimap_polygon_background);
  layers.push(minimap_line_horiz, minimap_line_vert, minimap_scatter);
  layers.push(minimap_bound_polygon);

  const layerFilter = useCallback(({ layer, viewport }) => {
    const first_bit =
      (layer.id.startsWith("main") && viewport.id === "main") ||
      (layer.id.startsWith("mini") && viewport.id === "minimap");

    return first_bit;
  }, []);

  return { layers, layerFilter };
};

export default useLayers;
