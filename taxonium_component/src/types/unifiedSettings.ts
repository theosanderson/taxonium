import type React from "react";
import type { Node, Mutation } from "./node";
import type { ColorRamps } from "./common";
import type { SearchType } from "./backend";

export interface PrettyStroke {
  enabled: boolean;
  color: number[];
  width: number;
}

/**
 * Unified settings that merges the previous Settings and Config types.
 * This provides a single source of truth for all application configuration
 * and user preferences.
 *
 * Settings are loaded in priority order:
 * 1. Built-in defaults (lowest priority)
 * 2. Backend config (async fetch)
 * 3. Config file from URL (configUrl)
 * 4. Config dict prop (configDict)
 * 5. Query parameters (URL)
 * 6. UI modifications (highest priority)
 */
export interface UnifiedSettings {
  // ============================================
  // IMMUTABLE - From backend/config, not modifiable by UI
  // ============================================

  /** Title of the tree/dataset */
  title?: string;

  /** Source information */
  source?: string;

  /** Total number of nodes in the tree */
  num_nodes: number;

  /** Initial x position for the view */
  initial_x?: number;

  /** Initial y position for the view */
  initial_y?: number;

  /** Initial zoom level */
  initial_zoom?: number;

  /**
   * When useHydratedMutations is false this array contains indices into
   * the mutations array. When true it contains Mutation objects.
   */
  rootMutations: Array<Mutation | number>;

  /** ID of the root node */
  rootId: string | number;

  /** List of gene names */
  genes?: string[];

  /** List of mutations */
  mutations?: Mutation[];

  /** Whether mutations are hydrated objects or indices */
  useHydratedMutations?: boolean;

  /** Color ramps for visualization */
  colorRamps?: ColorRamps;

  /** ColorBy configuration */
  colorBy?: {
    colorByOptions: string[];
  };

  /** Available search types */
  search_types?: SearchType[];

  /** Overlay content to display */
  overlay?: React.ReactNode;

  /** Whether namespace download is enabled */
  enable_ns_download?: boolean;

  // ============================================
  // PERSISTED - Saved to URL query parameters
  // ============================================

  /** Which mutation types are enabled for display */
  mutationTypesEnabled: Record<string, boolean>;
  setMutationTypeEnabled: (key: string, enabled: boolean) => void;

  /** Whether treenome browser is enabled */
  treenomeEnabled: boolean;
  setTreenomeEnabled: (value: boolean) => void;

  // ============================================
  // EPHEMERAL - Session-only UI preferences
  // ============================================

  /** Whether minimap is enabled */
  minimapEnabled: boolean;
  toggleMinimapEnabled: () => void;

  /** Opacity of tree elements */
  opacity: number;
  setOpacity: (value: number) => void;

  /** Size of nodes */
  nodeSize: number;
  setNodeSize: (size: number) => void;

  /** Color of lines in the tree */
  lineColor: number[];
  setLineColor: (color: number[]) => void;

  /** Color of terminal node labels */
  terminalNodeLabelColor: number[];
  setTerminalNodeLabelColor: (color: number[]) => void;

  /** Color of clade labels */
  cladeLabelColor: number[];
  setCladeLabelColor: (color: number[]) => void;

  /** Whether to display text for internal nodes */
  displayTextForInternalNodes: boolean;
  setDisplayTextForInternalNodes: (v: boolean) => void;

  /** Whether to display points for internal nodes */
  displayPointsForInternalNodes: boolean;
  setDisplayPointsForInternalNodes: (v: boolean) => void;

  /** Threshold for displaying text */
  thresholdForDisplayingText: number;
  setThresholdForDisplayingText: (v: number) => void;

  /** Whether to display searches as points */
  displaySearchesAsPoints: boolean;
  setDisplaySearchesAsPoints: (v: boolean) => void;

  /** Size of search points */
  searchPointSize: number;
  setSearchPointSize: (v: number) => void;

  /** Maximum number of clade texts to display */
  maxCladeTexts: number;
  setMaxCladeTexts: (v: number) => void;

  /** Pretty stroke configuration */
  prettyStroke: PrettyStroke;
  setPrettyStroke: (stroke: PrettyStroke) => void;

  // ============================================
  // COMPUTED - Derived from environment/context
  // ============================================

  /** Whether this is a COV2 tree (detected from URL) */
  isCov2Tree: boolean;

  /** Name of the chromosome */
  chromosomeName: string;
  setChromosomeName: (name: string) => void;

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /** Filter mutations based on enabled types */
  filterMutations: (mutations: any[]) => any[];

  /** Render mini mutations menu component */
  miniMutationsMenu: () => React.ReactNode;

  /** Whether settings are still loading from backend */
  isLoading: boolean;

  /** Initial viewport position to apply to view after config loads */
  initialViewport?: {
    target: [number, number];
  };

  // Allow additional config properties
  [key: string]: unknown;
}

/**
 * Default values for settings that can be overridden by config
 */
export const DEFAULT_SETTINGS = {
  // Immutable defaults
  title: "loading",
  source: "",
  num_nodes: 0,
  rootMutations: [],
  rootId: "",

  // Persisted defaults
  mutationTypesEnabled: {
    aa: true,
    nt: true,
    del: true,
    ins: true,
  },
  treenomeEnabled: false,

  // Ephemeral defaults
  minimapEnabled: true,
  opacity: 0.6,
  nodeSize: 3,
  lineColor: [150, 150, 150],
  terminalNodeLabelColor: [180, 180, 180],
  cladeLabelColor: [100, 100, 100],
  displayTextForInternalNodes: false,
  displayPointsForInternalNodes: false,
  thresholdForDisplayingText: 2.9,
  displaySearchesAsPoints: false,
  searchPointSize: 3,
  maxCladeTexts: 10,
  prettyStroke: {
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  },

  // Computed defaults
  isCov2Tree: false,
  chromosomeName: "chromosome",

  isLoading: true,
};
