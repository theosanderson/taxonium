import NodeHoverTip from "./NodeHoverTip";

export default {
  title: "Taxonium/NodeHoverTip",
  component: NodeHoverTip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// Create mock color hook
const mockColorHook = {
  toRGBCSS: (value: string) => {
    const colorMap: Record<string, string> = {
      Alpha: "rgb(200, 100, 100)",
      Beta: "rgb(100, 200, 100)",
      Gamma: "rgb(100, 100, 200)",
      A: "rgb(200, 0, 0)",
      T: "rgb(0, 200, 0)",
      G: "rgb(0, 0, 200)",
      C: "rgb(200, 200, 0)",
    };
    return colorMap[value] || "rgb(128, 128, 128)";
  },
};

// Filter mutations based on type
const filterMutations = (mutations: any[]) => {
  return mutations.filter((m: any) => m.type !== "nt");
};

// Base config for all stories
const baseConfig = {
  name_accessor: "name",
  keys_to_display: ["country", "date", "lineage", "clade"],
  mutations: true,
  useHydratedMutations: 1,
  metadataTypes: {},
};

// Base hover info for terminal node
const terminalNodeHoverInfo = {
  x: 100,
  y: 100,
  object: {
    node_id: 12345,
    name: "hCoV-19/England/ABCD/2020",
    country: "UK",
    date: "2020-03-15",
    lineage: "Alpha",
    clade: "20I",
    mutations: [
      {
        mutation_id: 1,
        gene: "S",
        previous_residue: "D",
        residue_pos: 614,
        new_residue: "G",
        type: "aa",
      },
      {
        mutation_id: 2,
        gene: "N",
        previous_residue: "R",
        residue_pos: 203,
        new_residue: "K",
        type: "aa",
      },
      {
        mutation_id: 3,
        gene: "ORF1a",
        previous_residue: "T",
        residue_pos: 1001,
        new_residue: "I",
        type: "aa",
      },
    ],
  },
};

export const TerminalNode = {
  args: {
    hoverInfo: terminalNodeHoverInfo,
    colorHook: mockColorHook,
    colorBy: {
      colorByField: "lineage",
      getNodeColorField: (node: any) => node.lineage,
    },
    config: baseConfig,
    filterMutations: filterMutations,
    deckSize: { width: 1000, height: 800 },
  },
};

export const InternalNode = {
  args: {
    hoverInfo: {
      ...terminalNodeHoverInfo,
      object: {
        ...terminalNodeHoverInfo.object,
        name: "",
        mutations: [],
      },
    },
    colorHook: mockColorHook,
    colorBy: {
      colorByField: "lineage",
      getNodeColorField: (node: any) => node.lineage,
    },
    config: baseConfig,
    filterMutations: filterMutations,
    deckSize: { width: 1000, height: 800 },
  },
};

export const GenotypeColoring = {
  args: {
    hoverInfo: terminalNodeHoverInfo,
    colorHook: mockColorHook,
    colorBy: {
      colorByField: "genotype",
      colorByGene: "S",
      colorByPosition: 484,
      getNodeColorField: (node: any) => "G",
    },
    config: baseConfig,
    filterMutations: filterMutations,
    deckSize: { width: 1000, height: 800 },
  },
};

export const WithAcknowledgements = {
  args: {
    hoverInfo: terminalNodeHoverInfo,
    hoverDetails: {
      nodeDetails: {
        acknowledgements: {
          covv_orig_lab: "Public Health England",
          covv_subm_lab: "Wellcome Sanger Institute",
          covv_authors:
            "Smith J, Johnson A, Williams B, Brown C, Taylor D, Jones E",
        },
      },
    },
    colorHook: mockColorHook,
    colorBy: {
      colorByField: "lineage",
      getNodeColorField: (node: any) => node.lineage,
    },
    config: baseConfig,
    filterMutations: filterMutations,
    deckSize: { width: 1000, height: 800 },
  },
};

export const BottomRightPosition = {
  args: {
    hoverInfo: {
      ...terminalNodeHoverInfo,
      x: 900,
      y: 700,
    },
    colorHook: mockColorHook,
    colorBy: {
      colorByField: "lineage",
      getNodeColorField: (node: any) => node.lineage,
    },
    config: baseConfig,
    filterMutations: filterMutations,
    deckSize: { width: 1000, height: 800 },
  },
};
