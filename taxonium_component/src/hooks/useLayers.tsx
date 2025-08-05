import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
  SolidPolygonLayer,
} from "@deck.gl/layers";

import { useMemo, useCallback } from "react";
import computeBounds from "../utils/computeBounds";
import useTreenomeLayers from "./useTreenomeLayers";
import getSVGfunction from "../utils/deckglToSvg";
import type { Node } from "../types/node";
import type { NodeLookupData, Config, DynamicData } from "../types/backend";
import type { DeckSize, HoverInfo } from "../types/common";
import type { ColorHook, ColorBy } from "../types/color";
import type { Settings } from "../types/settings";
import type { SearchState } from "../types/search";
import type { TreenomeState } from "../types/treenome";
import type { HoverDetailsState, SelectedDetails } from "../types/ui";
import type { ViewState } from "../types/view";

const getKeyStuff = (
  getNodeColorField: (node: Node, data: NodeLookupData) => string | number,
  colorByField: string,
  dataset: NodeLookupData,
  toRGB: (value: string | number) => [number, number, number],
) => {
  const counts: Record<string, number> = {};
  for (const node of dataset.nodes) {
    const value = getNodeColorField(node, dataset);
    const key = String(value);
    if (key in counts) {
      counts[key]++;
    } else {
      counts[key] = 1;
    }
  }
  const keys = Object.keys(counts);
  const output: Array<{
    value: string;
    count: number;
    color: [number, number, number];
  }> = [];
  for (const key of keys) {
    output.push({ value: key, count: counts[key], color: toRGB(key) });
  }
  return output;
};

interface UseLayersProps {
  data: DynamicData;
  search: SearchState;
  viewState: ViewState;
  deckSize: DeckSize | null;
  colorHook: ColorHook;
  setHoverInfo: (info: HoverInfo<Node> | null) => void;
  hoverInfo: HoverInfo<Node> | null;
  colorBy: ColorBy;
  xType: string;
  modelMatrix: number[];
  selectedDetails: SelectedDetails;
  settings: Settings;
  isCurrentlyOutsideBounds: boolean;
  config: Config;
  treenomeState: TreenomeState;
  treenomeReferenceInfo: Record<"aa" | "nt", Record<string, string>> | null;
  setTreenomeReferenceInfo: (
    info: Record<"aa" | "nt", Record<string, string>>,
  ) => void;
  hoveredKey: string | null;
}

const useLayers = ({
  data,
  search,
  viewState,
  deckSize,
  colorHook,
  setHoverInfo,
  hoverInfo,
  colorBy,
  xType,
  modelMatrix,
  selectedDetails,
  settings,
  isCurrentlyOutsideBounds,
  config,
  treenomeState,
  treenomeReferenceInfo,
  setTreenomeReferenceInfo,
  hoveredKey,
}: UseLayersProps) => {
  const lineColor = settings.lineColor;
  const getNodeColorField = colorBy.getNodeColorField;
  const colorByField = colorBy.colorByField;

  const { toRGB } = colorHook;

  const layers = [];

  // Treenome Browser layers
  const treenomeLayers = useTreenomeLayers(
    treenomeState as any,
    data,
    viewState,
    colorHook,
    setHoverInfo as (info: unknown) => void,
    settings,
    treenomeReferenceInfo as any,
    setTreenomeReferenceInfo,
    selectedDetails as any,
  );
  layers.push(...treenomeLayers);

  const getX = useCallback((node: Node) => node[xType], [xType]);

  const detailed_data = useMemo(() => {
    if (data.data && data.data.nodes) {
      data.data.nodes.forEach((node: Node) => {
        node.parent_x = getX(data.data.nodeLookup[node.parent_id!]);
        node.parent_y = data.data.nodeLookup[node.parent_id!].y;
      });
      return data.data;
    } else {
      return { nodes: [], nodeLookup: {} };
    }
  }, [data.data, getX]);

  const keyStuff = useMemo(() => {
    return getKeyStuff(getNodeColorField, colorByField, detailed_data, toRGB);
  }, [detailed_data, getNodeColorField, colorByField, toRGB]);

  const clade_accessor = "pango";

  const clade_data = useMemo(() => {
    const initial_data = detailed_data.nodes.filter(
      (n: Node) => n.clades && n.clades[clade_accessor],
    );

    const rev_sorted_by_num_tips = initial_data.sort(
      (a: Node, b: Node) => b.num_tips - a.num_tips,
    );

    // pick top settings.minTipsForCladeText
    const top_nodes = rev_sorted_by_num_tips.slice(0, settings.maxCladeTexts);
    return top_nodes;
  }, [detailed_data.nodes, settings.maxCladeTexts, clade_accessor]);

  const base_data = useMemo(() => {
    if (data.base_data && data.base_data.nodes) {
      const baseLookup = data.base_data.nodeLookup;
      data.base_data.nodes.forEach((node: Node) => {
        const parentNode = baseLookup[node.parent_id!];
        node.parent_x = getX(parentNode);
        node.parent_y = parentNode.y;
      });
      return {
        nodes: data.base_data.nodes,
        nodeLookup: baseLookup,
      };
    }
    return { nodes: [], nodeLookup: {} };
  }, [data.base_data, getX]);

  const detailed_scatter_data = useMemo(() => {
    return detailed_data.nodes.filter(
      (node: Node) =>
        node.is_tip ||
        (node.is_tip === undefined && node.num_tips === 1) ||
        settings.displayPointsForInternalNodes,
    );
  }, [detailed_data, settings.displayPointsForInternalNodes]);

  const minimap_scatter_data = useMemo(() => {
    return base_data
      ? base_data.nodes.filter(
          (node: Node) =>
            node.is_tip ||
            (node.is_tip === undefined && node.num_tips === 1) ||
            settings.displayPointsForInternalNodes,
        )
      : [];
  }, [base_data, settings.displayPointsForInternalNodes]);

  const computedViewState = useMemo(
    () => computeBounds({ ...viewState }, deckSize),
    [viewState, deckSize],
  );

  const zoomY = Array.isArray(viewState.zoom)
    ? viewState.zoom[1]
    : (viewState.zoom as number);

  const outer_bounds = [
    [-100000, -100000],
    [100000, -100000],
    [1000000, 1000000],
    [-100000, 1000000],
    [-100000, -100000],
  ];
  const inner_bounds = [
    [
      computedViewState.min_x,
      computedViewState.min_y < -1000 ? -1000 : computedViewState.min_y,
    ],
    [
      computedViewState.max_x,
      computedViewState.min_y < -1000 ? -1000 : computedViewState.min_y,
    ],
    [
      computedViewState.max_x,
      computedViewState.max_y > 10000 ? 10000 : computedViewState.max_y,
    ],
    [
      computedViewState.min_x,
      computedViewState.max_y > 10000 ? 10000 : computedViewState.max_y,
    ],
  ];

  const bound_contour = [[outer_bounds, inner_bounds]];

  const scatter_layer_common_props = {
    getPosition: (d: Node) => [getX(d), d.y],
    getFillColor: (d: Node) => toRGB(getNodeColorField(d, detailed_data)),
    getRadius: settings.nodeSize,
    // radius in pixels
    // we had to get rid of the below because it was messing up the genotype colours
    // getRadius: (d) =>
    //  getNodeColorField(d, detailed_data) === hoveredKey ? 4 : 3,
    getLineColor: [100, 100, 100],
    opacity: settings.opacity,
    stroked: data.data.nodes && data.data.nodes.length < 3000,
    lineWidthUnits: "pixels",
    lineWidthScale: 1,
    pickable: true,
    radiusUnits: "pixels",
    onHover: (info: HoverInfo<Node>) => setHoverInfo(info),
    modelMatrix: modelMatrix,
    updateTriggers: {
      getFillColor: [detailed_data, getNodeColorField, colorHook],
      getRadius: [settings.nodeSize],
      getPosition: [xType],
    },
  };

  const line_layer_horiz_common_props = {
    getSourcePosition: (d: Node) => [getX(d), d.y],
    getTargetPosition: (d: Node) => [d.parent_x, d.y],
    getColor: lineColor,
    pickable: true,
    widthUnits: "pixels",
    getWidth: (d: Node) =>
      d === (hoverInfo && hoverInfo.object)
        ? 3
        : selectedDetails.nodeDetails &&
            selectedDetails.nodeDetails.node_id === d.node_id
          ? 3.5
          : 1,

    onHover: (info: HoverInfo<Node>) => setHoverInfo(info),

    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails],
    },
  };

  const line_layer_vert_common_props = {
    getSourcePosition: (d: Node) => [d.parent_x, d.y],
    getTargetPosition: (d: Node) => [d.parent_x, d.parent_y],
    onHover: (info: HoverInfo<Node>) => setHoverInfo(info),
    getColor: lineColor,
    pickable: true,
    getWidth: (d: Node) =>
      d === (hoverInfo && hoverInfo.object)
        ? 2
        : selectedDetails.nodeDetails &&
            selectedDetails.nodeDetails.node_id === d.node_id
          ? 2.5
          : 1,
    modelMatrix: modelMatrix,
    updateTriggers: {
      getSourcePosition: [detailed_data, xType],
      getTargetPosition: [detailed_data, xType],
      getWidth: [hoverInfo, selectedDetails.nodeDetails],
    },
  };

  if (detailed_data.nodes) {
    const main_scatter_layer = {
      layerType: "ScatterplotLayer",
      ...scatter_layer_common_props,
      id: "main-scatter",
      data: detailed_scatter_data,
    };

    const pretty_stroke_background_layer = settings.prettyStroke.enabled
      ? {
          ...main_scatter_layer,
          getFillColor: settings.prettyStroke.color,
          getLineWidth: 0,
          getRadius: main_scatter_layer.getRadius + settings.prettyStroke.width,
        }
      : null;

    const fillin_scatter_layer = {
      layerType: "ScatterplotLayer",
      ...scatter_layer_common_props,
      id: "fillin-scatter",
      data: minimap_scatter_data,
      getFillColor: (d: Node) => toRGB(getNodeColorField(d, base_data)),
    };

    const main_line_layer = {
      layerType: "LineLayer",
      ...line_layer_horiz_common_props,
      id: "main-line-horiz",
      data: detailed_data.nodes,
    };

    const main_line_layer2 = {
      layerType: "LineLayer",
      ...line_layer_vert_common_props,
      id: "main-line-vert",
      data: detailed_data.nodes,
    };

    const fillin_line_layer = {
      layerType: "LineLayer",
      ...line_layer_horiz_common_props,
      id: "fillin-line-horiz",
      data: base_data.nodes,
    };

    const fillin_line_layer2 = {
      layerType: "LineLayer",
      ...line_layer_vert_common_props,
      id: "fillin-line-vert",
      data: base_data.nodes,
    };

    const selectedLayer = {
      layerType: "ScatterplotLayer",
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
      getPosition: (d: Node) => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2,
    };

    const hoveredLayer = {
      layerType: "ScatterplotLayer",
      data: hoverInfo && hoverInfo.object ? [hoverInfo.object] : [],
      visible: true,
      opacity: 0.3,
      getRadius: 4,
      radiusUnits: "pixels",

      id: "main-hovered",
      filled: false,
      stroked: true,
      modelMatrix,

      getLineColor: [0, 0, 0],
      getPosition: (d: Node) => {
        return [d[xType], d.y];
      },
      lineWidthUnits: "pixels",
      lineWidthScale: 2,
    };


    const clade_label_layer = {
      layerType: "TextLayer",
      id: "main-clade-node",
      getPixelOffset: [-5, -6],
      data: clade_data,
      getPosition: (d: Node) => [getX(d), d.y],
      getText: (d: Node) => d.clades[clade_accessor],

      getColor: settings.cladeLabelColor,
      getAngle: 0,
      fontFamily: "Roboto, sans-serif",
      fontWeight: 700,

      billboard: true,
      getTextAnchor: "end",
      getAlignmentBaseline: "center",
      getSize: 11,
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [getX],
      },
    };

    layers.push(
      main_line_layer,
      main_line_layer2,
      fillin_line_layer,
      fillin_line_layer2,
      pretty_stroke_background_layer,
      main_scatter_layer,
      fillin_scatter_layer,
      clade_label_layer,
      selectedLayer,
      hoveredLayer,
    );
  }

  const proportionalToNodesOnScreen =
    (config as any).num_tips / 2 ** zoomY;

  // If leaves are fewer than max_text_number, add a text layer
  if (
    data.data.nodes &&
    proportionalToNodesOnScreen <
      0.8 * 10 ** settings.thresholdForDisplayingText
  ) {
    const node_label_layer = {
      layerType: "TextLayer",
      id: "main-text-node",
      fontFamily: "Roboto, sans-serif",
      fontWeight: 100,
      data: data.data.nodes.filter((node: Node) =>
        settings.displayTextForInternalNodes
          ? true
          : node.is_tip || (node.is_tip === undefined && node.num_tips === 1),
      ),
      getPosition: (d: Node) => [getX(d), d.y],
      getText: (d: Node) => d[(config as any).name_accessor],

      getColor: settings.terminalNodeLabelColor,
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.nodes.length < 200 ? 12 : 9.5,
      modelMatrix: modelMatrix,
      getPixelOffset: [10, 0],
    };

    layers.push(node_label_layer);
  }

  const minimap_scatter = {
    layerType: "ScatterplotLayer",
    id: "minimap-scatter",
    data: minimap_scatter_data,
    getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -4000],
    getPosition: (d: Node) => [getX(d), d.y],
    getFillColor: (d: Node) => toRGB(getNodeColorField(d, base_data)),
    // radius in pixels
    getRadius: 2,
    getLineColor: [100, 100, 100],

    opacity: 0.6,
    radiusUnits: "pixels",
    onHover: (info: HoverInfo<Node>) => setHoverInfo(info),
    updateTriggers: {
      getFillColor: [base_data, getNodeColorField, colorHook],
      getPosition: [minimap_scatter_data, xType],
    },
  };

  const minimap_line_horiz = {
    layerType: "LineLayer",
    id: "minimap-line-horiz",
    getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -4000],
    data: base_data.nodes,
    getSourcePosition: (d: Node) => [getX(d), d.y],
    getTargetPosition: (d: Node) => [d.parent_x, d.y],
    getColor: lineColor,
    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
    },
  };

  const minimap_line_vert = {
    layerType: "LineLayer",
    id: "minimap-line-vert",
    getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -4000],
    data: base_data.nodes,
    getSourcePosition: (d: Node) => [d.parent_x, d.y],
    getTargetPosition: (d: Node) => [d.parent_x, d.parent_y],
    getColor: lineColor,

    updateTriggers: {
      getSourcePosition: [base_data, xType],
      getTargetPosition: [base_data, xType],
    },
  };

  const minimap_polygon_background = {
    layerType: "PolygonLayer",
    id: "minimap-bound-background",
    data: [outer_bounds],
    getPolygon: (d: any) => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -2000],

    getFillColor: (d: any) => [255, 255, 255],
  };

  const minimap_bound_polygon = {
    layerType: "PolygonLayer",
    id: "minimap-bound-line",
    data: bound_contour,
    getPolygon: (d: any) => d,
    pickable: true,
    stroked: true,
    opacity: 0.3,
    filled: true,
    wireframe: true,
    getFillColor: (d: any) => [240, 240, 240],
    getLineColor: [80, 80, 80],
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -6000],
  };

  const { searchSpec, searchResults, searchesEnabled } = search;

  const search_layers = searchSpec.map((spec: any, i: number) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].result.data
      : [];

    const lineColor = search.getLineColor(i);

    return {
      layerType: "ScatterplotLayer",

      data: data,
      id: "main-search-scatter-" + spec.key,
      getPosition: (d: Node) => [d[xType], d.y],
      getLineColor: settings.displaySearchesAsPoints ? [0, 0, 0] : lineColor,
      getRadius: settings.displaySearchesAsPoints
        ? settings.searchPointSize
        : 5 + 2 * i,
      radiusUnits: "pixels",
      lineWidthUnits: "pixels",
      stroked: true,
      visible: searchesEnabled[spec.key],
      wireframe: true,
      getLineWidth: 1,
      filled: true,
      getFillColor: settings.displaySearchesAsPoints
        ? lineColor
        : [255, 0, 0, 0],
      modelMatrix: modelMatrix,
      updateTriggers: {
        getPosition: [xType],
      },
    };
  });

  const search_mini_layers = searchSpec.map((spec: any, i: number) => {
    const data = searchResults[spec.key]
      ? searchResults[spec.key].overview
      : [];
    const lineColor = search.getLineColor(i);

    return {
      layerType: "ScatterplotLayer",
      data: data,
      getPolygonOffset: ({ layerIndex }: { layerIndex: number }) => [0, -9000],
      id: "mini-search-scatter-" + spec.key,
      visible: searchesEnabled[spec.key],
      getPosition: (d: Node) => [d[xType], d.y],
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
    };
  });
  layers.push(...search_layers, ...search_mini_layers);

  layers.push(minimap_polygon_background);
  layers.push(minimap_line_horiz, minimap_line_vert, minimap_scatter);
  layers.push(minimap_bound_polygon);

  const layerFilter = useCallback(
    ({
      layer,
      viewport,
      renderPass,
    }: {
      layer: any;
      viewport: any;
      renderPass: any;
    }) => {
      const first_bit =
        (layer.id.startsWith("main") && viewport.id === "main") ||
        (layer.id.startsWith("mini") && viewport.id === "minimap") ||
        (layer.id.startsWith("fillin") &&
          viewport.id === "main" &&
          isCurrentlyOutsideBounds) ||
        (layer.id.startsWith("browser-loaded") &&
          viewport.id === "browser-main") ||
        (layer.id.startsWith("browser-fillin") &&
          viewport.id === "browser-main" &&
          isCurrentlyOutsideBounds);

      return first_bit;
    },
    [isCurrentlyOutsideBounds],
  );

  const processedLayers = layers
    .filter((x) => x !== null)
    .map((layer) => {
        if (layer.layerType === "ScatterplotLayer") {
          return new ScatterplotLayer(layer as any);
        }
        if (layer.layerType === "LineLayer") {
          return new LineLayer(layer as any);
        }
        if (layer.layerType === "PolygonLayer") {
          return new PolygonLayer(layer as any);
        }
        if (layer.layerType === "TextLayer") {
          return new TextLayer(layer as any);
        }
        if (layer.layerType === "SolidPolygonLayer") {
          return new SolidPolygonLayer(layer as any);
        }
      console.log("could not map layer spec for ", layer);
    });

  const { triggerSVGdownload } = getSVGfunction(
    layers.filter((x) => x !== null),
    viewState,
  );

  return { layers: processedLayers, layerFilter, keyStuff, triggerSVGdownload };
};

export default useLayers;
