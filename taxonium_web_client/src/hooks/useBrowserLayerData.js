import { useCallback, useMemo, useEffect, useState } from "react";



const useBrowserLayerData = (data, browserState, settings) => {

  const [existingWorker, setExistingWorker] = useState(null);
  const [varData, setVarData] = useState([]);
  const [numNodes, setNumNodes] = useState(0);
  const [cachedVarData, setCachedVarData] = useState([]);
  const [reference, setReference] = useState(null);
  // const worker = useMemo(() => new Worker(new URL("../webworkers/browserWorker.js", import.meta.url)), []);

  useEffect(() => {
    if (existingWorker) {
      // Without this, memory blows up possibly due to garbage
      // collection not running frequently enough?
      existingWorker.terminate();
    }

    const worker = new Worker(
      new URL("../webworkers/browserWorker.js", import.meta.url)
    );
    setExistingWorker(worker);



    
    

    worker.onmessage = (e) => {
      if (!reference && e.data.reference) {
        setReference(e.data.reference)
      }
      //("got message from var worker", e.data);
      if (e.data.type == "variation_data_return_cache") {
       // console.log("caching zoomed out var data")
        setCachedVarData(e.data.filteredVarData)
        setVarData(e.data.filteredVarData );
      } else if (e.data.type == "variation_data_return") {
       // console.log("normal var data return");
        setVarData(e.data.filteredVarData)
      }
    };


    if (!(data.data && data.data.nodes)) {
      return;
    }

    setNumNodes(data.data.nodes.length)

    if (cachedVarData.length == 0 || !reference) {
      worker.postMessage({
        type: "variation_data",
        data: data,
        ntBounds: browserState.ntBounds
      });
    }
    if (!settings.browserEnabled) {
      return;
    }

    if (data.data.nodes.length >= 90000) {
      if (cachedVarData.length > 0) {
        console.log("returning cached....");
        setVarData(cachedVarData);

        return;
      }
    }
    if (numNodes == data.data.nodes.length) { // only ntBounds changed 
      if (!data.data || !data.data.nodes || !(varData.length > 0)) {
        return;
      }
      // just doing filtering here seems to be faster than
      // posting messages every time ntBounds changes
      if (data.data.nodes.length < 10000 || browserState.ntBounds[1] - browserState.ntBounds[0] < 1000) {
        setVarData(varData);
      } else {
        setVarData(varData.filter((d) => (d.y[1] - d.y[0]) > .002));
      }

    } else { // full computation
      setVarData(cachedVarData); 
      worker.postMessage({
        type: "variation_data",
        data: data,
        ntBounds: browserState.ntBounds
      });
    }



  }, [data.data, browserState.ntBounds]);


  return [varData, reference]
}

export default useBrowserLayerData;
