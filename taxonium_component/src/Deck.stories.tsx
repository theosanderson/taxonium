import { fn } from "@storybook/test";
import Deck, { DeckProps } from "./Deck";
import React, { useRef } from "react";

export default {
  title: "Taxonium/Deck",
  component: Deck,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

// Create mock data and props for the Deck component
const createMockProps = (overrides: Record<string, unknown> = {}): DeckProps => {
  const deckRef = { current: { pickObject: fn() } };
  const jbrowseRef = { current: null };
  const nodes = overrides.noData
    ? []
    : [
        { node_id: "1", x: 0, y: 0, mutations: [] },
        { node_id: "2", x: 100, y: 50, mutations: [] },
      ];

  return {
    data: {
      data: {
        nodes: overrides.noData
          ? []
          : [
              { node_id: 1, x: 0, y: 0 },
              { node_id: 2, x: 100, y: 50 },
            ],
      },
      status: overrides.loading ? "loading" : "loaded",
    },
    search: {
      searchSpec: [],
      searchesEnabled: {},
      searchResults: {},
    },
    treenomeState: {
      genome: overrides.treenomeEnabled ? "ACTGACTG" : "",
      handleResize: fn(),
      ntBounds: [0, 1000],
      genomeSize: 1000,
    },
    view: {
      viewState: {
        zoom: 2,
        target: [0, 0],
      },
      zoomReset: fn(),
      onViewStateChange: fn(),
      views: [{ id: "main" }, { id: "browser-axis" }],
      zoomIncrement: fn(),
      zoomAxis: "X",
      setZoomAxis: fn(),
      modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      setMouseXY: fn(),
    },
    colorHook: {
      toRGB: () => [128, 128, 128],
      toRGBCSS: () => "rgb(128, 128, 128)",
    },
    colorBy: {
      colorByField: "lineage",
      colorByGene: "S",
      colorByPosition: 484,
      getNodeColorField: () => "Alpha",
      colorByOptions: ["lineage", "country", "date", "genotype", "None"],
    },
    hoverDetails: {
      nodeDetails: null,
      getNodeDetails: fn(),
      clearNodeDetails: fn(),
    },
    config: {
      name_accessor: "name",
      keys_to_display: ["country", "date", "lineage"],
      mutations: true,
      useHydratedMutations: 1,
      genes: ["S", "N", "E", "M", "ORF1a", "ORF1b"],
    },
    statusMessage: overrides.statusMessage || null,
    xType: "x_dist",
    settings: {
      minimapEnabled: true,
      displayTextForInternalNodes: false,
      displayPointsForInternalNodes: true,
      thresholdForDisplayingText: 1.5,
      maxCladeTexts: 1000,
      nodeSize: 3,
      opacity: 0.8,
      prettyStroke: {
        enabled: false,
        color: "#000000",
        width: 0.5,
      },
      displaySearchesAsPoints: true,
      searchPointSize: 5,
      terminalNodeLabelColor: "#000000",
      lineColor: "#555555",
      cladeLabelColor: "#333333",
      chromosomeName: "NC_045512v2",
      setChromosomeName: fn(),
      isCov2Tree: true,
      treenomeEnabled: overrides.treenomeEnabled || false,
      setTreenomeEnabled: fn(),
      filterMutations: () => [],
      miniMutationsMenu: () => null,
    },
    selectedDetails: {
      nodeDetails: overrides.selectedNode
        ? {
            node_id: 1,
            name: "Sample1",
            country: "UK",
            date: "2020-03-15",
            lineage: "Alpha",
            mutations: [],
          }
        : null,
      getNodeDetails: fn(),
      clearNodeDetails: fn(),
    },
    setDeckSize: fn(),
    deckSize: { width: 800, height: 600 },
    isCurrentlyOutsideBounds: false,
    deckRef,
    jbrowseRef,
    setAdditionalColorMapping: fn(),
    mouseDownIsMinimap: false,
    setMouseDownIsMinimap: fn(),
    ...overrides,
  } as DeckProps;
};

// Create a wrapper component to provide necessary refs
const DeckWrapper = (props: DeckProps) => {
  const deckRef = useRef(null);
  const jbrowseRef = useRef(null);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Deck {...props} deckRef={deckRef} jbrowseRef={jbrowseRef} />
    </div>
  );
};

export const Default = {
  render: (args: DeckProps) => <DeckWrapper {...args} />,
  args: createMockProps(),
};

export const Loading = {
  render: (args: DeckProps) => <DeckWrapper {...args} />,
  args: createMockProps({
    loading: true,
    statusMessage: {
      message: "Loading tree data...",
      percentage: 45,
    },
  }),
};

export const WithTreenomeEnabled = {
  render: (args: DeckProps) => <DeckWrapper {...args} />,
  args: createMockProps({
    treenomeEnabled: true,
  }),
};

export const WithSelectedNode = {
  render: (args: DeckProps) => <DeckWrapper {...args} />,
  args: createMockProps({
    selectedNode: true,
  }),
};

export const NoData = {
  render: (args: DeckProps) => <DeckWrapper {...args} />,
  args: createMockProps({
    noData: true,
    statusMessage: {
      message: "No data available",
    },
  }),
};
