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
  xType,
  modelMatrix,
  selectedDetails,
  xzoom,
  settings,
  isCurrentlyOutsideBounds,
}) => {
  const lineColor = [150, 150, 150];
  const getNodeColorField = colorBy.getNodeColorField;

  const { toRGB } = colorHook;

  const layers = [];

  const getX = useCallback((node) => node[xType], [xType]);

  const detailed_data = useMemo(() => {
    if (data.data && data.data.nodes) {
      data.data.nodes.forEach((node) => {
        node.parent_x = getX(data.data.nodeLookup[node.parent_id]);
        node.parent_y = data.data.nodeLookup[node.parent_id].y;
      });
      return data.data;
    } else {
      return { nodes: [], nodeLookup: {} };
    }
  }, [data.data, getX]);

  const clade_accessor = "pango";
  const clade_data = useMemo(
    () =>
      detailed_data.nodes.filter((n) => n.clades && n.clades[clade_accessor]),
    [detailed_data.nodes]
  );

  const base_data = useMemo(() => {
    if (data.base_data && data.base_data.nodes) {
      data.base_data.nodes.forEach((node) => {
        node.parent_x = getX(data.base_data.nodeLookup[node.parent_id]);
        node.parent_y = data.base_data.nodeLookup[node.parent_id].y;
      });
      return {
        nodes: data.base_data.nodes,
        nodeLookup: data.base_data.nodeLookup,
      };
    } else {
      return { nodes: [], nodeLookup: {} };
    }
  }, [data.base_data, getX]);

  const detailed_scatter_data = useMemo(() => {
    console.log("new scatter");
    return detailed_data.nodes.filter(
      (d) => d.num_tips === 1 || settings.displayPointsForInternalNodes
    );
  }, [detailed_data, settings.displayPointsForInternalNodes]);

  const minimap_scatter_data = useMemo(() => {
    return base_data
      ? base_data.nodes.filter(
          (node) =>
            node.num_tips === 1 || settings.displayPointsForInternalNodes
        )
      : [];
  }, [base_data, settings.displayPointsForInternalNodes]);

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

  const scatter_layer_common_props = {
    getPosition: (d) => [getX(d), d.y],
    getFillColor: (d) => toRGB(getNodeColorField(d, detailed_data)),

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
      getFillColor: [detailed_data, getNodeColorField],
      getPosition: [xType],
    },
  };

  const line_layer_horiz_common_props = {
    getSourcePosition: (d) => [getX(d), d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: lineColor,
    pickable: true,
    onHover: (info) => setHoverInfo(info),

    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
    },
  };

  const line_layer_vert_common_props = {
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    onHover: (info) => setHoverInfo(info),
    getColor: lineColor,
    pickable: true,
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
    },
  };

  const text_x_gap = 15 / 2 ** xzoom;

  if (detailed_data.nodes) {
    const main_scatter_layer = new ScatterplotLayer({
      ...scatter_layer_common_props,
      id: "main-scatter",
      data: detailed_scatter_data,
    });

    const fillin_scatter_layer = new ScatterplotLayer({
      ...scatter_layer_common_props,
      id: "fillin-scatter",
      data: minimap_scatter_data,
      getFillColor: (d) => toRGB(getNodeColorField(d, base_data)),
    });

    const main_line_layer = new LineLayer({
      ...line_layer_horiz_common_props,
      id: "main-line-horiz",
      data: detailed_data.nodes,
    });

    const main_line_layer2 = new LineLayer({
      ...line_layer_vert_common_props,
      id: "main-line-vert",
      data: detailed_data.nodes,
    });

    const fillin_line_layer = new LineLayer({
      ...line_layer_horiz_common_props,
      id: "fillin-line-horiz",
      data: base_data.nodes,
    });

    const fillin_line_layer2 = new LineLayer({
      ...line_layer_vert_common_props,
      id: "fillin-line-vert",
      data: base_data.nodes,
    });

    const selectedLayer = new ScatterplotLayer({
      data: selectedDetails.nodeDetails ? [selectedDetails.nodeDetails] : [],
      visible: true,
      opacity: 1,
      getRadius: 6,
      radiusUnits: "pixels",

      id: "main-selected",
      filled: false,
      stroked: true,
      modelMatrix,

      getLineColor: [0, 0, 0],
      getPosition: (d) => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2,
    });

    const clade_label_layer = new TextLayer({
      id: "main-clade-node",

      data: clade_data,
      getPosition: (d) => [getX(d), d.y],
      getText: (d) => d.clades[clade_accessor],

      getColor: [100, 100, 100],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "end",
      getAlignmentBaseline: "center",
      getSize: 14,
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [getX],
      },
    });

    layers.push(
      main_line_layer,
      main_line_layer2,
      fillin_line_layer,
      fillin_line_layer2,
      main_scatter_layer,
      fillin_scatter_layer,
      clade_label_layer,
      selectedLayer
    );
  }

  // If leaves are fewer than max_text_number, add a text layer
  if (
    data.data.nodes &&
    data.data.nodes.length < 10 ** settings.thresholdForDisplayingText
  ) {
    const node_label_layer = new TextLayer({
      id: "main-text-node",

      data: data.data.nodes.filter((node) =>
        settings.displayTextForInternalNodes ? true : node.num_tips === 1
      ),
      getPosition: (d) => [getX(d) + text_x_gap, d.y],
      getText: (d) => d.name,

      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.nodes.length < 200 ? 12 : 9.5,
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [text_x_gap],
      },
    });

    layers.push(node_label_layer);
  }

  const minimap_scatter = new ScatterplotLayer({
    id: "minimap-scatter",
    data: minimap_scatter_data,
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    getPosition: (d) => [getX(d), d.y],
    getFillColor: (d) => toRGB(getNodeColorField(d, base_data)),
    // radius in pixels
    getRadius: 2,
    getLineColor: [100, 100, 100],

    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
    updateTriggers: {
      getFillColor: [base_data, getNodeColorField],
      getPosition: [minimap_scatter_data, xType],
    },
  });

  const minimap_line_horiz = new LineLayer({
    id: "minimap-line-horiz",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data.nodes,
    getSourcePosition: (d) => [getX(d), d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: lineColor,

    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
    },
  });

  const minimap_line_vert = new LineLayer({
    id: "minimap-line-vert",
    getPolygonOffset: ({ layerIndex }) => [0, -4000],
    data: base_data.nodes,
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    getColor: lineColor,

    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
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
      getPosition: (d) => [d[xType], d.y],
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
        getPosition: [xType],
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
      getPosition: (d) => [d[xType], d.y],
      getLineColor: lineColor,
      getRadius: 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,

      wireframe: true,
      getLineWidth: 1,
      filled: false,
      getFillColor: [255, 0, 0, 0],
      updateTriggers: { getPosition: [xType] },
    });
  });
  layers.push(...search_layers, search_mini_layers);

  layers.push(minimap_polygon_background);
  layers.push(minimap_line_horiz, minimap_line_vert, minimap_scatter);
  layers.push(minimap_bound_polygon);

  const layerFilter = useCallback(
    ({ layer, viewport }) => {
      const first_bit =
        (layer.id.startsWith("main") && viewport.id === "main") ||
        (layer.id.startsWith("mini") && viewport.id === "minimap") ||
        (layer.id.startsWith("fillin") &&
          viewport.id === "main" &&
          isCurrentlyOutsideBounds);

      return first_bit;
    },
    [isCurrentlyOutsideBounds]
  );

  return { layers, layerFilter };
};

export default useLayers;
