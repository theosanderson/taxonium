import { useMemo, useCallback, useState, useEffect } from "react";

const useTreenomeState = (data, deckRef, view, settings) => {
  const [yBounds, setYBounds] = useState([0, 0]);
  const [baseYBounds, setBaseYBounds] = useState([0, 0]);
  const [xBounds, setXbounds] = useState([0, 0]);
  const [pxPerBp, setPxPerBp] = useState(0);
  const [bpWidth, setBpWidth] = useState(0);

  const [genomeSize, setGenomeSize] = useState(0);
  const [genome, setGenome] = useState(null);

  useEffect(() => {
    if (
      (genomeSize && genomeSize > 0) ||
      !data ||
      !data.base_data ||
      !data.base_data.nodes
    ) {
      return;
    }
    const nodes = data.base_data.nodes;
    for (let node of nodes) {
      if (node.parent_id === node.node_id) {
        let size = 0;
        let genome = "";
        for (let mut of node.mutations) {
          if (mut.gene === "nt") {
            if (size < mut.residue_pos) {
              size = mut.residue_pos;
            }
            genome += mut.new_residue;
          }
        }
        setGenomeSize(size);
        setGenome(genome);
      }
    }
  }, [setGenomeSize, genomeSize, genome, setGenome, data]);

  const [ntBounds, setNtBounds] = useState([0, genomeSize]);

  useEffect(() => {
    if (!data.data || !data.data.nodes || !settings.treenomeEnabled) {
      return;
    }
    const bounds = [0, 0];
    for (let node of data.data.nodes) {
      if (node.y < bounds[0]) {
        bounds[0] = node.y;
      }
      if (node.y > bounds[1]) {
        bounds[1] = node.y;
      }
    }
    setYBounds(bounds);
  }, [data.data, settings.treenomeEnabled]);

  useEffect(() => {
    if (!data.base_data || !data.base_data.nodes || !settings.treenomeEnabled) {
      return;
    }
    const bounds = [0, 0];
    for (let node of data.base_data.nodes) {
      if (node.y < bounds[0]) {
        bounds[0] = node.y;
      }
      if (node.y > bounds[1]) {
        bounds[1] = node.y;
      }
    }
    setBaseYBounds(bounds);
  }, [data.base_data, settings.treenomeEnabled]);

  const handleResize = useCallback(() => {
    if (
      !deckRef.current ||
      !deckRef.current.deck ||
      !deckRef.current.deck.viewManager ||
      !settings.treenomeEnabled
    ) {
      return;
    }
    const tempViewState = { ...view.viewState };
    view.setViewState(view.baseViewState);
    const vp = {
      ...deckRef.current.deck.getViewports()[1],
    };
    vp && setXbounds([vp.unproject([0, 0])[0], vp.unproject([vp.width, 0])[0]]);

    view.setViewState(tempViewState);
  }, [deckRef, setXbounds, view, settings.treenomeEnabled]);

  useEffect(() => {
    if (!settings.treenomeEnabled) {
      setJbrowseLoaded(false);
      setHandled(false);
    }
  }, [settings.treenomeEnabled]);

  const [jbrowseLoaded, setJbrowseLoaded] = useState(false);
  const [handled, setHandled] = useState(false);
  useEffect(() => {
    if (jbrowseLoaded && !handled) {
      window.setTimeout(() => {
        handleResize();
      }, 200);
      setHandled(true);
    }
  }, [jbrowseLoaded, handleResize, setHandled, handled]);

  useEffect(() => {
    const observer = new MutationObserver(function (
      mutations,
      mutationInstance,
    ) {
      const jbrowse = document.getElementById("view-browser-axis");
      if (jbrowse) {
        setJbrowseLoaded(jbrowse);
        mutationInstance.disconnect();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
    });
  }, []);

  useEffect(() => {
    if (
      !deckRef.current ||
      !deckRef.current.deck ||
      !deckRef.current.deck.viewManager ||
      !settings.treenomeEnabled
    ) {
      return;
    }
    const vp = {
      ...deckRef.current.deck.getViewports()[1],
    };

    if (pxPerBp) {
      setBpWidth(vp.unproject([pxPerBp, 0])[0] - vp.unproject([0, 0])[0]);
    }
  }, [deckRef, pxPerBp, settings.treenomeEnabled]);

  const state = useMemo(() => {
    return {
      xBounds,
      yBounds,
      ntBounds,
      setNtBounds,
      pxPerBp,
      setPxPerBp,
      bpWidth,
      handleResize,
      genome,
      genomeSize,
      baseYBounds,
    };
  }, [
    xBounds,
    yBounds,
    ntBounds,
    setNtBounds,
    pxPerBp,
    setPxPerBp,
    bpWidth,
    handleResize,
    genome,
    genomeSize,
    baseYBounds,
  ]);

  return state;
};

export default useTreenomeState;
