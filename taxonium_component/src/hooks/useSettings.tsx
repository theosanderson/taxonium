import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import getDefaultQuery from "../utils/getDefaultQuery";
import type { Settings, PrettyStroke, InitialSettingsValues } from "../types/settings";
import type { Query } from "../types/query";
const default_query = getDefaultQuery();

interface UseSettingsProps {
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
  /** Initial settings values from config/configDict. Settings not provided will use defaults. */
  initialValues?: InitialSettingsValues;
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

export const useSettings = ({ query, updateQuery, initialValues }: UseSettingsProps): Settings => {
  const [minimapEnabled, setMinimapEnabled] = useState(
    initialValues?.minimapEnabled ?? DEFAULTS.minimapEnabled
  );
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] = useState(
    initialValues?.displayTextForInternalNodes ?? DEFAULTS.displayTextForInternalNodes
  );

  const [thresholdForDisplayingText, setThresholdForDisplayingText] = useState(
    initialValues?.thresholdForDisplayingText ?? DEFAULTS.thresholdForDisplayingText
  );

  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] = useState(
    initialValues?.displaySearchesAsPoints ?? DEFAULTS.displaySearchesAsPoints
  );

  const [searchPointSize, setSearchPointSize] = useState(
    initialValues?.searchPointSize ?? DEFAULTS.searchPointSize
  );

  const [opacity, setOpacity] = useState(
    initialValues?.opacity ?? DEFAULTS.opacity
  );

  const [prettyStroke, setPrettyStroke] = useState<PrettyStroke>(
    initialValues?.prettyStroke ?? DEFAULTS.prettyStroke
  );

  const [terminalNodeLabelColor, setTerminalNodeLabelColor] = useState(
    initialValues?.terminalNodeLabelColor ?? DEFAULTS.terminalNodeLabelColor
  );

  const [lineColor, setLineColor] = useState(
    initialValues?.lineColor ?? DEFAULTS.lineColor
  );
  const [nodeSize, setNodeSize] = useState(
    initialValues?.nodeSize ?? DEFAULTS.nodeSize
  );
  const [cladeLabelColor, setCladeLabelColor] = useState(
    initialValues?.cladeLabelColor ?? DEFAULTS.cladeLabelColor
  );

  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] = useState(
    initialValues?.displayPointsForInternalNodes ?? DEFAULTS.displayPointsForInternalNodes
  );
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

  const [maxCladeTexts, setMaxCladeTexts] = useState(
    initialValues?.maxCladeTexts ?? DEFAULTS.maxCladeTexts
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

  const [chromosomeName, setChromosomeName] = useState(
    initialValues?.chromosomeName ?? DEFAULTS.chromosomeName
  );
  const [isCov2Tree, setIsCov2Tree] = useState(
    initialValues?.isCov2Tree ?? DEFAULTS.isCov2Tree
  );

  // Auto-detect cov2tree settings from URL if not explicitly set in config
  useEffect(() => {
    if (initialValues?.isCov2Tree !== undefined || initialValues?.chromosomeName !== undefined) {
      // Config explicitly set these values, don't override from URL
      return;
    }
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setIsCov2Tree(true);
      setChromosomeName("NC_045512v2");
    }
  }, [initialValues?.isCov2Tree, initialValues?.chromosomeName]);

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
