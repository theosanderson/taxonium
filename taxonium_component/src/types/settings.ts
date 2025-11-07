import type React from "react";
import type { Config } from "./backend";

export interface PrettyStroke {
  enabled: boolean;
  color: number[];
  width: number;
}

// Settings now includes all Config properties plus settings-specific properties
export interface Settings extends Partial<Config> {
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

