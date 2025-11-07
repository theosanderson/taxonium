import { useState, useMemo, useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "react-hot-toast";
import getDefaultQuery from "../utils/getDefaultQuery";
import type { Settings, PrettyStroke } from "../types/settings";
import type { Query } from "../types/query";
import type { Config } from "../types/backend";

const default_query = getDefaultQuery();
const DEFAULT_PRETTY_STROKE: PrettyStroke = {
  enabled: false,
  color: [76, 87, 106],
  width: 1,
};

interface UseSettingsProps {
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
  config?: Config;
}

const identity = <T,>(value: T) => value;
const cloneNumberArray = (value: number[]) => [...value];
const clonePrettyStrokeValue = (value: PrettyStroke) => ({
  ...value,
  color: [...value.color],
});

const useConfigurableState = <T,>(
  configValue: T | undefined,
  fallback: T,
  cloneValue: (value: T) => T = identity
): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() =>
    configValue !== undefined ? cloneValue(configValue) : fallback
  );

  useEffect(() => {
    if (configValue !== undefined) {
      setState(cloneValue(configValue));
    }
  }, [configValue, cloneValue]);

  return [state, setState];
};

export const useSettings = ({
  query,
  updateQuery,
  config,
}: UseSettingsProps): Settings => {
  const configSettings = config?.settings;

  const [minimapEnabled, setMinimapEnabled] = useConfigurableState(
    configSettings?.minimapEnabled,
    true
  );
  const toggleMinimapEnabled = useCallback(() => {
    setMinimapEnabled((current) => !current);
  }, [setMinimapEnabled]);

  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] =
    useConfigurableState(configSettings?.displayTextForInternalNodes, false);

  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] =
    useConfigurableState(configSettings?.displayPointsForInternalNodes, false);

  const [thresholdForDisplayingText, setThresholdForDisplayingText] =
    useConfigurableState(configSettings?.thresholdForDisplayingText, 2.9);

  const [maxCladeTexts, setMaxCladeTexts] = useConfigurableState(
    configSettings?.maxCladeTexts,
    10
  );

  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] =
    useConfigurableState(configSettings?.displaySearchesAsPoints, false);

  const [searchPointSize, setSearchPointSize] = useConfigurableState(
    configSettings?.searchPointSize,
    3
  );

  const [opacity, setOpacity] = useConfigurableState(
    configSettings?.opacity,
    0.6
  );

  const [prettyStroke, setPrettyStroke] = useConfigurableState(
    configSettings?.prettyStroke,
    DEFAULT_PRETTY_STROKE,
    clonePrettyStrokeValue
  );

  const [terminalNodeLabelColor, setTerminalNodeLabelColor] =
    useConfigurableState(
      configSettings?.terminalNodeLabelColor,
      [180, 180, 180],
      cloneNumberArray
    );

  const [lineColor, setLineColor] = useConfigurableState(
    configSettings?.lineColor,
    [150, 150, 150],
    cloneNumberArray
  );

  const [nodeSize, setNodeSize] = useConfigurableState(
    configSettings?.nodeSize,
    3
  );

  const [cladeLabelColor, setCladeLabelColor] = useConfigurableState(
    configSettings?.cladeLabelColor,
    [100, 100, 100],
    cloneNumberArray
  );

  const [chromosomeName, setChromosomeName] = useConfigurableState(
    configSettings?.chromosomeName,
    "chromosome"
  );

  const fallbackMutationTypes = useMemo(() => {
    if (configSettings?.mutationTypesEnabled) {
      return configSettings.mutationTypesEnabled;
    }
    return JSON.parse(default_query.mutationTypesEnabled as string);
  }, [configSettings?.mutationTypesEnabled]);

  const mutationTypesEnabled = useMemo(() => {
    if (!query.mutationTypesEnabled) {
      return fallbackMutationTypes;
    }
    try {
      return JSON.parse(query.mutationTypesEnabled as string);
    } catch (error) {
      return fallbackMutationTypes;
    }
  }, [query.mutationTypesEnabled, fallbackMutationTypes]);

  const treenomeEnabled = useMemo(() => {
    if (typeof query.treenomeEnabled === "string") {
      try {
        return JSON.parse(query.treenomeEnabled);
      } catch (error) {
        return typeof configSettings?.treenomeEnabled === "boolean"
          ? configSettings.treenomeEnabled
          : false;
      }
    }
    if (typeof query.treenomeEnabled === "boolean") {
      return query.treenomeEnabled;
    }
    if (typeof configSettings?.treenomeEnabled === "boolean") {
      return configSettings.treenomeEnabled;
    }
    return false;
  }, [query.treenomeEnabled, configSettings?.treenomeEnabled]);

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

  const [isCov2Tree, setIsCov2Tree] = useState(false);
  useEffect(() => {
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setIsCov2Tree(true);
      if (configSettings?.chromosomeName === undefined) {
        setChromosomeName("NC_045512v2");
      }
    }
  }, [configSettings?.chromosomeName, setChromosomeName]);

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
