import type React from "react";
import type { Config } from "./backend";
import type { PrettyStroke } from "./settings";

/**
 * Unified interface that merges Config (dataset metadata) with Settings (user preferences).
 *
 * This allows the config to provide default values for settings, while still allowing
 * settings to be:
 * - Loaded from backend/file/configDict
 * - Overridden by query parameters
 * - Updated via UI interactions
 *
 * Priority order (lowest to highest):
 * 1. Hardcoded defaults
 * 2. Config from backend
 * 3. Config from external file
 * 4. Config from configDict
 * 5. Query string parameters
 * 6. UI changes (via setters)
 */
export interface ConfiguredSettings extends Config {
  // ===== Config Properties (Dataset Metadata - Immutable) =====
  // These are inherited from Config interface
  // title, source, num_nodes, rootId, rootMutations, genes, mutations, etc.

  // ===== Settings Properties (User Preferences - Mutable) =====

  // Display toggles
  minimapEnabled: boolean;
  toggleMinimapEnabled: () => void;

  treenomeEnabled: boolean;
  setTreenomeEnabled: (value: boolean) => void;

  displayTextForInternalNodes: boolean;
  setDisplayTextForInternalNodes: (v: boolean) => void;

  displayPointsForInternalNodes: boolean;
  setDisplayPointsForInternalNodes: (v: boolean) => void;

  displaySearchesAsPoints: boolean;
  setDisplaySearchesAsPoints: (v: boolean) => void;

  // Mutation settings
  mutationTypesEnabled: Record<string, boolean>;
  filterMutations: (mutations: any[]) => any[];
  setMutationTypeEnabled: (key: string, enabled: boolean) => void;
  miniMutationsMenu: () => React.ReactNode;

  // Visual appearance
  nodeSize: number;
  setNodeSize: (size: number) => void;

  opacity: number;
  setOpacity: (value: number) => void;

  prettyStroke: PrettyStroke;
  setPrettyStroke: (stroke: PrettyStroke) => void;

  // Colors
  terminalNodeLabelColor: number[];
  setTerminalNodeLabelColor: (color: number[]) => void;

  lineColor: number[];
  setLineColor: (color: number[]) => void;

  cladeLabelColor: number[];
  setCladeLabelColor: (color: number[]) => void;

  // Text/label settings
  thresholdForDisplayingText: number;
  setThresholdForDisplayingText: (v: number) => void;

  maxCladeTexts: number;
  setMaxCladeTexts: (v: number) => void;

  // Search settings
  searchPointSize: number;
  setSearchPointSize: (v: number) => void;

  // Special properties
  isCov2Tree: boolean;
  chromosomeName: string;
  setChromosomeName: (name: string) => void;
}

/**
 * Default values for settings.
 * These can be overridden by config, query params, or UI.
 */
export const DEFAULT_SETTINGS = {
  minimapEnabled: true,
  treenomeEnabled: false,
  displayTextForInternalNodes: false,
  displayPointsForInternalNodes: false,
  displaySearchesAsPoints: false,
  nodeSize: 3,
  opacity: 0.6,
  prettyStroke: {
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  },
  terminalNodeLabelColor: [180, 180, 180],
  lineColor: [150, 150, 150],
  cladeLabelColor: [100, 100, 100],
  thresholdForDisplayingText: 2.9,
  maxCladeTexts: 10,
  searchPointSize: 3,
  chromosomeName: "chromosome",
  isCov2Tree: false,
  mutationTypesEnabled: { aa: true, nt: true },
} as const;
