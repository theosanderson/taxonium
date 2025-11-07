import { useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import getDefaultQuery from "../utils/getDefaultQuery";
import type { ConfigSettings, ConfigSettingsData } from "../types/configSettings";
import type { Query } from "../types/query";
import type { Backend } from "../types/backend";

const default_query = getDefaultQuery();

/**
 * Default values for all configurable settings.
 * These can be overridden by backend config, query.config, fromFile, or configDict.
 */
const DEFAULT_CONFIG_SETTINGS: ConfigSettingsData = {
  // Config defaults
  title: "loading",
  source: "",
  num_nodes: 0,
  rootMutations: [],
  rootId: "",

  // Settings defaults
  minimapEnabled: true,
  displayTextForInternalNodes: false,
  displayPointsForInternalNodes: false,
  thresholdForDisplayingText: 2.9,
  displaySearchesAsPoints: false,
  searchPointSize: 3,
  opacity: 0.6,
  prettyStroke: {
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  },
  terminalNodeLabelColor: [180, 180, 180],
  lineColor: [150, 150, 150],
  nodeSize: 3,
  cladeLabelColor: [100, 100, 100],
  maxCladeTexts: 10,
  chromosomeName: "chromosome",
  isCov2Tree: false,
};

interface UseConfigSettingsProps {
  backend: Backend;
  setOverlayContent: (content: ReactNode) => void;
  onSetTitle: ((title: string) => void) | undefined;
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
  configDict: any;
  configUrl: string | undefined;
  onConfigLoaded?: (config: ConfigSettingsData) => void;
}

export const useConfigSettings = ({
  backend,
  setOverlayContent,
  onSetTitle,
  query,
  updateQuery,
  configDict,
  configUrl,
  onConfigLoaded,
}: UseConfigSettingsProps): ConfigSettings => {
  // Store the merged config data
  const [configData, setConfigData] = useState<ConfigSettingsData>(DEFAULT_CONFIG_SETTINGS);

  // Initialize isCov2Tree based on URL
  useEffect(() => {
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setConfigData((prev) => ({
        ...prev,
        isCov2Tree: true,
        chromosomeName: "NC_045512v2",
      }));
    }
  }, []);

  // Load and merge configuration from all sources
  useEffect(() => {
    backend.getConfig((backendConfig) => {
      let fromFile = {};

      function afterPossibleGet() {
        // Start with defaults
        let mergedConfig: ConfigSettingsData = { ...DEFAULT_CONFIG_SETTINGS };

        // Merge backend config
        Object.assign(mergedConfig, backendConfig);

        // Merge query.config
        if (query.config) {
          const unpacked = JSON.parse(query.config);
          delete unpacked.validate_SID;
          Object.assign(mergedConfig, unpacked);
        }

        // Merge config from file
        Object.assign(mergedConfig, fromFile);

        // Merge configDict (highest priority)
        Object.assign(mergedConfig, configDict);

        // Set the merged config
        setConfigData(mergedConfig);

        if (mergedConfig.title && onSetTitle) {
          onSetTitle(mergedConfig.title);
        }

        backend.setStatusMessage({ message: "Connecting" });

        if (mergedConfig.overlay) {
          setOverlayContent(mergedConfig.overlay);
        }

        // Call the callback with the loaded config
        if (onConfigLoaded) {
          onConfigLoaded(mergedConfig);
        }
      }

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

  // Settings state (initialized from configData)
  const [minimapEnabled, setMinimapEnabled] = useState(
    configData.minimapEnabled ?? DEFAULT_CONFIG_SETTINGS.minimapEnabled!
  );
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] = useState(
    configData.displayTextForInternalNodes ?? DEFAULT_CONFIG_SETTINGS.displayTextForInternalNodes!
  );
  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] = useState(
    configData.displayPointsForInternalNodes ?? DEFAULT_CONFIG_SETTINGS.displayPointsForInternalNodes!
  );
  const [thresholdForDisplayingText, setThresholdForDisplayingText] = useState(
    configData.thresholdForDisplayingText ?? DEFAULT_CONFIG_SETTINGS.thresholdForDisplayingText!
  );
  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] = useState(
    configData.displaySearchesAsPoints ?? DEFAULT_CONFIG_SETTINGS.displaySearchesAsPoints!
  );
  const [searchPointSize, setSearchPointSize] = useState(
    configData.searchPointSize ?? DEFAULT_CONFIG_SETTINGS.searchPointSize!
  );
  const [opacity, setOpacity] = useState(
    configData.opacity ?? DEFAULT_CONFIG_SETTINGS.opacity!
  );
  const [prettyStroke, setPrettyStroke] = useState(
    configData.prettyStroke ?? DEFAULT_CONFIG_SETTINGS.prettyStroke!
  );
  const [terminalNodeLabelColor, setTerminalNodeLabelColor] = useState(
    configData.terminalNodeLabelColor ?? DEFAULT_CONFIG_SETTINGS.terminalNodeLabelColor!
  );
  const [lineColor, setLineColor] = useState(
    configData.lineColor ?? DEFAULT_CONFIG_SETTINGS.lineColor!
  );
  const [nodeSize, setNodeSize] = useState(
    configData.nodeSize ?? DEFAULT_CONFIG_SETTINGS.nodeSize!
  );
  const [cladeLabelColor, setCladeLabelColor] = useState(
    configData.cladeLabelColor ?? DEFAULT_CONFIG_SETTINGS.cladeLabelColor!
  );
  const [maxCladeTexts, setMaxCladeTexts] = useState(
    configData.maxCladeTexts ?? DEFAULT_CONFIG_SETTINGS.maxCladeTexts!
  );
  const [chromosomeName, setChromosomeName] = useState(
    configData.chromosomeName ?? DEFAULT_CONFIG_SETTINGS.chromosomeName!
  );
  const [isCov2Tree, setIsCov2Tree] = useState(
    configData.isCov2Tree ?? DEFAULT_CONFIG_SETTINGS.isCov2Tree!
  );

  // Update state when configData changes
  useEffect(() => {
    if (configData.minimapEnabled !== undefined) {
      setMinimapEnabled(configData.minimapEnabled);
    }
    if (configData.displayTextForInternalNodes !== undefined) {
      setDisplayTextForInternalNodes(configData.displayTextForInternalNodes);
    }
    if (configData.displayPointsForInternalNodes !== undefined) {
      setDisplayPointsForInternalNodes(configData.displayPointsForInternalNodes);
    }
    if (configData.thresholdForDisplayingText !== undefined) {
      setThresholdForDisplayingText(configData.thresholdForDisplayingText);
    }
    if (configData.displaySearchesAsPoints !== undefined) {
      setDisplaySearchesAsPoints(configData.displaySearchesAsPoints);
    }
    if (configData.searchPointSize !== undefined) {
      setSearchPointSize(configData.searchPointSize);
    }
    if (configData.opacity !== undefined) {
      setOpacity(configData.opacity);
    }
    if (configData.prettyStroke !== undefined) {
      setPrettyStroke(configData.prettyStroke);
    }
    if (configData.terminalNodeLabelColor !== undefined) {
      setTerminalNodeLabelColor(configData.terminalNodeLabelColor);
    }
    if (configData.lineColor !== undefined) {
      setLineColor(configData.lineColor);
    }
    if (configData.nodeSize !== undefined) {
      setNodeSize(configData.nodeSize);
    }
    if (configData.cladeLabelColor !== undefined) {
      setCladeLabelColor(configData.cladeLabelColor);
    }
    if (configData.maxCladeTexts !== undefined) {
      setMaxCladeTexts(configData.maxCladeTexts);
    }
    if (configData.chromosomeName !== undefined) {
      setChromosomeName(configData.chromosomeName);
    }
    if (configData.isCov2Tree !== undefined) {
      setIsCov2Tree(configData.isCov2Tree);
    }
  }, [configData]);

  const toggleMinimapEnabled = useCallback(() => {
    setMinimapEnabled((prev) => !prev);
  }, []);

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

  return {
    // Config data (spread all properties from configData)
    ...configData,
    // Required config properties (ensure they're not undefined)
    num_nodes: configData.num_nodes ?? 0,
    rootMutations: configData.rootMutations ?? [],
    rootId: configData.rootId ?? "",

    // Settings state values
    minimapEnabled,
    treenomeEnabled,
    displayTextForInternalNodes,
    displayPointsForInternalNodes,
    thresholdForDisplayingText,
    displaySearchesAsPoints,
    searchPointSize,
    opacity,
    prettyStroke,
    terminalNodeLabelColor,
    lineColor,
    nodeSize,
    cladeLabelColor,
    maxCladeTexts,
    chromosomeName,
    isCov2Tree,

    // Settings setters
    setTreenomeEnabled,
    toggleMinimapEnabled,
    mutationTypesEnabled,
    filterMutations,
    setMutationTypeEnabled,
    setDisplayTextForInternalNodes,
    setDisplayPointsForInternalNodes,
    setThresholdForDisplayingText,
    setMaxCladeTexts,
    miniMutationsMenu,
    setChromosomeName,
    setDisplaySearchesAsPoints,
    setSearchPointSize,
    setTerminalNodeLabelColor,
    setLineColor,
    setCladeLabelColor,
    setNodeSize,
    setPrettyStroke,
    setOpacity,
  } as ConfigSettings;
};
