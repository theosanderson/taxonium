import { useState, useMemo, useCallback } from "react";
import { AiFillEye } from "react-icons/ai";
import { toast } from "react-hot-toast";
export const useSettings = ({ query, updateQuery }) => {
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [displayTextForInternalNodes, setDisplayTextForInternalNodes] =
    useState(false);

  const [thresholdForDisplayingText, setThresholdForDisplayingText] =
    useState(2.9);

  const [displayPointsForInternalNodes, setDisplayPointsForInternalNodes] =
    useState(false);
  const toggleMinimapEnabled = () => {
    setMinimapEnabled(!minimapEnabled);
  };

  const mutationTypesEnabled = useMemo(() => {
    return JSON.parse(query.mutationTypesEnabled);
  }, [query.mutationTypesEnabled]);

  const treenomeEnabled = useMemo(() => {
    return JSON.parse(query.treenomeEnabled);
  }, [query.treenomeEnabled]);
  
  const setTreenomeEnabled = useCallback((value) => {
    updateQuery({ treenomeEnabled: value });
    toast(
      `Genome browser is now ${
        value ? "enabled" : "disabled"
      }`,
      {
        position: "bottom-center",
      });
  }, [updateQuery]);

  const filterMutations = useCallback(
    (mutations) => {
      return mutations.filter(
        (mutation) => mutationTypesEnabled[mutation.type]
      );
    },
    [mutationTypesEnabled]
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
  };
};
