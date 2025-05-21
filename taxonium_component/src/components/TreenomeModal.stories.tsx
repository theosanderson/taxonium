import { fn } from "@storybook/test";
import TreenomeModal from "./TreenomeModal";

export default {
  title: "Taxonium/TreenomeModal",
  component: TreenomeModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const Default = {
  args: {
    treenomeSettingsOpen: true,
    setTreenomeSettingsOpen: fn(),
    settings: {
      chromosomeName: "NC_045512v2",
      setChromosomeName: fn(),
      isCov2Tree: true,
    },
  },
};

export const NonCovid = {
  args: {
    treenomeSettingsOpen: true,
    setTreenomeSettingsOpen: fn(),
    settings: {
      chromosomeName: "chromosome1",
      setChromosomeName: fn(),
      isCov2Tree: false,
    },
  },
};

export const Closed = {
  args: {
    treenomeSettingsOpen: false,
    setTreenomeSettingsOpen: fn(),
    settings: {
      chromosomeName: "NC_045512v2",
      setChromosomeName: fn(),
      isCov2Tree: true,
    },
  },
};

export const WithHandlers = {
  args: {
    treenomeSettingsOpen: true,
    setTreenomeSettingsOpen: (value: boolean) => {
      alert(`Modal would ${value ? "open" : "close"} (simulated in Storybook)`);
    },
    settings: {
      chromosomeName: "NC_045512v2",
      setChromosomeName: (value: string) => {
        alert(
          `Chromosome name would be set to: ${value} (simulated in Storybook)`
        );
      },
      isCov2Tree: true,
    },
  },
};
