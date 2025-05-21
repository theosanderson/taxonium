import { fn } from "@storybook/test";
import Key from "./Key";

export default {
  title: "Taxonium/Key",
  component: Key,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

const mockKeyStuff = [
  { value: "Alpha", color: [200, 100, 100], count: 150 },
  { value: "Beta", color: [100, 200, 100], count: 120 },
  { value: "Gamma", color: [100, 100, 200], count: 100 },
  { value: "Delta", color: [180, 180, 100], count: 80 },
  { value: "Omicron", color: [180, 100, 180], count: 60 },
  { value: "Zeta", color: [100, 180, 180], count: 40 },
  { value: "Eta", color: [220, 120, 120], count: 30 },
  { value: "Theta", color: [120, 220, 120], count: 20 },
  { value: "Iota", color: [120, 120, 220], count: 10 },
  { value: "Kappa", color: [200, 200, 150], count: 5 },
  { value: "Lambda", color: [150, 200, 200], count: 3 }, // This will be truncated
];

export const Categorical = {
  args: {
    keyStuff: mockKeyStuff,
    colorByField: "variant",
    config: { variant: { prettyName: "Variant" } },
    setCurrentColorSettingKey: fn(),
    setColorSettingOpen: fn(),
    hoveredKey: null,
    setHoveredKey: fn(),
  },
};

export const ContinuousScale = {
  args: {
    keyStuff: mockKeyStuff,
    colorByField: "fitness",
    config: { fitness: { prettyName: "Fitness Value" } },
    setCurrentColorSettingKey: fn(),
    setColorSettingOpen: fn(),
    hoveredKey: null,
    setHoveredKey: fn(),
    colorRamps: {
      fitness: {
        scale: [
          [-1.0, "rgb(0, 0, 255)"],
          [-0.5, "rgb(100, 100, 255)"],
          [0.0, "rgb(200, 200, 200)"],
          [0.5, "rgb(255, 100, 100)"],
          [1.0, "rgb(255, 0, 0)"],
        ],
      },
    },
  },
};

export const WithGenotype = {
  args: {
    keyStuff: [
      { value: "A", color: [200, 100, 100], count: 150 },
      { value: "T", color: [100, 200, 100], count: 120 },
      { value: "G", color: [100, 100, 200], count: 100 },
      { value: "C", color: [180, 180, 100], count: 80 },
    ],
    colorByField: "genotype",
    colorByGene: "S",
    colorByPosition: "484",
    config: {},
    setCurrentColorSettingKey: fn(),
    setColorSettingOpen: fn(),
    hoveredKey: null,
    setHoveredKey: fn(),
  },
};

export const WithHoveredKey = {
  args: {
    ...Categorical.args,
    hoveredKey: "Alpha",
  },
};

export const Empty = {
  args: {
    keyStuff: [],
    colorByField: "variant",
    config: {},
    setCurrentColorSettingKey: fn(),
    setColorSettingOpen: fn(),
    hoveredKey: null,
    setHoveredKey: fn(),
  },
};
