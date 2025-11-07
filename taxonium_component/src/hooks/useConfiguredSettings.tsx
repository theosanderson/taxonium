import { useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import type { Backend, Config } from "../types/backend";
import type { Query } from "../types/query";
import type { ConfiguredSettings, DEFAULT_SETTINGS } from "../types/configuredSettings";
import type { PrettyStroke } from "../types/settings";
import getDefaultQuery from "../utils/getDefaultQuery";

const default_query = getDefaultQuery();

interface UseConfiguredSettingsProps {
  backend: Backend;
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
  configDict: any;
  configUrl: string | undefined;
  setOverlayContent: (content: ReactNode) => void;
  onSetTitle: ((title: string) => void) | undefined;
  onConfigLoaded?: (config: Config) => void;
}

/**
 * Unified hook that merges Config and Settings.
 *
 * This hook:
 * 1. Loads config from backend/file/configDict (dataset metadata)
 * 2. Uses config values as defaults for settings (user preferences)
 * 3. Allows query parameters to override defaults
 * 4. Allows UI to update settings via setters
 *
 * Priority order for settings values (lowest to highest):
 * 1. Hardcoded defaults (DEFAULT_SETTINGS)
 * 2. Config from backend
 * 3. Config from external file
 * 4. Config from configDict
 * 5. Query string parameters
 */
export const useConfiguredSettings = ({
  backend,
  query,
  updateQuery,
  configDict,
  configUrl,
  setOverlayContent,
  onSetTitle,
  onConfigLoaded,
}: UseConfiguredSettingsProps): ConfiguredSettings => {
  // ===== Load Config (Dataset Metadata) =====
  const [baseConfig, setBaseConfig] = useState<Config>({
    title: "loading",
    source: "",
    num_nodes: 0,
    rootMutations: [],
    rootId: "",
  });

  useEffect(() => {
    backend.getConfig((results) => {
      let fromFile = {};

      function afterPossibleGet() {
        // Merge priority: backend -> query.config -> file -> configDict
        if (query.config) {
          const unpacked = JSON.parse(query.config);
          delete unpacked.validate_SID;
          Object.assign(results, unpacked);
        }
        Object.assign(results, fromFile);
        Object.assign(results, configDict);

        if (results.title && onSetTitle) {
          onSetTitle(results.title);
        }

        setBaseConfig(results);
        backend.setStatusMessage({ message: "Connecting" });

        if (results.overlay) {
          setOverlayContent(results.overlay);
        }

        // Notify parent that config is loaded
        if (onConfigLoaded) {
          onConfigLoaded(results);
        }
      }

      // Handle configUrl assignment
      if (configUrl && !query.configUrl) {
        query.configUrl = configUrl;
      }

      if (query.configUrl) {
        fetch(query.configUrl)
          .then((response) => response.json())
          .then((data) => {
            fromFile = data;
            afterPossibleGet();
          })
          .catch((error) => {
            console.log("ERROR", error);
            afterPossibleGet();
          });
      } else {
        afterPossibleGet();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend.getConfig]);

  // ===== Helper function to get setting value with priority =====
  // Priority: query param > baseConfig > hardcoded default
  const getSetting = <T,>(
    queryKey: keyof Query,
    configKey: string,
    defaultValue: T,
    parser?: (val: any) => T
  ): T => {
    // First try query parameter
    if (query[queryKey] !== undefined && query[queryKey] !== null) {
      const queryVal = query[queryKey];
      if (parser) {
        return parser(queryVal);
      }
      return queryVal as T;
    }

    // Then try config
    if (baseConfig && baseConfig[configKey] !== undefined) {
      const configVal = baseConfig[configKey];
      if (parser) {
        return parser(configVal);
      }
      return configVal as T;
    }

    // Fall back to default
    return defaultValue;
  };

  // ===== Settings State (with defaults from config) =====

  // Display toggles
  const [minimapEnabled, setMinimapEnabled] = useState(
    getSetting("minimapEnabled", "minimapEnabled", true)
  );

  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] = useState(
    getSetting("displayTextForInternalNodes", "displayTextForInternalNodes", false)
  );

  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] = useState(
    getSetting("displayPointsForInternalNodes", "displayPointsForInternalNodes", false)
  );

  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] = useState(
    getSetting("displaySearchesAsPoints", "displaySearchesAsPoints", false)
  );

  // Visual appearance
  const [nodeSize, setNodeSize] = useState(
    getSetting("nodeSize", "nodeSize", 3, Number)
  );

  const [opacity, setOpacity] = useState(
    getSetting("opacity", "opacity", 0.6, Number)
  );

  const [prettyStroke, setPrettyStroke] = useState<PrettyStroke>(
    getSetting("prettyStroke", "prettyStroke", {
      enabled: false,
      color: [76, 87, 106],
      width: 1,
    })
  );

  // Colors
  const [terminalNodeLabelColor, setTerminalNodeLabelColor] = useState(
    getSetting("terminalNodeLabelColor", "terminalNodeLabelColor", [180, 180, 180])
  );

  const [lineColor, setLineColor] = useState(
    getSetting("lineColor", "lineColor", [150, 150, 150])
  );

  const [cladeLabelColor, setCladeLabelColor] = useState(
    getSetting("cladeLabelColor", "cladeLabelColor", [100, 100, 100])
  );

  // Text/label settings
  const [thresholdForDisplayingText, setThresholdForDisplayingText] = useState(
    getSetting("thresholdForDisplayingText", "thresholdForDisplayingText", 2.9, Number)
  );

  const [maxCladeTexts, setMaxCladeTexts] = useState(
    getSetting("maxCladeTexts", "maxCladeTexts", 10, Number)
  );

  // Search settings
  const [searchPointSize, setSearchPointSize] = useState(
    getSetting("searchPointSize", "searchPointSize", 3, Number)
  );

  // Special properties
  const [chromosomeName, setChromosomeName] = useState(
    getSetting("chromosomeName", "chromosomeName", "chromosome")
  );

  const [isCov2Tree, setIsCov2Tree] = useState(false);

  // ===== Settings from Query (persisted in URL) =====

  const mutationTypesEnabled = useMemo(() => {
    // First check config for default
    const configDefault = baseConfig?.mutationTypesEnabled;
    const defaultValue = configDefault || { aa: true, nt: true };

    if (!query.mutationTypesEnabled) {
      return JSON.parse(JSON.stringify(defaultValue));
    }
    return JSON.parse(query.mutationTypesEnabled as string);
  }, [query.mutationTypesEnabled, baseConfig]);

  const treenomeEnabled = useMemo(() => {
    // Check config for default
    if (baseConfig?.treenomeEnabled !== undefined) {
      if (!query.treenomeEnabled) {
        return Boolean(baseConfig.treenomeEnabled);
      }
    }
    if (!query.treenomeEnabled) {
      return false;
    }
    return JSON.parse(query.treenomeEnabled as string);
  }, [query.treenomeEnabled, baseConfig]);

  // ===== Callbacks and Setters =====

  const toggleMinimapEnabled = useCallback(() => {
    setMinimapEnabled((prev) => !prev);
  }, []);

  const setTreenomeEnabled = useCallback(
    (value: boolean) => {
      updateQuery({ treenomeEnabled: JSON.stringify(value) });
      toast(`Treenome Browser is now ${value ? "enabled" : "disabled"}`, {
        position: "bottom-center",
      });
    },
    [updateQuery]
  );

  const filterMutations = useCallback(
    (mutations: any[]) => {
      return mutations.filter(
        (mutation: any) => mutationTypesEnabled[mutation.type]
      );
    },
    [mutationTypesEnabled]
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

  // ===== Special Effects =====

  // Detect COV2 tree from URL
  useEffect(() => {
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setIsCov2Tree(true);
      setChromosomeName("NC_045512v2");
    }
  }, []);

  // ===== Return Unified Object =====

  return {
    // Config properties (dataset metadata - immutable)
    ...baseConfig,

    // Settings properties (user preferences - mutable)
    minimapEnabled,
    toggleMinimapEnabled,
    treenomeEnabled,
    setTreenomeEnabled,
    mutationTypesEnabled,
    filterMutations,
    setMutationTypeEnabled,
    displayTextForInternalNodes,
    setDisplayTextForInternalNodes,
    displayPointsForInternalNodes,
    setDisplayPointsForInternalNodes,
    thresholdForDisplayingText,
    setThresholdForDisplayingText,
    maxCladeTexts,
    setMaxCladeTexts,
    miniMutationsMenu,
    isCov2Tree,
    chromosomeName,
    setChromosomeName,
    displaySearchesAsPoints,
    setDisplaySearchesAsPoints,
    searchPointSize,
    setSearchPointSize,
    terminalNodeLabelColor,
    setTerminalNodeLabelColor,
    lineColor,
    setLineColor,
    cladeLabelColor,
    setCladeLabelColor,
    nodeSize,
    setNodeSize,
    prettyStroke,
    setPrettyStroke,
    opacity,
    setOpacity,
  };
};
