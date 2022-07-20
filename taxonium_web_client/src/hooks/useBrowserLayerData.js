import { useCallback, useMemo, useEffect, useState } from "react";



const useBrowserLayerData = (data, browserState, settings, selectedDetails) => {

  const [existingWorker, setExistingWorker] = useState(null);
  const [varDataAa, setVarDataAa] = useState([]);
  const [varDataNt, setVarDataNt] = useState([]);
  const [numNodes, setNumNodes] = useState(0);
  const [cachedVarDataAa, setCachedVarDataAa] = useState([]);
  const [cachedVarDataNt, setCachedVarDataNt] = useState([]);
  const [reference, setReference] = useState(null);
  const [didFirstAa, setDidFirstAa] = useState(false);
  const [didFirstNt, setDidFirstNt] = useState(false);

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


    if (!didFirstAa && data.data && data.data.nodes && browserState.genomeSize > 0 &&
      browserState.ntBounds[0] == 0 && browserState.ntBounds[1] == browserState.genomeSize) {
      if (settings.mutationTypesEnabled.aa) {
        const jobId = data.data.nodes.length;
        console.log("sending init aa", data.data.nodes, browserState.ntBounds)
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: browserState.ntBounds
        });
      }
      setDidFirstAa(true)
    }
    if (!didFirstNt && data.data && data.data.nodes && browserState.genomeSize > 0 &&
      browserState.ntBounds[0] == 0 && browserState.ntBounds[1] == browserState.genomeSize) {
      if (settings.mutationTypesEnabled.nt) {
        const jobId = data.data.nodes.length;
        console.log("sending init nt")

        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: browserState.ntBounds
        });
      }
      setDidFirstNt(true);
    }
    if (!settings.browserEnabled) {
      return;
    }

    if (data.data.nodes.length >= 90000) {
      if (cachedVarDataAa.length > 0 && cachedVarDataAa != varDataAa) {
        setVarDataAa(cachedVarDataAa);
      }
      if (cachedVarDataNt.length > 0) {
        setVarDataNt(cachedVarDataNt);
      }
      if (settings.mutationTypesEnabled.aa && cachedVarDataAa.length > 0) {
        if (cachedVarDataNt.length > 0 || !settings.mutationTypesEnabled.nt) {
          setNumNodes(data.data.nodes.length)
          return;
        }
      }
      if (settings.mutationTypesEnabled.nt && cachedVarDataNt.length > 0) {
        if (cachedVarDataAa.length > 0 || !settings.mutationTypesEnabled.aa) {
          setNumNodes(data.data.nodes.length)
          return;
        }
      }
    }
    let skipAa = false;
    let skipNt = false;
    if (numNodes == data.data.nodes.length) {
      // only ntBounds changed, need to recompute only if < 1000 nts are visible
      console.log("sament")
      if (!data.data || !data.data.nodes) {
        return;
      }
      if (settings.mutationTypesEnabled.aa && varDataAa.length > 0) {
        setVarDataAa(varDataAa);
        skipAa = true;
      }
      if (settings.mutationTypesEnabled.nt && varDataNt.length > 0) {
        setVarDataNt(varDataNt);
        console.log("Skip nt" )
        skipNt = true;
      }
    }
    // full computation
    setNumNodes(data.data.nodes.length)
    let jobId = data.data.nodes.length;
    if (!skipAa) {
      if (settings.mutationTypesEnabled.aa) {
        console.log("sending to be doing aa")
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: browserState.ntBounds
        });
      }
    }
    if (!skipNt) {
      if (settings.mutationTypesEnabled.nt) {
        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: browserState.ntBounds
        });
      }
    }
  }, [data.data, numNodes, settings.browserEnabled, varDataAa, varDataNt, worker, settings.mutationTypesEnabled, browserState.ntBounds, currentJobId, setCurrentJobId, cachedVarDataAa, cachedVarDataNt]);

  return [varDataAa, varDataNt, reference]
}

export default useBrowserLayerData;
