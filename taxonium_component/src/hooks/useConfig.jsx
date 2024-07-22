import { useState, useEffect } from "react";

const useConfig = (
  backend,
  view,
  setOverlayContent,
  setTitle,
  query,
  configDict,
  configUrl,
) => {
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

      let fromFile = {};

      function afterPossibleGet() {
        if (query.config) {
          console.log("FOUND QUERY", query.config);
          const unpacked = JSON.parse(query.config);
          console.log("UNPACKED", unpacked);
          delete unpacked.validate_SID;
          Object.assign(results, unpacked);
        }
        Object.assign(results, fromFile);
        if (results.title) {
          setTitle(results.title);
          // set the title with window
          window.document.title = results.title;
          console.log("setting title to ", config.title);
        }

        Object.assign(results, configDict);

        setConfig(results);
        backend.setStatusMessage({ message: "Connecting" });
        // THE BELOW IS NOT WORKING ATM
        view.onViewStateChange({
          viewState,
          oldViewState,
          interactionState: "isZooming",
        });

        if (results.overlay) {
          setOverlayContent(results.overlay);
        }
      }

      if (configUrl && !query.configUrl) {
        query.configUrl = configUrl;
      }

      if (query.configUrl) {
        console.log("FOUND QUERY", query.configUrl);
        fetch(query.configUrl)
          .then((response) => response.json())
          .then((data) => {
            console.log("FOUND CONFIG URL", data);
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

  return config;
};

export default useConfig;
