import { fn } from "@storybook/test";
import SnapshotButton from "./SnapshotButton";
import type { DeckSize } from "../types/common";

export default {
  title: "Taxonium/SnapshotButton",
  component: SnapshotButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const Default = {
  args: {
    svgFunction: fn(),
    pixelFunction: fn(),
    deckSize: { width: 800, height: 600 },
  },
};

// Note: The dialog functionality will work in Storybook but the actual
// snapshot functionality depends on the implementation of svgFunction and pixelFunction
export const WithFunctionalHandlers = {
  args: {
    svgFunction: (deckSize: DeckSize) => {
      // In a real environment, this would trigger SVG download
      alert("SVG download would start now (simulated in Storybook)");
    },
    pixelFunction: () => {
      // In a real environment, this would trigger PNG download
      alert("PNG download would start now (simulated in Storybook)");
    },
    deckSize: { width: 1024, height: 768 },
  },
};
