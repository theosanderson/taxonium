import { fn } from "@storybook/test";
import SearchPanel from "./SearchPanel";
import { SearchMethod } from "../types/search";

export default {
  title: "Taxonium/SearchPanel",
  component: SearchPanel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// Mock data for the SearchPanel component
const mockConfig = {
  name_accessor: "name",
  keys_to_display: ["country", "date", "lineage", "clade"],
  num_tips: 10000,
  source: "Example Data Source",
  x_accessors: ["x_dist", "x_time"],
  genes: [
    "S",
    "N",
    "E",
    "M",
    "ORF1a",
    "ORF1b",
    "ORF3a",
    "ORF6",
    "ORF7a",
    "ORF7b",
    "ORF8",
    "ORF9b",
  ],
  mutations: true,
  useHydratedMutations: 1,
  metadataTypes: {},
  search_types: [
    { name: "text", label: "Text", type: "text_match", controls: true },
    { name: "mutation", label: "Mutation", type: "mutation" },
    { name: "genotype", label: "Genotype", type: "genotype" },
    { name: "boolean", label: "Boolean", type: "boolean" },
  ],
};

const mockColorHook = {
  toRGBCSS: (value: string) => {
    const colorMap: Record<string, string> = {
      Alpha: "rgb(200, 100, 100)",
      Beta: "rgb(100, 200, 100)",
      Gamma: "rgb(100, 100, 200)",
      Delta: "rgb(200, 200, 100)",
      A: "rgb(200, 0, 0)",
      T: "rgb(0, 200, 0)",
      G: "rgb(0, 0, 200)",
      C: "rgb(200, 200, 0)",
    };
    return colorMap[value] || "rgb(128, 128, 128)";
  },
};

const mockSearch = {
  searchSpec: [
    {
      key: "1",
      type: "text",
      method: SearchMethod.TEXT_MATCH,
      text: "England",
      controls: true,
    },
    {
      key: "2",
      type: "mutation",
      method: SearchMethod.MUTATION,
      gene: "S",
      position: 484,
      new_residue: "K",
      min_tips: 5,
    },
  ],
  addNewTopLevelSearch: fn(),
};

const mockColorBy = {
  colorByField: "lineage",
  colorByOptions: ["lineage", "country", "date", "genotype", "None"],
  setColorByField: fn(),
  getNodeColorField: (node: any) => node.lineage,
  colorByGene: "S",
  colorByPosition: 484,
  setColorByGene: fn(),
  setColorByPosition: fn(),
};

const mockSelectedDetails = {
  nodeDetails: {
    node_id: 12345,
    parent_id: 123,
    name: "hCoV-19/England/ABCD/2020",
    country: "UK",
    date: "2020-03-15",
    lineage: "Alpha",
    clade: "20I",
    num_tips: 150,
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
    ],
    acknowledgements: {
      authors: "Smith J, Johnson A, Williams B",
    },
  },
  getNodeDetails: fn(),
  clearNodeDetails: fn(),
};

const mockSettings = {
  displaySearchesAsPoints: true,
  setDisplaySearchesAsPoints: fn(),
  treenomeEnabled: false,
  setTreenomeEnabled: fn(),
  filterMutations: (mutations: any[]) => mutations.filter((m: any) => m.type !== "nt"),
  miniMutationsMenu: () => <div>Mutations Menu</div>,
};

const mockBackend = {
  type: "server",
  backend_url: "https://api.taxonium.org",
  getTipAtts: (nodeId: any, key: any, callback: any) => {
    setTimeout(() => {
      callback(null, ["Sample1", "Sample2", "Sample3"]);
    }, 500);
  },
  getNextstrainJson: fn(),
  getNextstrainJsonUrl: () => "https://api.taxonium.org/nextstrain_json/12345",
};

export const Default = {
  args: {
    search: mockSearch,
    colorBy: mockColorBy,
    config: mockConfig,
    selectedDetails: { ...mockSelectedDetails, nodeDetails: null },
    overlayContent: true,
    setAboutEnabled: fn(),
    colorHook: mockColorHook,
    xType: "x_dist",
    setxType: fn(),
    settings: mockSettings,
    backend: mockBackend,
    className: "w-96 h-[600px] bg-white",
    treenomeState: { genome: "" },
    view: {},
    perNodeFunctions: {
      getCovSpectrumQuery: () => "https://covspectrum.org/explore/...",
    },
    toggleSidebar: fn(),
  },
};

export const WithSelectedNode = {
  args: {
    ...Default.args,
    selectedDetails: mockSelectedDetails,
  },
};

export const WithGenomeColoring = {
  args: {
    ...Default.args,
    colorBy: {
      ...mockColorBy,
      colorByField: "genotype",
      getNodeColorField: () => "G",
    },
  },
};

export const WithTreenomeEnabled = {
  args: {
    ...Default.args,
    treenomeState: { genome: "ACTGACTGACTG" },
    settings: {
      ...mockSettings,
      treenomeEnabled: true,
    },
  },
};
