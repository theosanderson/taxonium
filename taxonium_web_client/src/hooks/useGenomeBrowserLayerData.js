import { useCallback, useMemo, useEffect, useState } from "react";



const useGenomeBrowserLayerData = (data, genomeBrowserState, settings, selectedDetails) => {

  const [varDataAa, setVarDataAa] = useState([]);
  const [varDataNt, setVarDataNt] = useState([]);
  const [numNodes, setNumNodes] = useState(0);
  const [cachedVarDataAa, setCachedVarDataAa] = useState([]);
  const [cachedVarDataNt, setCachedVarDataNt] = useState([]);
  const [reference, setReference] = useState(null);
  const [didFirstAa, setDidFirstAa] = useState(false);
  const [didFirstNt, setDidFirstNt] = useState(false);

  const [currentJobId, setCurrentJobId] = useState(null)
  const worker = useMemo(() => new Worker(new URL("../webworkers/genomeBrowserWorker.js", import.meta.url)), []);

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


    if (!didFirstAa && data.data && data.data.nodes && genomeBrowserState.genomeSize > 0 &&
      genomeBrowserState.ntBounds[0] == 0 && genomeBrowserState.ntBounds[1] == genomeBrowserState.genomeSize) {
      if (settings.mutationTypesEnabled.aa) {
        const jobId = data.data.nodes.length;
        console.log("sending init aa", data.data.nodes, genomeBrowserState.ntBounds)
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: genomeBrowserState.ntBounds
        });
      }
      setDidFirstAa(true)
    }
    if (!didFirstNt && data.data && data.data.nodes && genomeBrowserState.genomeSize > 0 &&
      genomeBrowserState.ntBounds[0] == 0 && genomeBrowserState.ntBounds[1] == genomeBrowserState.genomeSize) {
      if (settings.mutationTypesEnabled.nt) {
        const jobId = data.data.nodes.length;
        console.log("sending init nt")

        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: genomeBrowserState.ntBounds
        });
      }
      setDidFirstNt(true);
    }
    if (!settings.genomeBrowserEnabled) {
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
          ntBounds: genomeBrowserState.ntBounds
        });
      }
    }
    if (!skipNt) {
      if (settings.mutationTypesEnabled.nt) {
        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: genomeBrowserState.ntBounds
        });
      }
    }
  }, [data.data, numNodes, settings.genomeBrowserEnabled, varDataAa, varDataNt, worker, settings.mutationTypesEnabled, genomeBrowserState.ntBounds, currentJobId, setCurrentJobId, cachedVarDataAa, cachedVarDataNt]);

  return [varDataAa, varDataNt, reference]
}

export default useGenomeBrowserLayerData;
