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
console.log("new worker");
//const workerPath = "../webworkers/localBackendWorker.js";

import workerSpec from "../webworkers/localBackendWorker.js?worker&inline";

//const url = new URL('../webworkers/localBackendWorker.js', import.meta.url)
//const getWorker = () => new Worker(url, { type: 'module' })

const worker = new workerSpec();

let onQueryReceipt: (receivedData: NodesResponse) => void = () => {};
let onStatusReceipt: (receivedData: StatusData) => void = (receivedData) => {
  console.log("STATUS:", receivedData.data);
};

let onConfigReceipt: (receivedData: Config) => void = () => {};
let onDetailsReceipt: (receivedData: NodeDetails) => void = () => {};
let onListReceipt: (receivedData: ListData["data"]) => void = () => {};
let onNextStrainReceipt: (receivedData: NextStrainData["data"]) => void = (
  receivedData
) => {
  console.log("NEXT STRAIN:", receivedData);
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
  console.log("got message from worker");
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
    console.log("STATUS:", receivedData.data);
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
    console.log("Sending data to worker");
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
      console.log("queryNodes", boundsForQueries);
      worker.postMessage({
        type: "query",
        bounds: boundsForQueries,
      });
      onQueryReceipt = (receivedData) => {
        //  console.log("CONFIG IS", config);
        console.log(
          "got query result" //, receivedData
        );
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
      console.log("singleSearch", singleSearch, "key", key);
      worker.postMessage({
        type: "search",
        search: singleSearch,
        bounds: boundsForQueries,
      });

      searchSetters[key] = (receivedData) => {
        console.log(
          "got search result from ",
          key,
          //   singleSearch,
          "result"
          //   receivedData
        );
        setResult(receivedData);
      };
      return {
        abortController: {
          abort: () => console.log("no controller for local"),
        },
      };
    },
    []
  );

  const getDetails = useCallback(
    (node_id: string | number, setResult: (res: NodeDetails) => void) => {
      console.log("getDetails", node_id);
      worker.postMessage({
        type: "details",
        node_id: node_id,
      });
      onDetailsReceipt = (receivedData) => {
        console.log("got details result", receivedData);
        setResult(receivedData);
      };
    },
    []
  );

  const getConfig = useCallback((setResult: (res: Config) => void) => {
    console.log("getConfig");
    worker.postMessage({
      type: "config",
    });

    onConfigReceipt = (receivedData) => {
      console.log("got config result", receivedData);
      setResult(receivedData);
    };
  }, []);

  const getTipAtts = useCallback(
    (
      nodeId: string | number,
      selectedKey: string,
      callback: (err: unknown, data: unknown) => void
    ) => {
    console.log("getTipAtts", nodeId, selectedKey);
    worker.postMessage({
      type: "list",
      node_id: nodeId,
      key: selectedKey,
    });

    onListReceipt = (receivedData) => {
      console.log("got list result", receivedData);
      callback(null, receivedData);
    };
  }, []);

  const getNextstrainJson = useCallback((nodeId: string | number, config: Config) => {
    console.log("getNextstrainJson", nodeId);
    worker.postMessage({
      type: "nextstrain",
      node_id: nodeId,
      config: config,
    });
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
  ]);
}

export default useLocalBackend;
