import { useState, useEffect } from "react";

const useSummary = (backend, view) => {
  const [summary, setSummary] = useState({
    title: "loading",
    source: "",
    num_nodes: 0,
  });

  useEffect(() => {
    backend.getSummary((results) => {
      const viewState = {
        ...view.viewState,
        target: [2000, results.initial_y],
        zoom: results.initial_zoom,
      };

      const oldViewState = { ...viewState };

      setSummary(results);
      console.log(results);
      view.onViewStateChange({
        viewState,
        oldViewState,
        interactionState: "isZooming",
      });
    });
  }, [backend]);

  return summary;
};

export default useSummary;
