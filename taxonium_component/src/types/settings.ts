import type React from "react";

export interface PrettyStroke {
  enabled: boolean;
  color: number[];
  width: number;
}

/**
 * Initial values that can be provided to useSettings from config/configDict.
 * All properties are optional - if not provided, defaults will be used.
 * These can be set in a config file loaded from URL or passed via configDict prop.
 */
export interface InitialSettingsValues {
  minimapEnabled?: boolean;
  displayTextForInternalNodes?: boolean;
  thresholdForDisplayingText?: number;
  displaySearchesAsPoints?: boolean;
  searchPointSize?: number;
  opacity?: number;
  prettyStroke?: PrettyStroke;
  terminalNodeLabelColor?: number[];
  lineColor?: number[];
  nodeSize?: number;
  cladeLabelColor?: number[];
  displayPointsForInternalNodes?: boolean;
  chromosomeName?: string;
  maxCladeTexts?: number;
  isCov2Tree?: boolean;
}

export interface Settings {
  minimapEnabled: boolean;
  treenomeEnabled: boolean;
  setTreenomeEnabled: (value: boolean) => void;
  toggleMinimapEnabled: () => void;
  mutationTypesEnabled: Record<string, boolean>;
  filterMutations: (mutations: any[]) => any[];
  setMutationTypeEnabled: (key: string, enabled: boolean) => void;
  displayTextForInternalNodes: boolean;
  setDisplayTextForInternalNodes: (v: boolean) => void;
  displayPointsForInternalNodes: boolean;
  setDisplayPointsForInternalNodes: (v: boolean) => void;
  thresholdForDisplayingText: number;
  setThresholdForDisplayingText: (v: number) => void;
  maxCladeTexts: number;
  setMaxCladeTexts: (v: number) => void;
  miniMutationsMenu: () => React.ReactNode;
  isCov2Tree: boolean;
  chromosomeName: string;
  setChromosomeName: (name: string) => void;
  displaySearchesAsPoints: boolean;
  setDisplaySearchesAsPoints: (v: boolean) => void;
  searchPointSize: number;
  setSearchPointSize: (v: number) => void;
  terminalNodeLabelColor: number[];
  setTerminalNodeLabelColor: (color: number[]) => void;
  lineColor: number[];
  setLineColor: (color: number[]) => void;
  cladeLabelColor: number[];
  setCladeLabelColor: (color: number[]) => void;
  nodeSize: number;
  setNodeSize: (size: number) => void;
  prettyStroke: PrettyStroke;
  setPrettyStroke: (stroke: PrettyStroke) => void;
  opacity: number;
  setOpacity: (value: number) => void;
}

