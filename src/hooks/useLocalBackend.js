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
let onSearchReceipt = (receivedData) => {};
let onConfigReceipt = (receivedData) => {};

worker.onmessage = (event) => {
  console.log("got message from worker", event.data);
  if (event.data.type === "status") {
    onStatusReceipt(event.data);
  }
  if (event.data.type === "query") {
    onQueryReceipt(event.data.data);
  }
  if (event.data.type === "search") {
    onSearchReceipt(event.data.data);
  }
  if (event.data.type === "config") {
    onConfigReceipt(event.data.data);
  }
};

function useLocalBackend(uploaded_data, proto) {
  const [statusMessage, setStatusMessage] = useState("");
  onStatusReceipt = (receivedData) => {
    console.log("STATUS:", receivedData.data);
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
    async (boundsForQueries, setResult, setTriggerRefresh) => {
      console.log("queryNodes", boundsForQueries);
      worker.postMessage({
        type: "query",
        bounds: boundsForQueries,
      });
      onQueryReceipt = (receivedData) => {
        console.log("got query result", receivedData);
        setResult(receivedData);
      };
    },
    []
  );

  const singleSearch = useCallback(
    (singleSearch, boundsForQueries, setResult) => {
      console.log("singleSearch", singleSearch);
      worker.postMessage({
        type: "search",
        search: singleSearch,
        bounds: boundsForQueries,
      });
      onSearchReceipt = (receivedData) => {
        console.log("got search result", receivedData);
        setResult(receivedData);
      };
    },
    []
  );

  const getDetails = useCallback(() => {
    console.log("getDetails");
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

  return useMemo(() => {
    return { queryNodes, singleSearch, getDetails, getConfig, statusMessage };
  }, [queryNodes, singleSearch, getDetails, getConfig, statusMessage]);
}

export default useLocalBackend;
