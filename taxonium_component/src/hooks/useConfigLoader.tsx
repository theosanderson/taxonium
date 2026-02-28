import { useState, useEffect, useRef } from "react";
import type { Backend, Config } from "../types/backend";
import type { Query } from "../types/query";

const DEFAULT_CONFIG: Config = {
  title: "loading",
  source: "",
  num_nodes: 0,
  rootMutations: [],
  rootId: "",
};

export interface ConfigLoaderResult {
  config: Config;
  isLoading: boolean;
}

/**
 * Hook that loads configuration from backend, configUrl, and configDict.
 * This hook does NOT depend on view - it purely handles config loading and merging.
 */
const useConfigLoader = (
  backend: Backend | null,
  query: Query,
  configDict: Record<string, unknown> | undefined,
  configUrl: string | undefined,
  onSetTitle?: (title: string) => void
): ConfigLoaderResult => {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Track if we've already loaded to prevent duplicate loads
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Can't load config without a backend
    if (!backend) return;
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    backend.getConfig((results) => {
      let fromFile = {};

      function afterPossibleGet() {
        // Merge query.config overrides
        if (query.config) {
          const unpacked = JSON.parse(query.config);
          delete unpacked.validate_SID;
          Object.assign(results, unpacked);
        }

        // Merge config from URL
        Object.assign(results, fromFile);

        // Set title if provided
        if (results.title && onSetTitle) {
          onSetTitle(results.title);
        }

        // Merge configDict (highest priority)
        if (configDict) {
          Object.assign(results, configDict);
        }

        setConfig(results);
        setIsLoading(false);
        backend.setStatusMessage({ message: "Connecting" });
      }

      // Determine the config URL to use
      const effectiveConfigUrl = query.configUrl || configUrl;

      if (effectiveConfigUrl) {
        fetch(effectiveConfigUrl)
          .then((response) => response.json())
          .then((data) => {
            fromFile = data;
            afterPossibleGet();
          })
          .catch((error) => {
            console.log("ERROR loading config from URL:", error);
            afterPossibleGet();
          });
      } else {
        afterPossibleGet();
      }
    });
  }, [backend.getConfig]);

  return { config, isLoading };
};

export default useConfigLoader;
