import TreenomeMutationHoverTip from "./TreenomeMutationHoverTip";

export default {
  title: "Taxonium/TreenomeMutationHoverTip",
  component: TreenomeMutationHoverTip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// Mock reference information
const mockReferenceInfo = {
  aa: {
    "S:484": "E",
    "N:203": "R",
    "ORF1a:3606": "L",
  },
  nt: {
    23063: "A",
    28881: "G",
    11083: "G",
  },
};

// Base props for all stories
const baseProps = {
  colorHook: {
    toRGBCSS: (value: unknown) => "rgb(128, 128, 128)",
  },
  colorBy: {
    colorByField: "lineage",
  },
  config: {},
  treenomeReferenceInfo: mockReferenceInfo,
};

export const AminoAcidMutation = {
  args: {
    ...baseProps,
    hoverInfo: {
      x: 100,
      y: 100,
      object: {
        m: {
          type: "aa",
          gene: "S",
          residue_pos: 484,
          new_residue: "K",
        },
      },
    },
  },
};

export const NucleotideMutation = {
  args: {
    ...baseProps,
    hoverInfo: {
      x: 100,
      y: 100,
      object: {
        m: {
          type: "nt",
          residue_pos: 23063,
          new_residue: "T",
        },
      },
    },
  },
};

export const NoHoverInfo = {
  args: {
    ...baseProps,
    hoverInfo: null,
  },
};

export const NoMutation = {
  args: {
    ...baseProps,
    hoverInfo: {
      x: 100,
      y: 100,
      object: {},
    },
  },
};

export const ReferenceMutation = {
  args: {
    ...baseProps,
    hoverInfo: {
      x: 100,
      y: 100,
      object: {
        m: {
          type: "aa",
          gene: "S",
          residue_pos: 484,
          new_residue: "E", // Same as reference, should render null
        },
      },
    },
  },
};
