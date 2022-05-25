import { useMemo, useCallback, useState, useEffect } from "react";

const useBrowserState = (
    data,
    deckRef,
    updateBrowserBounds,
    setUpdateBrowserBounds
) => {


    const [yBounds, setYBounds] = useState([0, 0]);
    const [xBounds, setXbounds] = useState([0, 0]);
    const [ntBounds, setNtBounds] = useState([0, 29903]);
    const [ntBoundsExt, setNtBoundsExt] = useState(null);
    const [pxPerBp, setPxPerBp] = useState(0);
    const [bpWidth, setBpWidth] = useState(0);

    useEffect(() => {
        if (!data.data || !data.data.nodes) {
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
    }, [data.data]);

    const handleResize = useCallback(() => {

        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager) {
            return;
        }
        console.log(deckRef.current.deck.getViewports())
        const vp = {
                ...deckRef.current.deck.getViewports()[1],
                zoom: 0
               }
        // if (Math.abs(vp.unproject([vp.width, 0])[0] - xBounds[1]) > ) {
            console.log(vp.width)
            vp && setXbounds([vp.unproject([0, 0])[0], vp.unproject([vp.width, 0])[0]]);
      //  }
    }, [deckRef, setXbounds]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
    }, [handleResize]);
    
    // useEffect(() => {
    //     setUpdateBrowserBounds(false);
    //     window.dispatchEvent(new Event('resize'));

    // }, [updateBrowserBounds, setUpdateBrowserBounds]);
    useEffect(() => {

        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager) {
            return;
        }
        console.log(deckRef.current.deck.getViewports())

        if (xBounds[0] == 0 && xBounds[1] == 0) {
            const vp = {
                ...deckRef.current.deck.getViewports()[2],
                zoom: 0
            }
            vp && setXbounds([vp.unproject([0, 0])[0], vp.unproject([vp.width, 0])[0]]);
        }
    }, [deckRef, xBounds, yBounds]);

    useEffect(() => {
        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager) {
            return;
        }
        const vp = {
            ...deckRef.current.deck.getViewports()[2],
            zoom: 0
            }
        if (pxPerBp) {
            setBpWidth(vp.unproject([pxPerBp, 0])[0] - vp.unproject([0, 0])[0]);
        }
    }, [deckRef, pxPerBp]);

    const state = useMemo(() => {
        return {
            xBounds,
            yBounds,
            ntBounds,
            setNtBounds,
            setNtBoundsExt,
            pxPerBp,
            setPxPerBp,
            bpWidth
        }
    }, [xBounds, yBounds, ntBounds, setNtBounds, setNtBoundsExt, pxPerBp, setPxPerBp, bpWidth]);

    return state;
};

export default useBrowserState;