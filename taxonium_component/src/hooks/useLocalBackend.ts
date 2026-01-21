import { useCallback, useMemo, useEffect, useState } from "react";
import type {
  Config,
  NodesResponse,
  NodeDetails,
  SearchResult,
  QueryBounds,
  LocalBackend,
} from "../types/backend";
import type {
  StatusData,
  QueryData,
  SearchData,
  ConfigData,
  DetailsData,
  ListData,
  NextStrainData,
  LocalBackendMessage,
} from "../types/localBackendWorker";
import type { Node, Mutation } from "../types/node";

// test
//const workerPath = "../webworkers/localBackendWorker.js";

import workerSpec from "../webworkers/localBackendWorker.js?worker&inline";

//const url = new URL('../webworkers/localBackendWorker.js', import.meta.url)
//const getWorker = () => new Worker(url, { type: 'module' })

const worker = new workerSpec();

let onQueryReceipt: (receivedData: NodesResponse) => void = () => {};
let onStatusReceipt: (receivedData: StatusData) => void = (receivedData) => {
  /* STATUS update */
};

let onConfigReceipt: (receivedData: Config) => void = () => {};
let onDetailsReceipt: (receivedData: NodeDetails) => void = () => {};
let onListReceipt: (receivedData: ListData["data"]) => void = () => {};
let onOverallSpectrumReceipt: (receivedData: { spectrum: string | null }) => void = () => {};
let onNextStrainReceipt: (receivedData: NextStrainData["data"]) => void = (
  receivedData
) => {
  // create a blob with this data and trigger download
  const blob = new Blob([JSON.stringify(receivedData)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "nextstrain.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

let searchSetters: Record<string, (data: SearchResult) => void> = {};

worker.onmessage = (event: MessageEvent<LocalBackendMessage>) => {
  const data = event.data;
  switch (data.type) {
    case "status":
      onStatusReceipt(data);
      break;
    case "query":
      onQueryReceipt(data.data);
      break;
      case "search":
        if (data.data.key) {
          searchSetters[data.data.key]?.(data.data);
        }
        break;
    case "config":
      onConfigReceipt(data.data);
      break;
    case "details":
      onDetailsReceipt(data.data);
      break;
    case "list":
      onListReceipt(data.data);
      break;
    case "nextstrain":
      onNextStrainReceipt(data.data);
      break;
    case "overall_spectrum":
      onOverallSpectrumReceipt(data.data);
      break;
    default:
      break;
  }
};

function useLocalBackend(
  uploaded_data: Record<string, unknown> | null
): LocalBackend {
  const [statusMessage, setStatusMessage] = useState<
    | { percentage?: number; message?: string | null }
    | null
  >({ message: null });
  onStatusReceipt = (receivedData) => {
    if (receivedData.data.error) {
      window.alert(receivedData.data.error);
      console.log("ERROR33:", receivedData.data.error);
    }
    const total_nodes = receivedData.data.total as number | undefined;
    if (total_nodes && total_nodes > 6000000) {
      if (1) {
        window.alert(
          "This is a large tree which may use too much memory to run in the web browser. If the page crashes you might want to try the Taxonium desktop app."
        );
      }
    }
    setStatusMessage(receivedData.data);
  };
  useEffect(() => {
    worker.postMessage({
      type: "upload",
      data: uploaded_data,
    });
  }, [uploaded_data]);

  const queryNodes = useCallback(
    async (
      boundsForQueries: QueryBounds | null,
      setResult: (res: NodesResponse) => void,
      setTriggerRefresh: (v: Record<string, unknown>) => void,
      config: Config
    ) => {
      
      worker.postMessage({
        type: "query",
        bounds: boundsForQueries,
      });
      onQueryReceipt = (receivedData) => {
        receivedData.nodes.forEach((node: Node) => {
          if (!config.mutations) return;
          if (node.node_id === config.rootId) {
            node.mutations = config.rootMutations
              .map((x) => (typeof x === "number" ? config.mutations?.[x] : x))
              .filter(Boolean) as Mutation[];
          } else {
            node.mutations = node.mutations
              .map((mutation: Mutation | number) =>
                typeof mutation === "number" ? config.mutations?.[mutation] : mutation
              )
              .filter(Boolean) as Mutation[];
          }
        });
        setResult(receivedData);
      };
    },
    []
  );

  const singleSearch = useCallback(
    (
      singleSearch: string,
      boundsForQueries: QueryBounds | null,
      setResult: (res: SearchResult) => void
    ) => {
      const key = JSON.parse(singleSearch).key;
      worker.postMessage({
        type: "search",
        search: singleSearch,
        bounds: boundsForQueries,
      });

      searchSetters[key] = (receivedData) => {
        setResult(receivedData);
      };
      return {
        abortController: {
          abort: () => {},
        },
      };
    },
    []
  );

  const getDetails = useCallback(
    (node_id: string | number, setResult: (res: NodeDetails) => void) => {
      worker.postMessage({
        type: "details",
        node_id: node_id,
      });
      onDetailsReceipt = (receivedData) => {
        setResult(receivedData);
      };
    },
    []
  );

  const getConfig = useCallback((setResult: (res: Config) => void) => {
    worker.postMessage({
      type: "config",
    });

    onConfigReceipt = (receivedData) => {
      setResult(receivedData);
    };
  }, []);

  const getTipAtts = useCallback(
    (
      nodeId: string | number,
      selectedKey: string,
      callback: (err: unknown, data: unknown) => void
    ) => {
    worker.postMessage({
      type: "list",
      node_id: nodeId,
      key: selectedKey,
    });

    onListReceipt = (receivedData) => {
      callback(null, receivedData);
    };
  }, []);

  const getNextstrainJson = useCallback((nodeId: string | number, config: Config) => {
    worker.postMessage({
      type: "nextstrain",
      node_id: nodeId,
      config: config,
    });
  }, []);

  const getOverallSpectrum = useCallback((callback: (spectrum: string | null) => void) => {
    worker.postMessage({
      type: "overall_spectrum",
    });
    onOverallSpectrumReceipt = (receivedData) => {
      callback(receivedData.spectrum);
    };
  }, []);

  return useMemo(() => {
    return {
      queryNodes,
      singleSearch,
      getDetails,
      getConfig,
      statusMessage,
      setStatusMessage,
      getTipAtts,
      getNextstrainJson,
      getOverallSpectrum,
      type: "local",
    };
  }, [
    queryNodes,
    singleSearch,
    getDetails,
    getConfig,
    statusMessage,
    setStatusMessage,
    getTipAtts,
    getNextstrainJson,
    getOverallSpectrum,
  ]);
}

export default useLocalBackend;
