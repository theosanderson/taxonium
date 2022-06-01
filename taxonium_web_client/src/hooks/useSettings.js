import { useState, useMemo, useCallback } from "react";
import { AiFillEye } from "react-icons/ai";
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
        <AiFillEye className="mr-1 text-gray-400 inline-block w-5 h-4 mb-1" />
        {Object.keys(mutationTypesEnabled).map((key) => (
          <div key={key} className="inline-block mr-3  -mb-1 -pb-1">
            <label key={key}>
              <input
                type="checkbox"
                className="mr-1 -mb-1 -pb-1"
                checked={mutationTypesEnabled[key]}
                onChange={() =>
                  setMutationTypeEnabled(key, !mutationTypesEnabled[key])
                }
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
