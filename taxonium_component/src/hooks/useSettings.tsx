import { useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import getDefaultQuery from "../utils/getDefaultQuery";
import type { Settings, PrettyStroke } from "../types/settings";
import type { Query } from "../types/query";
import type { Backend, Config } from "../types/backend";

const default_query = getDefaultQuery();

interface UseSettingsProps {
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
  backend: Backend;
  setOverlayContent: (content: ReactNode) => void;
  onSetTitle: ((title: string) => void) | undefined;
  configDict?: any;
  configUrl?: string;
}

// Default values for all settings
const getDefaultSettings = () => ({
  // UI Settings
  minimapEnabled: true,
  displayTextForInternalNodes: false,
  thresholdForDisplayingText: 2.9,
  displaySearchesAsPoints: false,
  searchPointSize: 3,
  opacity: 0.6,
  displayPointsForInternalNodes: false,
  maxCladeTexts: 10,

  // Color Settings
  prettyStroke: {
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  } as PrettyStroke,
  terminalNodeLabelColor: [180, 180, 180],
  lineColor: [150, 150, 150],
  nodeSize: 3,
  cladeLabelColor: [100, 100, 100],

  // Tree-specific settings
  chromosomeName: "chromosome",
  isCov2Tree: false,

  // Config properties
  title: "loading",
  source: "",
  num_nodes: 0,
  rootMutations: [],
  rootId: "",
});

type MergedSettingsAndConfig = ReturnType<typeof getDefaultSettings> &
  Partial<Config> &
  Settings;

export const useSettings = ({
  query,
  updateQuery,
  backend,
  setOverlayContent,
  onSetTitle,
  configDict = {},
  configUrl,
}: UseSettingsProps): MergedSettingsAndConfig => {
  // Initialize with defaults
  const [config, setConfig] = useState<Partial<Config>>(getDefaultSettings());

  // Local state for settings (will be initialized from merged config)
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] = useState(false);
  const [thresholdForDisplayingText, setThresholdForDisplayingText] = useState(2.9);
  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] = useState(false);
  const [searchPointSize, setSearchPointSize] = useState(3);
  const [opacity, setOpacity] = useState(0.6);
  const [prettyStroke, setPrettyStroke] = useState<PrettyStroke>({
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  });
  const [terminalNodeLabelColor, setTerminalNodeLabelColor] = useState([180, 180, 180]);
  const [lineColor, setLineColor] = useState([150, 150, 150]);
  const [nodeSize, setNodeSize] = useState(3);
  const [cladeLabelColor, setCladeLabelColor] = useState([100, 100, 100]);
  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] = useState(false);
  const [maxCladeTexts, setMaxCladeTexts] = useState(10);
  const [chromosomeName, setChromosomeName] = useState("chromosome");
  const [isCov2Tree, setIsCov2Tree] = useState(false);

  // Load and merge config on mount
  useEffect(() => {
    backend.getConfig((backendConfig) => {
      let fromFile = {};

      function applyMergedConfig() {
        // Merge order: defaults → backend → query.config → file → configDict
        const defaults = getDefaultSettings();
        let merged: any = { ...defaults };

        // 1. Apply backend config
        Object.assign(merged, backendConfig);

        // 2. Apply query.config if present
        if (query.config) {
          const unpacked = JSON.parse(query.config);
          delete unpacked.validate_SID;
          Object.assign(merged, unpacked);
        }

        // 3. Apply config from file
        Object.assign(merged, fromFile);

        // 4. Apply configDict (highest priority for config)
        Object.assign(merged, configDict);

        // Set config state
        setConfig(merged);

        // Initialize settings from merged config
        // Query parameters have highest priority for these settings
        if (merged.minimapEnabled !== undefined) {
          setMinimapEnabled(merged.minimapEnabled);
        }
        if (merged.displayTextForInternalNodes !== undefined) {
          setDisplayTextForInternalNodes(merged.displayTextForInternalNodes);
        }
        if (merged.thresholdForDisplayingText !== undefined) {
          setThresholdForDisplayingText(merged.thresholdForDisplayingText);
        }
        if (merged.displaySearchesAsPoints !== undefined) {
          setDisplaySearchesAsPoints(merged.displaySearchesAsPoints);
        }
        if (merged.searchPointSize !== undefined) {
          setSearchPointSize(merged.searchPointSize);
        }
        if (merged.opacity !== undefined) {
          setOpacity(merged.opacity);
        }
        if (merged.prettyStroke !== undefined) {
          setPrettyStroke(merged.prettyStroke);
        }
        if (merged.terminalNodeLabelColor !== undefined) {
          setTerminalNodeLabelColor(merged.terminalNodeLabelColor);
        }
        if (merged.lineColor !== undefined) {
          setLineColor(merged.lineColor);
        }
        if (merged.nodeSize !== undefined) {
          setNodeSize(merged.nodeSize);
        }
        if (merged.cladeLabelColor !== undefined) {
          setCladeLabelColor(merged.cladeLabelColor);
        }
        if (merged.displayPointsForInternalNodes !== undefined) {
          setDisplayPointsForInternalNodes(merged.displayPointsForInternalNodes);
        }
        if (merged.maxCladeTexts !== undefined) {
          setMaxCladeTexts(merged.maxCladeTexts);
        }
        if (merged.chromosomeName !== undefined) {
          setChromosomeName(merged.chromosomeName);
        }
        if (merged.isCov2Tree !== undefined) {
          setIsCov2Tree(merged.isCov2Tree);
        }

        // Set title if provided
        if (merged.title && onSetTitle) {
          onSetTitle(merged.title);
        }

        backend.setStatusMessage({ message: "Connecting" });

        // Set overlay if provided
        if (merged.overlay) {
          setOverlayContent(merged.overlay);
        }
      }

      // Handle configUrl loading
      if (configUrl && !query.configUrl) {
        query.configUrl = configUrl;
      }

      if (query.configUrl) {
        fetch(query.configUrl)
          .then((response) => response.json())
          .then((data) => {
            fromFile = data;
            applyMergedConfig();
          })
          .catch((error) => {
            console.log("ERROR loading config file:", error);
            applyMergedConfig();
          });
      } else {
        applyMergedConfig();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend.getConfig]);

  // Check for cov2tree on mount
  useEffect(() => {
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setIsCov2Tree(true);
      setChromosomeName("NC_045512v2");
    }
  }, []);

  const toggleMinimapEnabled = () => {
    setMinimapEnabled(!minimapEnabled);
  };

  // Query-based settings (these persist via URL)
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

  const setMutationTypeEnabled = (key: string, enabled: boolean) => {
    const newMutationTypesEnabled = { ...mutationTypesEnabled };
    newMutationTypesEnabled[key] = enabled;
    updateQuery({
      mutationTypesEnabled: JSON.stringify(newMutationTypesEnabled),
    });
  };

  const miniMutationsMenu = () => {
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
  };

  return {
    // Config properties (from merged config)
    ...config,

    // Settings properties (local state)
    minimapEnabled,
    treenomeEnabled,
    setTreenomeEnabled,
    toggleMinimapEnabled,
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
  } as MergedSettingsAndConfig;
};
