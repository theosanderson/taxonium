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
  const [currentJobId, setCurrentJobId] = useState(null)
  const worker = useMemo(() => new Worker(new URL("../webworkers/browserWorker.js", import.meta.url)), []);

  worker.onmessage = useCallback((e) => {
    if (!reference && e.data.reference) {
      setReference(e.data.reference)
    }

    if (e.data.type == "variation_data_return_cache_aa") {
      //     console.log("CACHE AA", e.data.filteredVarData)
      setCachedVarDataAa(e.data.filteredVarData)
      setVarDataAa(e.data.filteredVarData);
    } else if (e.data.type == "variation_data_return_aa") {
      //      console.log("SENDING AA")
      setVarDataAa(e.data.filteredVarData)
    } else if (e.data.type == "variation_data_return_cache_nt") {
      setCachedVarDataNt(e.data.filteredVarData)
      setVarDataNt(e.data.filteredVarData);
    } else if (e.data.type == "variation_data_return_nt") {
      console.log("got computer nuc")
      setVarDataNt(e.data.filteredVarData)
    }
  }, [reference, setReference, setVarDataAa, setVarDataNt, setCachedVarDataAa, setCachedVarDataNt, currentJobId])

  useEffect(() => {


    if (!(data.data && data.data.nodes)) {
      return;
    }

    setNumNodes(data.data.nodes.length)

    if (cachedVarDataAa.length == 0 && data.data && data.data.nodes && browserState.ntBounds != [0, 0]) {
      if (settings.mutationTypesEnabled.aa) {
        const jobId = data.data.nodes.length;
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: browserState.ntBounds
        });
      }
    }
    if (cachedVarDataNt.length == 0 && data.data && data.data.nodes && browserState.ntBounds != [0, 0]) {
      if (settings.mutationTypesEnabled.nt) {
        const jobId = data.data.nodes.length;
        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: browserState.ntBounds
        });
      }
    }


    if (!settings.browserEnabled) {
      return;
    }
    if (data.data.nodes.length >= 90000) {
      
      if (cachedVarDataAa.length > 0) {
        console.log("cacheaa")
        setVarDataAa(cachedVarDataAa);
      }
      if (cachedVarDataNt.length > 0) {
        setVarDataNt(cachedVarDataNt);
      }
      if (settings.mutationTypesEnabled.aa && cachedVarDataAa.length > 0) {
        if (cachedVarDataNt.length > 0 || !settings.mutationTypesEnabled.nt) {
          return;
        }
      }
      if (settings.mutationTypesEnabled.nt && cachedVarDataNt.length > 0) {
        if (cachedVarDataAa.length > 0 || !settings.mutationTypesEnabled.aa) {
          return;
        }
      }
    }
    if (numNodes == data.data.nodes.length) { // only ntBounds changed 
      if (!data.data || !data.data.nodes || !(varDataAa) || !(varDataNt)) {
        return;
      }
      setVarDataAa(varDataAa);
      setVarDataNt(varDataNt);

    } else { // full computation

      if (cachedVarDataAa.length > 0) {
        setVarDataAa(cachedVarDataAa);
        const jobId = data.data.nodes.length;
        if (settings.mutationTypesEnabled.aa) {
          worker.postMessage({
            type: "variation_data_aa",
            data: data,
            jobId: jobId,
            ntBounds: browserState.ntBounds
          });
        }
      }
      if (cachedVarDataNt.length > 0) {
        setVarDataNt(cachedVarDataNt);
        const jobId = data.data.nodes.length;
        if (settings.mutationTypesEnabled.nt) {
          worker.postMessage({
            type: "variation_data_nt",
            data: data,
            jobId: jobId,
            ntBounds: browserState.ntBounds
          });
        }

      }

    }



  }, [data.data, settings.mutationTypesEnabled, browserState.ntBounds, currentJobId, setCurrentJobId]);

  return [varDataAa, varDataNt, reference]
}

export default useBrowserLayerData;
