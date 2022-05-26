import { useCallback, useMemo, useEffect, useState } from "react";

// test
console.log("new worker");
const worker = new Worker(
  new URL("../webworkers/localBackendWorker.js", import.meta.url)
);

let onQueryReceipt = (receivedData) => {};
let onStatusReceipt = (receivedData) => {
  console.log("STATUS:", receivedData.data);
};

let onConfigReceipt = (receivedData) => {};
let onDetailsReceipt = (receivedData) => {};
let onListReceipt = (receivedData) => {};

let searchSetters = {};

worker.onmessage = (event) => {
  console.log("got message from worker"//, event.data
  );
  if (event.data.type === "status") {
    onStatusReceipt(event.data);
  }
  if (event.data.type === "query") {
    onQueryReceipt(event.data.data);
  }
  if (event.data.type === "search") {
    console.log("SEARCHRES", event.data.data);
    searchSetters[event.data.data.key](event.data.data);
  }
  if (event.data.type === "config") {
    onConfigReceipt(event.data.data);
  }
  if (event.data.type === "details") {
    onDetailsReceipt(event.data.data);
  }
  if (event.data.type === "list") {
    onListReceipt(event.data.data);
  }
};

function useLocalBackend(uploaded_data, proto) {
  const [statusMessage, setStatusMessage] = useState({ message: null });
  onStatusReceipt = (receivedData) => {
    console.log("STATUS:", receivedData.data);
    if (receivedData.data.error) {
      window.alert(receivedData.data.error);
      console.log("ERROR33:", receivedData.data.error);
    }
    setStatusMessage(receivedData.data);
  };
  useEffect(() => {
    console.log("Sending data to worker");
    worker.postMessage({
      type: "upload",
      data: uploaded_data,
      proto: proto,
    });
  }, [uploaded_data, proto]);

  /*
    
    
      const singleSearch = useCallback(
        (singleSearch, boundsForQueries, setResult) => {
         
        },
        [processedUploadedData]
      );
    
      const getDetails = useCallback(
        (node_id, setResult) => {
          
        },
        [processedUploadedData]
      );
    
     
      */
  const queryNodes = useCallback(
    async (boundsForQueries, setResult, setTriggerRefresh, config) => {
      console.log("queryNodes", boundsForQueries);
      worker.postMessage({
        type: "query",
        bounds: boundsForQueries,
      });
      onQueryReceipt = (receivedData) => {
        //  console.log("CONFIG IS", config);
        console.log("got query result"//, receivedData
        );
        receivedData.nodes.forEach((node) => {
          if (node.node_id === config.rootId) {
            node.mutations = config.rootMutations.map(
              (x) => config.mutations[x]
            );
          } else {
            node.mutations = node.mutations.map(
              (mutation) => config.mutations[mutation]
            );
          }
        });
        setResult(receivedData);
      };
    },
    []
  );

  const singleSearch = useCallback(
    (singleSearch, boundsForQueries, setResult) => {
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
          singleSearch,
          "result",
          receivedData
        );
        setResult(receivedData);
      };
    },
    []
  );

  const getDetails = useCallback((node_id, setResult) => {
    console.log("getDetails", node_id);
    worker.postMessage({
      type: "details",
      node_id: node_id,
    });
    onDetailsReceipt = (receivedData) => {
      console.log("got details result", receivedData);
      setResult(receivedData);
    };
  }, []);

  const getConfig = useCallback((setResult) => {
    console.log("getConfig");
    worker.postMessage({
      type: "config",
    });

    onConfigReceipt = (receivedData) => {
      console.log("got config result", receivedData);
      setResult(receivedData);
    };
  }, []);

  const getTipAtts = useCallback((nodeId, selectedKey, callback) => {
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

  return useMemo(() => {
    return {
      queryNodes,
      singleSearch,
      getDetails,
      getConfig,
      statusMessage,
      setStatusMessage,
      getTipAtts,
    };
  }, [
    queryNodes,
    singleSearch,
    getDetails,
    getConfig,
    statusMessage,
    setStatusMessage,
    getTipAtts,
  ]);
}

export default useLocalBackend;
