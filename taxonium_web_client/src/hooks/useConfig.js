import { useState, useEffect } from "react";

const useConfig = (backend, view, overlayRef, setTitle, query) => {
  const [config, setConfig] = useState({
    title: "loading",
    source: "",
    num_nodes: 0,
  });

  useEffect(() => {
    console.log("GETTING CONFIG");
    backend.getConfig((results) => {
      const viewState = {
        ...view.viewState,
        target: [2000, results.initial_y],
        zoom: results.initial_zoom,
      };

      const oldViewState = { ...viewState };

    
      if (query.config) {
        console.log("FOUND QUERY", query.config);
        const unpacked = JSON.parse(query.config);
        console.log("UNPACKED", unpacked);
        delete unpacked.validate_SID;
        Object.assign(results, unpacked);
      }

      if (results.title) {
        setTitle(results.title);
        // set the title with window
        window.document.title = results.title;
        console.log("setting title to ", config.title);
      }


      setConfig(results);
      console.log("CONFIG", results);
      view.onViewStateChange({
        viewState,
        oldViewState,
        interactionState: "isZooming",
      });

      overlayRef.current.innerHTML = results.overlay;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend.getConfig]);

  return config;
};

export default useConfig;
