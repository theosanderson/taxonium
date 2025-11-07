import type React from "react";
import type { Mutation, Node } from "./node";
import type { ColorRamps } from "./common";
import type { SearchType } from "./backend";

export interface PrettyStroke {
  enabled: boolean;
  color: number[];
  width: number;
}

/**
 * Configuration and settings values that can be loaded from files or configDict.
 * These are the actual data values (without setters).
 */
export interface ConfigSettingsData {
  // ===== Config properties (from backend/files) =====
  title?: string;
  source?: string;
  num_nodes?: number;
  initial_x?: number;
  initial_y?: number;
  initial_zoom?: number;
  rootMutations?: Array<Mutation | number>;
  rootId?: string | number;
  genes?: string[];
  mutations?: Mutation[];
  useHydratedMutations?: boolean;
  colorRamps?: ColorRamps;
  colorBy?: {
    colorByOptions: string[];
  };
  search_types?: SearchType[];
  overlay?: React.ReactNode;

  // ===== Settings properties (UI preferences) =====
  minimapEnabled?: boolean;
  displayTextForInternalNodes?: boolean;
  displayPointsForInternalNodes?: boolean;
  thresholdForDisplayingText?: number;
  displaySearchesAsPoints?: boolean;
  searchPointSize?: number;
  opacity?: number;
  prettyStroke?: PrettyStroke;
  terminalNodeLabelColor?: number[];
  lineColor?: number[];
  nodeSize?: number;
  cladeLabelColor?: number[];
  maxCladeTexts?: number;
  chromosomeName?: string;
  isCov2Tree?: boolean;

  // Allow any additional properties
  [key: string]: unknown;
}

/**
 * Complete config/settings object with both values and setter functions.
 * This is what components will use.
 */
export interface ConfigSettings extends ConfigSettingsData {
  // Required config properties (not optional)
  num_nodes: number;
  rootMutations: Array<Mutation | number>;
  rootId: string | number;

  // Required settings properties (not optional)
  minimapEnabled: boolean;
  treenomeEnabled: boolean;
  displayTextForInternalNodes: boolean;
  displayPointsForInternalNodes: boolean;
  thresholdForDisplayingText: number;
  displaySearchesAsPoints: boolean;
  searchPointSize: number;
  opacity: number;
  prettyStroke: PrettyStroke;
  terminalNodeLabelColor: number[];
  lineColor: number[];
  nodeSize: number;
  cladeLabelColor: number[];
  maxCladeTexts: number;
  chromosomeName: string;
  isCov2Tree: boolean;

  // Settings setters
  setTreenomeEnabled: (value: boolean) => void;
  toggleMinimapEnabled: () => void;
  mutationTypesEnabled: Record<string, boolean>;
  filterMutations: (mutations: any[]) => any[];
  setMutationTypeEnabled: (key: string, enabled: boolean) => void;
  setDisplayTextForInternalNodes: (v: boolean) => void;
  setDisplayPointsForInternalNodes: (v: boolean) => void;
  setThresholdForDisplayingText: (v: number) => void;
  setMaxCladeTexts: (v: number) => void;
  miniMutationsMenu: () => React.ReactNode;
  setChromosomeName: (name: string) => void;
  setDisplaySearchesAsPoints: (v: boolean) => void;
  setSearchPointSize: (v: number) => void;
  setTerminalNodeLabelColor: (color: number[]) => void;
  setLineColor: (color: number[]) => void;
  setCladeLabelColor: (color: number[]) => void;
  setNodeSize: (size: number) => void;
  setPrettyStroke: (stroke: PrettyStroke) => void;
  setOpacity: (value: number) => void;
}
