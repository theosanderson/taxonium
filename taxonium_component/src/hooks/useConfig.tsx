import { useState, useEffect, type ReactNode } from "react";
import type { Backend, Config } from "../types/backend";
import type { Query } from "../types/query";
import type { SettingsConfig } from "../types/settings";

const mergeSettingsLayers = (layers: SettingsConfig[]): SettingsConfig | undefined => {
  if (!layers.length) {
    return undefined;
  }
  return layers.reduce<SettingsConfig>((acc, layer) => ({ ...acc, ...layer }), {});
};

const useConfig = (
  backend: Backend | null,
  setOverlayContent: (content: ReactNode) => void,
  onSetTitle: ((title: string) => void) | undefined,
  query: Query,
  configDict: Record<string, unknown> | undefined,
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
    if (!backend) {
      return;
    }
    backend.getConfig((results) => {
      const settingsLayers: SettingsConfig[] = [];
      if (results.settings) {
        settingsLayers.push(results.settings);
      }

      const applyOverrides = (
        override: Record<string, unknown> | undefined,
        { stripValidateSid }: { stripValidateSid?: boolean } = {}
      ) => {
        if (!override) {
          return;
        }
        const copy = { ...override } as Record<string, unknown> & {
          settings?: SettingsConfig;
        };
        if (stripValidateSid) {
          delete (copy as { validate_SID?: unknown }).validate_SID;
        }
        if (copy.settings) {
          settingsLayers.push(copy.settings);
          delete copy.settings;
        }
        Object.assign(results, copy);
      };

      let fromFile: Record<string, unknown> = {};

      const finalizeConfig = () => {
        if (query.config) {
          try {
            applyOverrides(JSON.parse(query.config), { stripValidateSid: true });
          } catch (error) {
            console.error("Failed to parse query.config", error);
          }
        }
        applyOverrides(fromFile);
        applyOverrides(configDict);

        const mergedSettings = mergeSettingsLayers(settingsLayers);
        if (mergedSettings) {
          results.settings = mergedSettings;
        } else {
          delete (results as Partial<Config>).settings;
        }

        if (results.title && onSetTitle) {
          onSetTitle(results.title);
        }

        setConfig({ ...results });
        backend.setStatusMessage({ message: "Connecting" });

        if (results.overlay) {
          setOverlayContent(results.overlay);
        }
      };

      if (configUrl && !query.configUrl) {
        query.configUrl = configUrl;
      }

      if (query.configUrl) {
        fetch(query.configUrl)
          .then((response) => response.json())
          .then((data) => {
            fromFile = data;
            finalizeConfig();
          })
          .catch((error) => {
            console.log("ERROR", error);
            finalizeConfig();
          });
      } else {
        finalizeConfig();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  return config;
};

export default useConfig;
