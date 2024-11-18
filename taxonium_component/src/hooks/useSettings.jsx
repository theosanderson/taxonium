import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import getDefaultQuery from "../utils/getDefaultQuery";
const default_query = getDefaultQuery();
export const useSettings = ({ query, updateQuery }) => {
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] =
    useState(false);

  const [thresholdForDisplayingText, setThresholdForDisplayingText] =
    useState(2.9);

  const [displaySearchesAsPoints, setDisplaySearchesAsPoints] = useState(false);

  const [searchPointSize, setSearchPointSize] = useState(3);

  const [opacity, setOpacity] = useState(0.6);

  const [prettyStroke, setPrettyStroke] = useState({
    enabled: false,
    color: [76, 87, 106],
    width: 1,
  });

  const [terminalNodeLabelColor, setTerminalNodeLabelColor] = useState([
    180, 180, 180,
  ]);

  const [lineColor, setLineColor] = useState([150, 150, 150]);
  const [nodeSize, setNodeSize] = useState(3);
  const [cladeLabelColor, setCladeLabelColor] = useState([100, 100, 100]);

  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] =
    useState(false);
  const toggleMinimapEnabled = () => {
    setMinimapEnabled(!minimapEnabled);
  };

  const mutationTypesEnabled = useMemo(() => {
    if (!query.mutationTypesEnabled) {
      return JSON.parse(default_query.mutationTypesEnabled);
    }
    return JSON.parse(query.mutationTypesEnabled);
  }, [query.mutationTypesEnabled]);

  const treenomeEnabled = useMemo(() => {
    if (!query.treenomeEnabled) {
      return false;
    }
    return JSON.parse(query.treenomeEnabled);
  }, [query.treenomeEnabled]);

  const setTreenomeEnabled = useCallback(
    (value) => {
      updateQuery({ treenomeEnabled: JSON.stringify(value) });
      toast(`Treenome Browser is now ${value ? "enabled" : "disabled"}`, {
        position: "bottom-center",
      });
    },
    [updateQuery],
  );

  const filterMutations = useCallback(
    (mutations) => {
      return mutations.filter(
        (mutation) => mutationTypesEnabled[mutation.type],
      );
    },
    [mutationTypesEnabled],
  );

  const setMutationTypeEnabled = (key, enabled) => {
    const newMutationTypesEnabled = { ...mutationTypesEnabled };
    newMutationTypesEnabled[key] = enabled;
    updateQuery({
      mutationTypesEnabled: JSON.stringify(newMutationTypesEnabled),
    });
  };

  const [maxCladeTexts, setMaxCladeTexts] = useState(10);

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
                    },
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

  const [chromosomeName, setChromosomeName] = useState("chromosome");
  const [isCov2Tree, setIsCov2Tree] = useState(false);
  useEffect(() => {
    if (
      window.location.href.includes("cov2tree.org") ||
      window.location.href.includes("big-tree.ucsc.edu")
    ) {
      setIsCov2Tree(true);
      setChromosomeName("NC_045512v2");
    }
  }, []);

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
