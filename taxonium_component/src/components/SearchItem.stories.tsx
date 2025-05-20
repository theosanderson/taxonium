import { fn } from "@storybook/test";
import SearchItem from "./SearchItem";

export default {
  title: "Taxonium/SearchItem",
  component: SearchItem,
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
    { name: "date", label: "Date", type: "number" },
    { name: "revertant", label: "Revertant", type: "revertant" },
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

export const TextSearch = {
  args: {
    singleSearchSpec: {
      type: "text",
      method: "text_match",
      text: "Sample search text",
      controls: true,
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};

export const ExactTextSearch = {
  args: {
    singleSearchSpec: {
      type: "text",
      method: "text_exact",
      text: "Sample exact search",
      controls: true,
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};

export const MultiLineTextSearch = {
  args: {
    singleSearchSpec: {
      type: "text",
      method: "text_per_line",
      text: "Sample 1\nSample 2\nSample 3",
      controls: true,
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};

export const MutationSearch = {
  args: {
    singleSearchSpec: {
      type: "mutation",
      method: "mutation",
      gene: "S",
      position: 484,
      new_residue: "K",
      min_tips: 5,
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};

export const GenotypeSearch = {
  args: {
    singleSearchSpec: {
      type: "genotype",
      method: "genotype",
      gene: "S",
      position: 484,
      new_residue: "K",
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};

export const RevertantSearch = {
  args: {
    singleSearchSpec: {
      type: "revertant",
      method: "revertant",
      min_tips: 10,
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};

export const NumberSearch = {
  args: {
    singleSearchSpec: {
      type: "date",
      method: "number",
      number_method: ">",
      number: 2020,
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};

export const BooleanSearch = {
  args: {
    singleSearchSpec: {
      type: "boolean",
      boolean_method: "and",
      subspecs: [
        {
          type: "text",
          method: "text_match",
          text: "UK",
          controls: true,
        },
        {
          type: "mutation",
          method: "mutation",
          gene: "S",
          position: 484,
          new_residue: "K",
          min_tips: 5,
        },
      ],
    },
    setThisSearchSpec: fn(),
    config: mockConfig,
  },
};
