import { fn } from "@storybook/test";
import SearchItem from "./SearchItem";
import {
  SearchMethod,
  NumberMethod,
  BooleanMethod,
} from "../types/search";

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
      method: SearchMethod.TEXT_MATCH,
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
      method: SearchMethod.TEXT_EXACT,
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
      method: SearchMethod.TEXT_PER_LINE,
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
      method: SearchMethod.MUTATION,
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
      method: SearchMethod.GENOTYPE,
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
      method: SearchMethod.REVERTANT,
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
      method: SearchMethod.NUMBER,
      number_method: NumberMethod.GT,
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
      boolean_method: BooleanMethod.AND,
      subspecs: [
        {
          type: "text",
          method: SearchMethod.TEXT_MATCH,
          text: "UK",
          controls: true,
        },
        {
          type: "mutation",
          method: SearchMethod.MUTATION,
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
