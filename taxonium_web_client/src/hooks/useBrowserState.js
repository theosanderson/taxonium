import { useMemo, useCallback, useState, useEffect } from "react";

const useBrowserState = (
    data,
    deckRef,
    view,
    settings
) => {
    const [yBounds, setYBounds] = useState([0, 0]);
    const [xBounds, setXbounds] = useState([0, 0]);
    const [ntBoundsExt, setNtBoundsExt] = useState(null);
    const [pxPerBp, setPxPerBp] = useState(0);
    const [bpWidth, setBpWidth] = useState(0);
    const [isCov2Tree, setIsCov2Tree] = useState(false);

    const [genomeSize, setGenomeSize] = useState(0);
    const [genome, setGenome] = useState(null);
    const chromosomeName = useMemo(() => {
        return isCov2Tree ? 'NC_045512v2' : 'chromosome';
    })

    useEffect(() => {
        if ((genomeSize && genomeSize > 0) || !data || !data.base_data || !data.base_data.nodes) {
            return;
        }
        const nodes = data.base_data.nodes;
        for (let node of nodes) {
            if (node.parent_id == node.node_id) {
                // root
                let size = 0;
                let genome = '';
                for (let mut of node.mutations) {
                    if (mut.gene == 'nt') {
                        size += 1;
                        genome += mut.new_residue;
                    }
                }
                setGenomeSize(size);
                setGenome(genome);
            }
        }
    }, [setGenomeSize, genomeSize, genome, setGenome, data]);


    useEffect(() => {
        if (window.location.href.includes("cov2tree.org")) {
            setIsCov2Tree(true);
        }
    }, [window.location])


    
    const [ntBounds, setNtBounds] = useState([0, genomeSize]);



    useEffect(() => {
        if (!data.data || !data.data.nodes || !settings.browserEnabled) {
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
    }, [data.data, settings.browserEnabled]);

    
    const handleResize = useCallback(() => {
        console.log("calling handleResize");
        console.log(deckRef.current, settings.browserEnabled);
        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager || !settings.browserEnabled) {
            return;
        }
        console.log("here in handleResize");
        const tempViewState = {...view.viewState};
        console.log("tempViewState", tempViewState);
        view.setViewState(view.baseViewState);
        console.log("baseViewState", view.baseViewState);
        const vp = {
                ...deckRef.current.deck.getViewports()[1],
            }
            console.log("unprojecting:::resize")
            vp && setXbounds([vp.unproject([0, 0])[0], vp.unproject([vp.width, 0])[0]]);

        view.setViewState(tempViewState);
        console.log("back to ", view.viewState);
        
       
 
    }, [deckRef, setXbounds, view, settings.browserEnabled]);

    useEffect(() => {
        if(!settings.browserEnabled) {
            setJbrowseLoaded(false);
            setHandled(false)
        }
    }, [settings.browserEnabled]);

    const [jbrowseLoaded, setJbrowseLoaded] = useState(false);
    const [handled, setHandled] = useState(false);
    useEffect(() => {
        if (jbrowseLoaded && !handled) {
            console.log("handle resize")
            window.setTimeout(() => {
                handleResize();
            }, 200);
            setHandled(true);
        }
    }, [jbrowseLoaded, handleResize, setHandled, handled]);

    useEffect(() => {
        const observer = new MutationObserver(function (mutations, mutationInstance) {
            const jbrowse = document.getElementById('view-browser-axis');
            if (jbrowse) {
                console.log("set jbrowse loaded");
                setJbrowseLoaded(jbrowse);
                mutationInstance.disconnect();
            }
        });
        
        observer.observe(document, {
            childList: true,
            subtree:   true
        });
    }, []);


    useEffect(() => {
        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager || !settings.browserEnabled) {
            return;
        }
        const vp = {
            ...deckRef.current.deck.getViewports()[1],
     
            }
        
        if (pxPerBp) {
            console.log('thisone')

            setBpWidth(vp.unproject([pxPerBp, 0])[0] - vp.unproject([0, 0])[0]);
        }
    }, [deckRef, pxPerBp, settings.browserEnabled]);

    const state = useMemo(() => {
        return {
            xBounds,
            yBounds,
            ntBounds,
            setNtBounds,
            setNtBoundsExt,
            pxPerBp,
            setPxPerBp,
            bpWidth,
            handleResize,
            isCov2Tree,
            genome,
            genomeSize,
            chromosomeName
        }
    }, [xBounds, yBounds, ntBounds, setNtBounds, setNtBoundsExt, pxPerBp, setPxPerBp, bpWidth, handleResize, isCov2Tree, genome, genomeSize, chromosomeName]);

    return state;
};

export default useBrowserState;