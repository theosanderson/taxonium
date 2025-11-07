import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import getDefaultQuery from "../utils/getDefaultQuery";
import type { Settings, PrettyStroke } from "../types/settings";
import type { Backend, Config } from "../types/backend";
import type { Query } from "../types/query";
const default_query = getDefaultQuery();

// Define default values for settings
const DEFAULT_SETTINGS = {
  minimapEnabled: true,
  displayTextForInternalNodes: false,
  thresholdForDisplayingText: 2.9,
  displaySearchesAsPoints: false,
  searchPointSize: 3,
  opacity: 0.6,
  nodeSize: 3,
  terminalNodeLabelColor: [180, 180, 180] as number[],
  lineColor: [150, 150, 150] as number[],
  cladeLabelColor: [100, 100, 100] as number[],
  displayPointsForInternalNodes: false,
  maxCladeTexts: 10,
  chromosomeName: "chromosome",
  isCov2Tree: false,
  prettyStroke: {
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  } as PrettyStroke,
};

interface UseConfigSettingsProps {
  backend: Backend;
  setOverlayContent: (content: ReactNode) => void;
  onSetTitle: ((title: string) => void) | undefined;
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
  configDict?: any;
  configUrl?: string;
}

interface ConfigSettings {
  config: Config;
  settings: Settings;
}

export const useConfigSettings = ({
  backend,
  setOverlayContent,
  onSetTitle,
  query,
  updateQuery,
  configDict = {},
  configUrl,
}: UseConfigSettingsProps): ConfigSettings => {
  // Initialize config with loading state
  const [config, setConfig] = useState<Config>({
    title: "loading",
    source: "",
    num_nodes: 0,
    rootMutations: [],
    rootId: "",
  });

  // Initialize settings with defaults (will be overridden by config if provided)
  const [settingsState, setSettingsState] = useState({
    minimapEnabled: DEFAULT_SETTINGS.minimapEnabled,
    displayTextForInternalNodes: DEFAULT_SETTINGS.displayTextForInternalNodes,
    thresholdForDisplayingText: DEFAULT_SETTINGS.thresholdForDisplayingText,
    displaySearchesAsPoints: DEFAULT_SETTINGS.displaySearchesAsPoints,
    searchPointSize: DEFAULT_SETTINGS.searchPointSize,
    opacity: DEFAULT_SETTINGS.opacity,
    nodeSize: DEFAULT_SETTINGS.nodeSize,
    terminalNodeLabelColor: DEFAULT_SETTINGS.terminalNodeLabelColor,
    lineColor: DEFAULT_SETTINGS.lineColor,
    cladeLabelColor: DEFAULT_SETTINGS.cladeLabelColor,
    displayPointsForInternalNodes: DEFAULT_SETTINGS.displayPointsForInternalNodes,
    maxCladeTexts: DEFAULT_SETTINGS.maxCladeTexts,
    chromosomeName: DEFAULT_SETTINGS.chromosomeName,
    isCov2Tree: DEFAULT_SETTINGS.isCov2Tree,
    prettyStroke: DEFAULT_SETTINGS.prettyStroke,
  });

  // Load and merge config from all sources
  useEffect(() => {
    backend.getConfig((results) => {
      let fromFile = {};

      function afterPossibleGet() {
        // Merge config from query
        if (query.config) {
          const unpacked = JSON.parse(query.config);
          delete unpacked.validate_SID;
          Object.assign(results, unpacked);
        }

        // Merge config from file
        Object.assign(results, fromFile);

        // Merge configDict (highest priority for config)
        Object.assign(results, configDict);

        // Extract settings defaults from config if provided
        const settingsFromConfig: Partial<typeof settingsState> = {};

        if (results.minimapEnabled !== undefined) {
          settingsFromConfig.minimapEnabled = results.minimapEnabled as boolean;
        }
        if (results.displayTextForInternalNodes !== undefined) {
          settingsFromConfig.displayTextForInternalNodes = results.displayTextForInternalNodes as boolean;
        }
        if (results.thresholdForDisplayingText !== undefined) {
          settingsFromConfig.thresholdForDisplayingText = results.thresholdForDisplayingText as number;
        }
        if (results.displaySearchesAsPoints !== undefined) {
          settingsFromConfig.displaySearchesAsPoints = results.displaySearchesAsPoints as boolean;
        }
        if (results.searchPointSize !== undefined) {
          settingsFromConfig.searchPointSize = results.searchPointSize as number;
        }
        if (results.opacity !== undefined) {
          settingsFromConfig.opacity = results.opacity as number;
        }
        if (results.nodeSize !== undefined) {
          settingsFromConfig.nodeSize = results.nodeSize as number;
        }
        if (results.terminalNodeLabelColor !== undefined) {
          settingsFromConfig.terminalNodeLabelColor = results.terminalNodeLabelColor as number[];
        }
        if (results.lineColor !== undefined) {
          settingsFromConfig.lineColor = results.lineColor as number[];
        }
        if (results.cladeLabelColor !== undefined) {
          settingsFromConfig.cladeLabelColor = results.cladeLabelColor as number[];
        }
        if (results.displayPointsForInternalNodes !== undefined) {
          settingsFromConfig.displayPointsForInternalNodes = results.displayPointsForInternalNodes as boolean;
        }
        if (results.maxCladeTexts !== undefined) {
          settingsFromConfig.maxCladeTexts = results.maxCladeTexts as number;
        }
        if (results.prettyStroke !== undefined) {
          settingsFromConfig.prettyStroke = results.prettyStroke as PrettyStroke;
        }

        // Update settings with config defaults
        setSettingsState((prev) => ({ ...prev, ...settingsFromConfig }));

        // Set config
        setConfig(results);
        backend.setStatusMessage({ message: "Connecting" });

        // Handle title and overlay
        if (results.title && onSetTitle) {
          onSetTitle(results.title);
        }
        if (results.overlay) {
          setOverlayContent(results.overlay);
        }
      }

      // Load config from URL if provided
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

  // Detect special environments (cov2tree, etc.)
  useEffect(() => {
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setSettingsState((prev) => ({
        ...prev,
        isCov2Tree: true,
        chromosomeName: "NC_045512v2",
      }));
    }
  }, []);

  // Mutation types enabled (from query)
  const mutationTypesEnabled = useMemo(() => {
    if (!query.mutationTypesEnabled) {
      return JSON.parse(default_query.mutationTypesEnabled as string);
    }
    return JSON.parse(query.mutationTypesEnabled as string);
  }, [query.mutationTypesEnabled]);

  // Treenome enabled (from query)
  const treenomeEnabled = useMemo(() => {
    if (!query.treenomeEnabled) {
      return false;
    }
    return JSON.parse(query.treenomeEnabled as string);
  }, [query.treenomeEnabled]);

  // Settings setters
  const setMinimapEnabled = useCallback((value: boolean) => {
    setSettingsState((prev) => ({ ...prev, minimapEnabled: value }));
  }, []);

  const toggleMinimapEnabled = useCallback(() => {
    setSettingsState((prev) => ({ ...prev, minimapEnabled: !prev.minimapEnabled }));
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

  const setDisplayTextForInternalNodes = useCallback((value: boolean) => {
    setSettingsState((prev) => ({ ...prev, displayTextForInternalNodes: value }));
  }, []);

  const setDisplayPointsForInternalNodes = useCallback((value: boolean) => {
    setSettingsState((prev) => ({ ...prev, displayPointsForInternalNodes: value }));
  }, []);

  const setThresholdForDisplayingText = useCallback((value: number) => {
    setSettingsState((prev) => ({ ...prev, thresholdForDisplayingText: value }));
  }, []);

  const setMaxCladeTexts = useCallback((value: number) => {
    setSettingsState((prev) => ({ ...prev, maxCladeTexts: value }));
  }, []);

  const setChromosomeName = useCallback((value: string) => {
    setSettingsState((prev) => ({ ...prev, chromosomeName: value }));
  }, []);

  const setDisplaySearchesAsPoints = useCallback((value: boolean) => {
    setSettingsState((prev) => ({ ...prev, displaySearchesAsPoints: value }));
  }, []);

  const setSearchPointSize = useCallback((value: number) => {
    setSettingsState((prev) => ({ ...prev, searchPointSize: value }));
  }, []);

  const setTerminalNodeLabelColor = useCallback((value: number[]) => {
    setSettingsState((prev) => ({ ...prev, terminalNodeLabelColor: value }));
  }, []);

  const setLineColor = useCallback((value: number[]) => {
    setSettingsState((prev) => ({ ...prev, lineColor: value }));
  }, []);

  const setCladeLabelColor = useCallback((value: number[]) => {
    setSettingsState((prev) => ({ ...prev, cladeLabelColor: value }));
  }, []);

  const setNodeSize = useCallback((value: number) => {
    setSettingsState((prev) => ({ ...prev, nodeSize: value }));
  }, []);

  const setPrettyStroke = useCallback((value: PrettyStroke) => {
    setSettingsState((prev) => ({ ...prev, prettyStroke: value }));
  }, []);

  const setOpacity = useCallback((value: number) => {
    setSettingsState((prev) => ({ ...prev, opacity: value }));
  }, []);

  // Mini mutations menu component
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

  // Build settings object
  const settings: Settings = {
    minimapEnabled: settingsState.minimapEnabled,
    treenomeEnabled,
    setTreenomeEnabled,
    toggleMinimapEnabled,
    mutationTypesEnabled,
    filterMutations,
    setMutationTypeEnabled,
    displayTextForInternalNodes: settingsState.displayTextForInternalNodes,
    setDisplayTextForInternalNodes,
    displayPointsForInternalNodes: settingsState.displayPointsForInternalNodes,
    setDisplayPointsForInternalNodes,
    thresholdForDisplayingText: settingsState.thresholdForDisplayingText,
    setThresholdForDisplayingText,
    maxCladeTexts: settingsState.maxCladeTexts,
    setMaxCladeTexts,
    miniMutationsMenu,
    isCov2Tree: settingsState.isCov2Tree,
    chromosomeName: settingsState.chromosomeName,
    setChromosomeName,
    displaySearchesAsPoints: settingsState.displaySearchesAsPoints,
    setDisplaySearchesAsPoints,
    searchPointSize: settingsState.searchPointSize,
    setSearchPointSize,
    terminalNodeLabelColor: settingsState.terminalNodeLabelColor,
    setTerminalNodeLabelColor,
    lineColor: settingsState.lineColor,
    setLineColor,
    cladeLabelColor: settingsState.cladeLabelColor,
    setCladeLabelColor,
    nodeSize: settingsState.nodeSize,
    setNodeSize,
    prettyStroke: settingsState.prettyStroke,
    setPrettyStroke,
    opacity: settingsState.opacity,
    setOpacity,
  };

  return {
    config,
    settings,
  };
};
