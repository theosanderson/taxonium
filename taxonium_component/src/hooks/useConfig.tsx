import { useState, useEffect, type ReactNode } from "react";
import type { Backend, Config } from "../types/backend";
import type { Query } from "../types/query";
import type { View } from "./useView";

const useConfig = (
  backend: Backend,
  view: View,
  setOverlayContent: (content: ReactNode) => void,
  onSetTitle: ((title: string) => void) | undefined,
  query: Query,
  configDict: any,
  configUrl: string | undefined
) => {
  const [config, setConfig] = useState<Config>({
    title: "loading",
    source: "",
    num_nodes: 0,
    rootMutations: [],
    rootId: "",
  });

  useEffect(() => {
    backend.getConfig((results) => {
      const viewState = {
        ...view.viewState,
        target: [
          results.initial_x !== undefined ? results.initial_x : 2000,
          results.initial_y,
        ],
        //zoom: [0, -2]
        

      };

      const oldViewState = { ...viewState };

      let fromFile = {};

      function afterPossibleGet() {
        if (query.config) {
          const unpacked = JSON.parse(query.config);
          delete unpacked.validate_SID;
          Object.assign(results, unpacked);
        }
        Object.assign(results, fromFile);
        if (results.title && onSetTitle) {
          onSetTitle(results.title);
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
        fetch(query.configUrl)
          .then((response) => response.json())
          .then((data) => {
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
