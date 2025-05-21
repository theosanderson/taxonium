import { fn } from "@storybook/test";
import SearchTopLayerItem from "./SearchTopLayerItem";
import { SearchMethod } from "../types/search";

export default {
  title: "Taxonium/SearchTopLayerItem",
  component: SearchTopLayerItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// Mock config with search types and genes
const mockConfig = {
  search_types: [
    { name: "text", label: "Text", type: "text_match", controls: true },
    { name: "mutation", label: "Mutation", type: "mutation" },
    { name: "genotype", label: "Genotype", type: "genotype" },
    { name: "boolean", label: "Boolean", type: "boolean" },
  ],
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
};

// Base mock search object
const mockSearch = {
  searchSpec: [
    {
      key: "search1",
      type: "text",
      method: SearchMethod.TEXT_MATCH,
      text: "England",
      controls: true,
    },
    {
      key: "search2",
      type: "mutation",
      method: SearchMethod.MUTATION,
      gene: "S",
      position: 484,
      new_residue: "K",
      min_tips: 5,
    },
  ],
  searchResults: {
    search1: { result: { total_count: 150 } },
    search2: { result: { total_count: 75 } },
  },
  searchesEnabled: {
    search1: true,
    search2: false,
  },
  searchLoadingStatus: {
    search1: "done",
    search2: "done",
  },
  setSearchSpec: fn(),
  setEnabled: fn(),
  deleteTopLevelSearch: fn(),
  setZoomToSearch: fn(),
  getLineColor: () => [255, 0, 0],
};

export const TextSearch = {
  args: {
    singleSearchSpec: {
      key: "search1",
      type: "text",
      method: SearchMethod.TEXT_MATCH,
      text: "England",
      controls: true,
    },
    myKey: "search1",
    search: mockSearch,
    config: mockConfig,
  },
};

export const MutationSearch = {
  args: {
    singleSearchSpec: {
      key: "search2",
      type: "mutation",
      method: SearchMethod.MUTATION,
      gene: "S",
      position: 484,
      new_residue: "K",
      min_tips: 5,
    },
    myKey: "search2",
    search: mockSearch,
    config: mockConfig,
  },
};

export const DisabledSearch = {
  args: {
    singleSearchSpec: {
      key: "search2",
      type: "mutation",
      method: SearchMethod.MUTATION,
      gene: "S",
      position: 484,
      new_residue: "K",
      min_tips: 5,
    },
    myKey: "search2",
    search: {
      ...mockSearch,
      searchesEnabled: {
        search1: true,
        search2: false,
      },
    },
    config: mockConfig,
  },
};

export const LoadingSearch = {
  args: {
    singleSearchSpec: {
      key: "search3",
      type: "text",
      method: SearchMethod.TEXT_MATCH,
      text: "Loading example",
      controls: true,
    },
    myKey: "search3",
    search: {
      ...mockSearch,
      searchSpec: [
        ...mockSearch.searchSpec,
        {
          key: "search3",
          type: "text",
          method: SearchMethod.TEXT_MATCH,
          text: "Loading example",
          controls: true,
        },
      ],
      searchResults: {
        ...mockSearch.searchResults,
        search3: { result: null },
      },
      searchesEnabled: {
        ...mockSearch.searchesEnabled,
        search3: true,
      },
      searchLoadingStatus: {
        ...mockSearch.searchLoadingStatus,
        search3: "loading",
      },
    },
    config: mockConfig,
  },
};

export const NoResults = {
  args: {
    singleSearchSpec: {
      key: "search4",
      type: "text",
      method: SearchMethod.TEXT_MATCH,
      text: "No results example",
      controls: true,
    },
    myKey: "search4",
    search: {
      ...mockSearch,
      searchSpec: [
        ...mockSearch.searchSpec,
        {
          key: "search4",
          type: "text",
          method: SearchMethod.TEXT_MATCH,
          text: "No results example",
          controls: true,
        },
      ],
      searchResults: {
        ...mockSearch.searchResults,
        search4: { result: { total_count: 0 } },
      },
      searchesEnabled: {
        ...mockSearch.searchesEnabled,
        search4: true,
      },
      searchLoadingStatus: {
        ...mockSearch.searchLoadingStatus,
        search4: "done",
      },
    },
    config: mockConfig,
  },
};
