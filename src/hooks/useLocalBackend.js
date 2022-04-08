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

worker.onmessage = (event) => {
  console.log("got message from worker", event.data);
  if (event.data.type === "status") {
    onStatusReceipt(event.data);
  }
  if (event.data.type === "query") {
    onQueryReceipt(event.data.data);
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

  const singleSearch = useCallback(() => {
    console.log("singleSearch");
  }, []);
  const getDetails = useCallback(() => {
    console.log("getDetails");
  }, []);
  const getConfig = useCallback((setResult) => {
    const result = {
      source: "INSDC",
      title: "Phylo",
      name_accessor: "name",
      keys_to_display: ["genotype", "meta_Lineage", "meta_Country"],
      overlay: "TODO",
      num_nodes: 4766574,
      initial_x: 2000,
      initial_y: 563.171305,
      initial_zoom: -3,
      genes: [
        "ORF7a",
        "ORF1a",
        "N",
        "ORF8",
        "ORF1b",
        "S",
        "M",
        "ORF7b",
        "ORF3a",
        "ORF10",
        "E",
        "ORF6",
      ],
    };
    setResult(result);
  }, []);

  return useMemo(() => {
    return { queryNodes, singleSearch, getDetails, getConfig, statusMessage };
  }, [queryNodes, singleSearch, getDetails, getConfig, statusMessage]);
}

export default useLocalBackend;
