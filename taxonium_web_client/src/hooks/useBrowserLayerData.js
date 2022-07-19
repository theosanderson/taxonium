import { useCallback, useMemo, useEffect, useState } from "react";



const useBrowserLayerData = (data, browserState, settings, selectedDetails) => {

  const [existingWorker, setExistingWorker] = useState(null);
  const [varDataAa, setVarDataAa] = useState([]);
  const [varDataNt, setVarDataNt] = useState([]);
  const [numNodes, setNumNodes] = useState(0);
  const [cachedVarDataAa, setCachedVarDataAa] = useState([]);
  const [cachedVarDataNt, setCachedVarDataNt] = useState([]);
  const [reference, setReference] = useState(null);
  const [didFirst, setDidFirst] = useState(false);
  const worker = useMemo(() => new Worker(new URL("../webworkers/browserWorker.js", import.meta.url)), []);

  useEffect(() => {
    worker.onmessage = (e) => {
      if (!reference && e.data.reference) {
        setReference(e.data.reference)
      }
      console.log("got message from var worker", e.data);
      if (e.data.type == "variation_data_return_cache_aa") {
        console.log("CACHE AA", e.data.filteredVarData)
        setCachedVarDataAa(e.data.filteredVarData)
        setVarDataAa(e.data.filteredVarData);
      } else if (e.data.type == "variation_data_return_aa") {
        console.log("SENDING AA")
        setVarDataAa(e.data.filteredVarData)
      } else if (e.data.type == "variation_data_return_cache_nt") {
        console.log("CACHE NT")
        setCachedVarDataNt(e.data.filteredVarData)
        setVarDataNt(e.data.filteredVarData);
      } else if (e.data.type == "variation_data_return_nt") {
        console.log("SENDING NT")
        setVarDataNt(e.data.filteredVarData)
      }
    };

    if (!(data.data && data.data.nodes)) {
      return;
    }

    setNumNodes(data.data.nodes.length)

    if (cachedVarDataAa.length == 0) {
      worker.postMessage({
        type: "variation_data_aa",
        data: data,
        ntBounds: browserState.ntBounds
      });
    }
    if (cachedVarDataNt.length == 0) {
      worker.postMessage({
        type: "variation_data_nt",
        data: data,
        ntBounds: browserState.ntBounds
      });
    }

    if (!settings.browserEnabled) {
      return;
    }

    if (data.data.nodes.length >= 90000) {
      if (cachedVarDataAa.length > 0) {
        console.log("returning cached....");
        setVarDataAa(cachedVarDataAa);
        return;
      }
      if (cachedVarDataNt.length > 0) {
        setVarDataNt(cachedVarDataNt);
        return;
      }
    }
    if (numNodes == data.data.nodes.length) { // only ntBounds changed 
      if (!data.data || !data.data.nodes || !(varDataAa) || !(varDataNt)) {
        return;
      }
      setVarDataAa(varDataAa);
      setVarDataNt(varDataNt);

    } else { // full computation
      setVarDataAa(cachedVarDataAa);
      setVarDataNt(cachedVarDataNt);
      worker.postMessage({
        type: "variation_data_aa",
        data: data,
        ntBounds: browserState.ntBounds
      });
      worker.postMessage({
        type: "variation_data_nt",
        data: data,
        ntBounds: browserState.ntBounds
      });

    }



  }, [data.data, browserState.ntBounds]);

  return [varDataAa, varDataNt, reference]
}

export default useBrowserLayerData;
