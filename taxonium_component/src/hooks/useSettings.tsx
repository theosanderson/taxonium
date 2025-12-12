import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import getDefaultQuery from "../utils/getDefaultQuery";
import type { Settings, PrettyStroke } from "../types/settings";
import type { Query } from "../types/query";
import type { Config } from "../types/backend";
const default_query = getDefaultQuery();

interface UseSettingsProps {
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
  config?: Config | null;
  configIsLoading?: boolean;
}

// Default values for settings
const DEFAULTS = {
  minimapEnabled: true,
  displayTextForInternalNodes: false,
  thresholdForDisplayingText: 2.9,
  displaySearchesAsPoints: false,
  searchPointSize: 3,
  opacity: 0.6,
  prettyStroke: {
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  } as PrettyStroke,
  terminalNodeLabelColor: [180, 180, 180],
  lineColor: [150, 150, 150],
  nodeSize: 3,
  cladeLabelColor: [100, 100, 100],
  displayPointsForInternalNodes: false,
  chromosomeName: "chromosome",
  maxCladeTexts: 10,
  isCov2Tree: false,
};

type ConfigDrivenSettingKeys =
  | "minimapEnabled"
  | "displayTextForInternalNodes"
  | "thresholdForDisplayingText"
  | "displaySearchesAsPoints"
  | "searchPointSize"
  | "opacity"
  | "prettyStroke"
  | "terminalNodeLabelColor"
  | "lineColor"
  | "nodeSize"
  | "cladeLabelColor"
  | "displayPointsForInternalNodes"
  | "chromosomeName"
  | "maxCladeTexts"
  | "isCov2Tree";

type ConfigDrivenSettings = Partial<Pick<Settings, ConfigDrivenSettingKeys>>;

const CONFIG_KEYS: ConfigDrivenSettingKeys[] = [
  "minimapEnabled",
  "displayTextForInternalNodes",
  "thresholdForDisplayingText",
  "displaySearchesAsPoints",
  "searchPointSize",
  "opacity",
  "prettyStroke",
  "terminalNodeLabelColor",
  "lineColor",
  "nodeSize",
  "cladeLabelColor",
  "displayPointsForInternalNodes",
  "chromosomeName",
  "maxCladeTexts",
  "isCov2Tree",
];

const extractSettingsFromConfig = (config?: Config | null): ConfigDrivenSettings => {
  if (!config) {
    return {};
  }
  const configValues: ConfigDrivenSettings = {};
  const raw = config as Record<string, unknown>;

  CONFIG_KEYS.forEach((key) => {
    const value = raw[key as string];
    if (value !== undefined) {
      configValues[key] = value as ConfigDrivenSettings[typeof key];
    }
  });

  return configValues;
};

export const useSettings = ({
  query,
  updateQuery,
  config,
  configIsLoading,
}: UseSettingsProps): Settings => {
  const [minimapEnabled, setMinimapEnabled] = useState(
    DEFAULTS.minimapEnabled
  );
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] = useState(
    DEFAULTS.displayTextForInternalNodes
  );

  const [thresholdForDisplayingText, setThresholdForDisplayingText] = useState(
    DEFAULTS.thresholdForDisplayingText
  );

  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] = useState(
    DEFAULTS.displaySearchesAsPoints
  );

  const [searchPointSize, setSearchPointSize] = useState(
    DEFAULTS.searchPointSize
  );

  const [opacity, setOpacity] = useState(DEFAULTS.opacity);

  const [prettyStroke, setPrettyStroke] = useState<PrettyStroke>(
    DEFAULTS.prettyStroke
  );

  const [terminalNodeLabelColor, setTerminalNodeLabelColor] = useState(
    DEFAULTS.terminalNodeLabelColor
  );

  const [lineColor, setLineColor] = useState(DEFAULTS.lineColor);
  const [nodeSize, setNodeSize] = useState(DEFAULTS.nodeSize);
  const [cladeLabelColor, setCladeLabelColor] = useState(
    DEFAULTS.cladeLabelColor
  );

  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] =
    useState(DEFAULTS.displayPointsForInternalNodes);

  const [maxCladeTexts, setMaxCladeTexts] = useState(DEFAULTS.maxCladeTexts);

  const [chromosomeName, setChromosomeName] = useState(
    DEFAULTS.chromosomeName
  );
  const [isCov2Tree, setIsCov2Tree] = useState(DEFAULTS.isCov2Tree);

  const configDrivenSettings = useMemo(
    () => extractSettingsFromConfig(config),
    [config]
  );

  useEffect(() => {
    if (!config || configIsLoading) {
      return;
    }

    if (configDrivenSettings.minimapEnabled !== undefined) {
      setMinimapEnabled(configDrivenSettings.minimapEnabled);
    }
    if (configDrivenSettings.displayTextForInternalNodes !== undefined) {
      setDisplayTextForInternalNodes(
        configDrivenSettings.displayTextForInternalNodes
      );
    }
    if (configDrivenSettings.thresholdForDisplayingText !== undefined) {
      setThresholdForDisplayingText(
        configDrivenSettings.thresholdForDisplayingText
      );
    }
    if (configDrivenSettings.displaySearchesAsPoints !== undefined) {
      setDisplaySearchesAsPoints(
        configDrivenSettings.displaySearchesAsPoints
      );
    }
    if (configDrivenSettings.searchPointSize !== undefined) {
      setSearchPointSize(configDrivenSettings.searchPointSize);
    }
    if (configDrivenSettings.opacity !== undefined) {
      setOpacity(configDrivenSettings.opacity);
    }
    if (configDrivenSettings.prettyStroke !== undefined) {
      setPrettyStroke(configDrivenSettings.prettyStroke);
    }
    if (configDrivenSettings.terminalNodeLabelColor !== undefined) {
      setTerminalNodeLabelColor(
        configDrivenSettings.terminalNodeLabelColor
      );
    }
    if (configDrivenSettings.lineColor !== undefined) {
      setLineColor(configDrivenSettings.lineColor);
    }
    if (configDrivenSettings.nodeSize !== undefined) {
      setNodeSize(configDrivenSettings.nodeSize);
    }
    if (configDrivenSettings.cladeLabelColor !== undefined) {
      setCladeLabelColor(configDrivenSettings.cladeLabelColor);
    }
    if (configDrivenSettings.displayPointsForInternalNodes !== undefined) {
      setDisplayPointsForInternalNodes(
        configDrivenSettings.displayPointsForInternalNodes
      );
    }
    if (configDrivenSettings.maxCladeTexts !== undefined) {
      setMaxCladeTexts(configDrivenSettings.maxCladeTexts);
    }
    if (configDrivenSettings.chromosomeName !== undefined) {
      setChromosomeName(configDrivenSettings.chromosomeName);
    }
    if (configDrivenSettings.isCov2Tree !== undefined) {
      setIsCov2Tree(configDrivenSettings.isCov2Tree);
    }
  }, [config, configIsLoading, configDrivenSettings]);

  const toggleMinimapEnabled = () => {
    setMinimapEnabled(!minimapEnabled);
  };

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
                  // toast at bottom center
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

  const configOverridesChromosomeName =
    configDrivenSettings.chromosomeName !== undefined;
  const configOverridesIsCov2Tree =
    configDrivenSettings.isCov2Tree !== undefined;

  // Auto-detect cov2tree settings from URL if not explicitly set in config
  useEffect(() => {
    if (configOverridesIsCov2Tree || configOverridesChromosomeName) {
      return;
    }
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setIsCov2Tree(true);
      setChromosomeName("NC_045512v2");
    }
  }, [configOverridesIsCov2Tree, configOverridesChromosomeName]);

  return {
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
  };
};
