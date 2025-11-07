import { useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import type { UnifiedSettings, PrettyStroke } from "../types/unifiedSettings";
import { DEFAULT_SETTINGS } from "../types/unifiedSettings";
import type { Backend } from "../types/backend";
import type { Query } from "../types/query";
import type { View } from "./useView";
import getDefaultQuery from "../utils/getDefaultQuery";

const default_query = getDefaultQuery();

interface UseUnifiedSettingsProps {
  backend: Backend;
  setOverlayContent: (content: ReactNode) => void;
  onSetTitle: ((title: string) => void) | undefined;
  query: Query;
  configDict: any;
  configUrl: string | undefined;
  updateQuery: (q: Partial<Query>) => void;
}

export interface UnifiedSettingsResult extends UnifiedSettings {
  // Initial viewport to apply to view after config loads
  initialViewport?: {
    target: [number, number];
  };
}

/**
 * Unified settings hook that merges the previous useSettings and useConfig.
 *
 * This hook loads settings from multiple sources in priority order:
 * 1. Built-in defaults
 * 2. Backend config (async)
 * 3. Config file (configUrl)
 * 4. Config dict (prop)
 * 5. Query parameters
 * 6. UI modifications
 *
 * This allows config to provide predefined defaults for settings while
 * still supporting file loading, URL parameters, and UI modifications.
 */
export const useUnifiedSettings = ({
  backend,
  setOverlayContent,
  onSetTitle,
  query,
  configDict,
  configUrl,
  updateQuery,
}: UseUnifiedSettingsProps): UnifiedSettingsResult => {
  // ============================================
  // CORE STATE - Starts with defaults, then updated from config
  // ============================================

  const [isLoading, setIsLoading] = useState(true);
  const [initialViewport, setInitialViewport] = useState<{ target: [number, number] } | undefined>(undefined);

  // Immutable settings (from config)
  const [title, setTitle] = useState<string | undefined>(DEFAULT_SETTINGS.title);
  const [source, setSource] = useState<string | undefined>(DEFAULT_SETTINGS.source);
  const [num_nodes, setNumNodes] = useState(DEFAULT_SETTINGS.num_nodes);
  const [initial_x, setInitialX] = useState<number | undefined>(undefined);
  const [initial_y, setInitialY] = useState<number | undefined>(undefined);
  const [initial_zoom, setInitialZoom] = useState<number | undefined>(undefined);
  const [rootMutations, setRootMutations] = useState<any[]>(DEFAULT_SETTINGS.rootMutations);
  const [rootId, setRootId] = useState<string | number>(DEFAULT_SETTINGS.rootId);
  const [genes, setGenes] = useState<string[] | undefined>(undefined);
  const [mutations, setMutations] = useState<any[] | undefined>(undefined);
  const [useHydratedMutations, setUseHydratedMutations] = useState<boolean | undefined>(undefined);
  const [colorRamps, setColorRamps] = useState<any>(undefined);
  const [colorByConfig, setColorByConfig] = useState<any>(undefined);
  const [search_types, setSearchTypes] = useState<any[] | undefined>(undefined);
  const [overlay, setOverlay] = useState<ReactNode | undefined>(undefined);
  const [additionalConfig, setAdditionalConfig] = useState<Record<string, any>>({});

  // Ephemeral UI preferences
  const [minimapEnabled, setMinimapEnabled] = useState(DEFAULT_SETTINGS.minimapEnabled);
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] = useState(
    DEFAULT_SETTINGS.displayTextForInternalNodes
  );
  const [thresholdForDisplayingText, setThresholdForDisplayingText] = useState(
    DEFAULT_SETTINGS.thresholdForDisplayingText
  );
  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] = useState(
    DEFAULT_SETTINGS.displaySearchesAsPoints
  );
  const [searchPointSize, setSearchPointSize] = useState(DEFAULT_SETTINGS.searchPointSize);
  const [opacity, setOpacity] = useState(DEFAULT_SETTINGS.opacity);
  const [prettyStroke, setPrettyStroke] = useState<PrettyStroke>(DEFAULT_SETTINGS.prettyStroke);
  const [terminalNodeLabelColor, setTerminalNodeLabelColor] = useState(
    DEFAULT_SETTINGS.terminalNodeLabelColor
  );
  const [lineColor, setLineColor] = useState(DEFAULT_SETTINGS.lineColor);
  const [nodeSize, setNodeSize] = useState(DEFAULT_SETTINGS.nodeSize);
  const [cladeLabelColor, setCladeLabelColor] = useState(DEFAULT_SETTINGS.cladeLabelColor);
  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] = useState(
    DEFAULT_SETTINGS.displayPointsForInternalNodes
  );
  const [maxCladeTexts, setMaxCladeTexts] = useState(DEFAULT_SETTINGS.maxCladeTexts);
  const [chromosomeName, setChromosomeName] = useState(DEFAULT_SETTINGS.chromosomeName);
  const [isCov2Tree, setIsCov2Tree] = useState(DEFAULT_SETTINGS.isCov2Tree);

  // ============================================
  // PERSISTED SETTINGS - From query params
  // ============================================

  const mutationTypesEnabled = useMemo(() => {
    if (!query.mutationTypesEnabled) {
      return JSON.parse(default_query.mutationTypesEnabled as string);
    }
    return JSON.parse(query.mutationTypesEnabled as string);
  }, [query.mutationTypesEnabled]);

  const treenomeEnabled = useMemo(() => {
    if (!query.treenomeEnabled) {
      return false;
    }
    return JSON.parse(query.treenomeEnabled as string);
  }, [query.treenomeEnabled]);

  const setTreenomeEnabled = useCallback(
    (value: boolean) => {
      updateQuery({ treenomeEnabled: JSON.stringify(value) });
      toast(`Treenome Browser is now ${value ? "enabled" : "disabled"}`, {
        position: "bottom-center",
      });
    },
    [updateQuery]
  );

  const setMutationTypeEnabled = useCallback(
    (key: string, enabled: boolean) => {
      const newMutationTypesEnabled = { ...mutationTypesEnabled };
      newMutationTypesEnabled[key] = enabled;
      updateQuery({
        mutationTypesEnabled: JSON.stringify(newMutationTypesEnabled),
      });
    },
    [mutationTypesEnabled, updateQuery]
  );

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const toggleMinimapEnabled = useCallback(() => {
    setMinimapEnabled((prev) => !prev);
  }, []);

  const filterMutations = useCallback(
    (mutations: any[]) => {
      return mutations.filter(
        (mutation: any) => mutationTypesEnabled[mutation.type]
      );
    },
    [mutationTypesEnabled]
  );

  const miniMutationsMenu = useCallback(() => {
    return (
      <div className="block font-normal pt-1 mr-3">
        {Object.keys(mutationTypesEnabled).map((key) => (
          <div key={key} className="inline-block mr-3  -mb-1 -pb-1">
            <label key={key}>
              <input
                type="checkbox"
                className="mr-1 -mb-1 -pb-1"
                checked={mutationTypesEnabled[key]}
                onChange={() => {
                  const newValue = !mutationTypesEnabled[key];
                  setMutationTypeEnabled(key, newValue);
                  toast(
                    `Display of ${key.toUpperCase()} mutations is now ${
                      newValue ? "enabled" : "disabled"
                    } for hovered and selected nodes`,
                    {
                      position: "bottom-center",
                    }
                  );
                }}
              />{" "}
              {key}
            </label>
          </div>
        ))}
      </div>
    );
  }, [mutationTypesEnabled, setMutationTypeEnabled]);

  // ============================================
  // COV2 TREE DETECTION
  // ============================================

  useEffect(() => {
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setIsCov2Tree(true);
      setChromosomeName("NC_045512v2");
    }
  }, []);

  // ============================================
  // LOAD CONFIG FROM BACKEND AND OVERRIDE SOURCES
  // ============================================

  useEffect(() => {
    backend.getConfig((results) => {
      // Step 1: Start with backend results
      let finalConfig = { ...results };

      // Step 2: Override with query.config
      if (query.config) {
        const unpacked = JSON.parse(query.config);
        delete unpacked.validate_SID;
        Object.assign(finalConfig, unpacked);
      }

      // Step 3: Override with file from URL
      const loadFromUrl = async () => {
        let fromFile = {};

        // Handle configUrl prop or query param
        const effectiveConfigUrl = configUrl || query.configUrl;

        if (effectiveConfigUrl) {
          // Update query if configUrl prop was provided
          if (configUrl && !query.configUrl) {
            query.configUrl = configUrl;
          }

          try {
            const response = await fetch(effectiveConfigUrl);
            fromFile = await response.json();
            Object.assign(finalConfig, fromFile);
          } catch (error) {
            console.log("Error loading config from URL:", error);
          }
        }

        // Step 4: Override with configDict prop (highest priority)
        Object.assign(finalConfig, configDict);

        // Apply all config values to state
        applyConfig(finalConfig);
      };

      loadFromUrl();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend.getConfig]);

  // ============================================
  // APPLY CONFIG TO STATE
  // ============================================

  const applyConfig = useCallback((config: any) => {
    // Set immutable config values
    if (config.title !== undefined) {
      setTitle(config.title);
      if (onSetTitle) {
        onSetTitle(config.title);
      }
    }
    if (config.source !== undefined) setSource(config.source);
    if (config.num_nodes !== undefined) setNumNodes(config.num_nodes);
    if (config.initial_x !== undefined) setInitialX(config.initial_x);
    if (config.initial_y !== undefined) setInitialY(config.initial_y);
    if (config.initial_zoom !== undefined) setInitialZoom(config.initial_zoom);
    if (config.rootMutations !== undefined) setRootMutations(config.rootMutations);
    if (config.rootId !== undefined) setRootId(config.rootId);
    if (config.genes !== undefined) setGenes(config.genes);
    if (config.mutations !== undefined) setMutations(config.mutations);
    if (config.useHydratedMutations !== undefined) setUseHydratedMutations(config.useHydratedMutations);
    if (config.colorRamps !== undefined) setColorRamps(config.colorRamps);
    if (config.colorBy !== undefined) setColorByConfig(config.colorBy);
    if (config.search_types !== undefined) setSearchTypes(config.search_types);

    // Set ephemeral defaults from config (can be overridden by UI)
    if (config.minimapEnabled !== undefined) setMinimapEnabled(config.minimapEnabled);
    if (config.opacity !== undefined) setOpacity(config.opacity);
    if (config.nodeSize !== undefined) setNodeSize(config.nodeSize);
    if (config.lineColor !== undefined) setLineColor(config.lineColor);
    if (config.terminalNodeLabelColor !== undefined) setTerminalNodeLabelColor(config.terminalNodeLabelColor);
    if (config.cladeLabelColor !== undefined) setCladeLabelColor(config.cladeLabelColor);
    if (config.displayTextForInternalNodes !== undefined) setDisplayTextForInternalNodes(config.displayTextForInternalNodes);
    if (config.displayPointsForInternalNodes !== undefined) setDisplayPointsForInternalNodes(config.displayPointsForInternalNodes);
    if (config.thresholdForDisplayingText !== undefined) setThresholdForDisplayingText(config.thresholdForDisplayingText);
    if (config.displaySearchesAsPoints !== undefined) setDisplaySearchesAsPoints(config.displaySearchesAsPoints);
    if (config.searchPointSize !== undefined) setSearchPointSize(config.searchPointSize);
    if (config.maxCladeTexts !== undefined) setMaxCladeTexts(config.maxCladeTexts);
    if (config.prettyStroke !== undefined) setPrettyStroke(config.prettyStroke);

    // Handle overlay
    if (config.overlay) {
      setOverlay(config.overlay);
      setOverlayContent(config.overlay);
    }

    // Store any additional config properties
    const knownKeys = new Set([
      'title', 'source', 'num_nodes', 'initial_x', 'initial_y', 'initial_zoom',
      'rootMutations', 'rootId', 'genes', 'mutations', 'useHydratedMutations',
      'colorRamps', 'colorBy', 'search_types', 'overlay', 'minimapEnabled',
      'opacity', 'nodeSize', 'lineColor', 'terminalNodeLabelColor', 'cladeLabelColor',
      'displayTextForInternalNodes', 'displayPointsForInternalNodes',
      'thresholdForDisplayingText', 'displaySearchesAsPoints', 'searchPointSize',
      'maxCladeTexts', 'prettyStroke'
    ]);

    const additional: Record<string, any> = {};
    for (const key in config) {
      if (!knownKeys.has(key)) {
        additional[key] = config[key];
      }
    }
    setAdditionalConfig(additional);

    // Set initial viewport (to be applied by parent component)
    if (config.initial_x !== undefined || config.initial_y !== undefined) {
      setInitialViewport({
        target: [
          config.initial_x !== undefined ? config.initial_x : 2000,
          config.initial_y !== undefined ? config.initial_y : 1000,
        ],
      });
    }

    backend.setStatusMessage({ message: "Connecting" });
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  // ============================================
  // RETURN UNIFIED SETTINGS OBJECT
  // ============================================

  return {
    // Immutable
    title,
    source,
    num_nodes,
    initial_x,
    initial_y,
    initial_zoom,
    rootMutations,
    rootId,
    genes,
    mutations,
    useHydratedMutations,
    colorRamps,
    colorBy: colorByConfig,
    search_types,
    overlay,
    enable_ns_download: true, // Always true for now

    // Persisted
    mutationTypesEnabled,
    setMutationTypeEnabled,
    treenomeEnabled,
    setTreenomeEnabled,

    // Ephemeral
    minimapEnabled,
    toggleMinimapEnabled,
    opacity,
    setOpacity,
    nodeSize,
    setNodeSize,
    lineColor,
    setLineColor,
    terminalNodeLabelColor,
    setTerminalNodeLabelColor,
    cladeLabelColor,
    setCladeLabelColor,
    displayTextForInternalNodes,
    setDisplayTextForInternalNodes,
    displayPointsForInternalNodes,
    setDisplayPointsForInternalNodes,
    thresholdForDisplayingText,
    setThresholdForDisplayingText,
    displaySearchesAsPoints,
    setDisplaySearchesAsPoints,
    searchPointSize,
    setSearchPointSize,
    maxCladeTexts,
    setMaxCladeTexts,
    prettyStroke,
    setPrettyStroke,

    // Computed
    isCov2Tree,
    chromosomeName,
    setChromosomeName,

    // Utilities
    filterMutations,
    miniMutationsMenu,
    isLoading,
    initialViewport,

    // Additional config properties
    ...additionalConfig,
  };
};
