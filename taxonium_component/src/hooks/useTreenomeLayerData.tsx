import { useCallback, useMemo, useEffect, useState } from "react";

import workerSpec from "../webworkers/treenomeWorker.js?worker&inline";
import type { VariationDatum } from "../types/treenome";

import type {
  TreenomeState as BaseTreenomeState,
} from "../types/treenome";
import type { DynamicData } from "../types/backend";
import type { Settings } from "../types/settings";

interface TreenomeState extends BaseTreenomeState {}

const useTreenomeLayerData = (
  data: DynamicData,
  treenomeState: TreenomeState,
  settings: Settings,
  selectedDetails: { nodeDetails?: { y: number } | null }
) => {

  const [varDataAa, setVarDataAa] = useState<VariationDatum<Record<string, unknown>>[]>([]);
  const [varDataNt, setVarDataNt] = useState<VariationDatum<Record<string, unknown>>[]>([]);
  const [numNodes, setNumNodes] = useState(0);
  const [cachedVarDataAa, setCachedVarDataAa] = useState<VariationDatum<Record<string, unknown>>[]>([]);
  const [cachedVarDataNt, setCachedVarDataNt] = useState<VariationDatum<Record<string, unknown>>[]>([]);
  const [treenomeReferenceInfo, setTreenomeReferenceInfo] = useState<
    Record<string, Record<string, string>> | null
  >(null);
  const [didFirstAa, setDidFirstAa] = useState(false);
  const [didFirstNt, setDidFirstNt] = useState(false);

  const [currentJobId, setCurrentJobId] = useState(null);

  const worker = useMemo(() => new workerSpec(), []);

  worker.onmessage = useCallback(
    (e: MessageEvent<any>) => {
      if (!treenomeReferenceInfo && e.data.treenomeReferenceInfo) {
        setTreenomeReferenceInfo(e.data.treenomeReferenceInfo);
      }

      if (e.data.type === "variation_data_return_cache_aa") {
        setCachedVarDataAa(e.data.filteredVarData);
        setVarDataAa(e.data.filteredVarData);
      } else if (e.data.type === "variation_data_return_aa") {
        setVarDataAa(e.data.filteredVarData);
      } else if (e.data.type === "variation_data_return_cache_nt") {
        setCachedVarDataNt(e.data.filteredVarData);
        setVarDataNt(e.data.filteredVarData);
      } else if (e.data.type === "variation_data_return_nt") {
        setVarDataNt(e.data.filteredVarData);
      }
    },
    [
      treenomeReferenceInfo,
      setTreenomeReferenceInfo,
      setVarDataAa,
      setVarDataNt,
      setCachedVarDataAa,
      setCachedVarDataNt,
    ]
  );

  useEffect(() => {
    if (!(data.data && data.data.nodes)) {
      return;
    }

    if (
      !didFirstAa &&
      data.data &&
      data.data.nodes &&
      treenomeState.genomeSize > 0 &&
      treenomeState.ntBounds[0] === 0 &&
      treenomeState.ntBounds[1] === treenomeState.genomeSize
    ) {
      if (settings.mutationTypesEnabled.aa) {
        const jobId = data.data.nodes.length;
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds,
        });
      }
      setDidFirstAa(true);
    }
    if (
      !didFirstNt &&
      data.data &&
      data.data.nodes &&
      treenomeState.genomeSize > 0 &&
      treenomeState.ntBounds[0] === 0 &&
      treenomeState.ntBounds[1] === treenomeState.genomeSize
    ) {
      if (settings.mutationTypesEnabled.nt) {
        const jobId = data.data.nodes.length;
        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds,
        });
      }
      setDidFirstNt(true);
    }
    if (!settings.treenomeEnabled) {
      return;
    }

    if (data.data.nodes.length >= 90000) {
      if (cachedVarDataAa.length > 0 && cachedVarDataAa !== varDataAa) {
        setVarDataAa(cachedVarDataAa);
      }
      if (cachedVarDataNt.length > 0) {
        setVarDataNt(cachedVarDataNt);
      }
      if (settings.mutationTypesEnabled.aa && cachedVarDataAa.length > 0) {
        if (cachedVarDataNt.length > 0 || !settings.mutationTypesEnabled.nt) {
          setNumNodes(data.data.nodes.length);
          return;
        }
      }
      if (settings.mutationTypesEnabled.nt && cachedVarDataNt.length > 0) {
        if (cachedVarDataAa.length > 0 || !settings.mutationTypesEnabled.aa) {
          setNumNodes(data.data.nodes.length);
          return;
        }
      }
    }
    let skipAa = false;
    let skipNt = false;
    if (numNodes === data.data.nodes.length) {
      // only ntBounds changed, need to recompute only if < 1000 nts are visible
      if (!data.data || !data.data.nodes) {
        return;
      }
      if (settings.mutationTypesEnabled.aa && varDataAa.length > 0) {
        setVarDataAa(varDataAa);
        skipAa = true;
      }
      if (settings.mutationTypesEnabled.nt && varDataNt.length > 0) {
        setVarDataNt(varDataNt);
        skipNt = true;
      }
    }
    // full computation
    setNumNodes(data.data.nodes.length);
    let jobId = data.data.nodes.length;
    if (!skipAa) {
      if (settings.mutationTypesEnabled.aa) {
        worker.postMessage({
          type: "variation_data_aa",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds,
        });
      }
    }
    if (!skipNt) {
      if (settings.mutationTypesEnabled.nt) {
        worker.postMessage({
          type: "variation_data_nt",
          data: data,
          jobId: jobId,
          ntBounds: treenomeState.ntBounds,
        });
      }
    }
  }, [
    data.data,
    numNodes,
    settings.treenomeEnabled,
    varDataAa,
    varDataNt,
    worker,
    settings.mutationTypesEnabled,
    treenomeState.ntBounds,
    currentJobId,
    setCurrentJobId,
    cachedVarDataAa,
    cachedVarDataNt,
    data,
    didFirstAa,
    treenomeState.genomeSize,
    didFirstNt,
  ]);

  return [
    varDataAa,
    varDataNt,
    treenomeReferenceInfo,
    cachedVarDataAa,
    cachedVarDataNt,
  ] as [
    VariationDatum<Record<string, unknown>>[],
    VariationDatum<Record<string, unknown>>[],
    Record<string, Record<string, string>> | null,
    VariationDatum<Record<string, unknown>>[],
    VariationDatum<Record<string, unknown>>[]
  ];
};

export default useTreenomeLayerData;
