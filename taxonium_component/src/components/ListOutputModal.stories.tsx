import { fn } from "@storybook/test";
import ListOutputModal from "./ListOutputModal";

export default {
  title: "Taxonium/ListOutputModal",
  component: ListOutputModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// Mock backend function that simulates getting tip attributes
const mockBackend = {
  getTipAtts: (
    nodeId: string,
    selectedKey: string,
    callback: (err: unknown, result: string[]) => void
  ) => {
    setTimeout(() => {
      if (selectedKey === "names") {
        callback(null, [
          "Sample1",
          "Sample2",
          "Sample3",
          "Sample4",
          "Sample5",
          "Sample6",
          "Sample7",
          "Sample8",
          "Sample9",
          "Sample10",
        ]);
      } else if (selectedKey === "countries") {
        callback(null, [
          "USA",
          "UK",
          "Germany",
          "France",
          "Canada",
          "Japan",
          "Australia",
          "India",
          "Brazil",
          "Mexico",
        ]);
      } else if (selectedKey === "lineages") {
        callback(null, [
          "B.1.1.7",
          "B.1.617.2",
          "B.1.351",
          "P.1",
          "B.1.427",
          "B.1.429",
          "B.1.526",
          "B.1.525",
          "B.1.617.1",
          "B.1.617.3",
        ]);
      } else {
        callback(null, []);
      }
    }, 500);
  },
};

// Base args for all stories
const baseArgs = {
  backend: mockBackend,
  nodeId: "node123",
  possibleKeys: ["names", "countries", "lineages", "empty"],
  setListOutputModalOpen: fn(),
};

export const Open = {
  args: {
    ...baseArgs,
    listOutputModalOpen: true,
  },
};

export const Closed = {
  args: {
    ...baseArgs,
    listOutputModalOpen: false,
  },
};

export const WithData = {
  args: {
    ...baseArgs,
    listOutputModalOpen: true,
  },
  play: async ({
    canvasElement,
    args,
  }: {
    canvasElement: HTMLElement;
    args: Record<string, unknown>;
  }) => {
    // This simulates selecting a different option but won't work fully in Storybook
    // For actual testing, this component would need to be tested in context
  },
};

export const Loading = {
  args: {
    ...baseArgs,
    listOutputModalOpen: true,
    backend: {
      getTipAtts: (
        nodeId: string,
        selectedKey: string,
        callback: (err: unknown, result: string[]) => void
      ) => {
        // Never calls the callback to simulate perpetual loading state
      },
    },
  },
};

export const Empty = {
  args: {
    ...baseArgs,
    listOutputModalOpen: true,
    possibleKeys: ["empty"],
  },
};
