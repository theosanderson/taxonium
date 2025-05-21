import { fn } from "@storybook/test";
import DeckSettingsModal from "./DeckSettingsModal";
import type { Settings } from "../types/settings";

export default {
  title: "Taxonium/DeckSettingsModal",
  component: DeckSettingsModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const Default = {
  args: {
    deckSettingsOpen: true,
    setDeckSettingsOpen: fn(),
    noneColor: "#CCCCCC",
    setNoneColor: fn(),
    settings: {
      minimapEnabled: true,
      toggleMinimapEnabled: fn(),
      displayTextForInternalNodes: false,
      setDisplayTextForInternalNodes: fn(),
      displayPointsForInternalNodes: true,
      setDisplayPointsForInternalNodes: fn(),
      thresholdForDisplayingText: 1.5,
      setThresholdForDisplayingText: fn(),
      maxCladeTexts: 1000,
      setMaxCladeTexts: fn(),
      nodeSize: 3,
      setNodeSize: fn(),
      opacity: 0.8,
      setOpacity: fn(),
      prettyStroke: {
        enabled: false,
        color: "#000000",
        width: 0.5,
      },
      setPrettyStroke: fn(),
      displaySearchesAsPoints: true,
      setDisplaySearchesAsPoints: fn(),
      searchPointSize: 5,
      setSearchPointSize: fn(),
      terminalNodeLabelColor: "#000000",
      setTerminalNodeLabelColor: fn(),
      lineColor: "#555555",
      setLineColor: fn(),
      cladeLabelColor: "#333333",
      setCladeLabelColor: fn(),
      mutationTypesEnabled: {
        aa: true,
        nt: false,
      },
      setMutationTypeEnabled: fn(),
    } as unknown as Settings,
  },
};

export const WithPrettyStrokeEnabled = {
  args: {
    ...Default.args,
    settings: {
      ...Default.args.settings,
      prettyStroke: {
        enabled: true,
        color: "#3366FF",
        width: 1.2,
      },
    } as unknown as Settings,
  },
};

export const ModalClosed = {
  args: {
    ...Default.args,
    deckSettingsOpen: false,
  },
};
