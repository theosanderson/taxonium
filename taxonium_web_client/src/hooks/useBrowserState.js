import { useMemo, useCallback, useState, useEffect } from "react";

const useBrowserState = (
    data,
    deckRef,
    updateBrowserBounds,
    setUpdateBrowserBounds,
    view
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
        view.setViewState({
            //      ...tempView,
                  zoom: 0,
                  target: [window.screen.width<600? 500:1400, 1000],
                  pitch: 0,
                  bearing: 0,
                  minimap: { zoom: -3, target: [250, 1000] },
                  "browser-main": {
                    zoom: 0,
                    target: [0, 0],
                    pitch: 0,
                    bearing: 0,
                  },
                  "browser-axis": {
                    zoom: 0,
                    target: [0, 0],
                    pitch: 0,
                    bearing: 0,
                  },
                })

        console.log(deckRef.current.deck.getViewports())
        const vp = {
                ...deckRef.current.deck.getViewports()[1],
           //     target: [0, 0],
             //   zoom: 0
            }
        // if (Math.abs(vp.unproject([vp.width, 0])[0] - xBounds[1]) > ) {
            console.log("unprojecting:::resize")
            console.log("width", vp.width)
            console.log(vp)
            console.log(vp.unproject([vp.width, 0]))
            vp && setXbounds([vp.unproject([0, 0])[0], vp.unproject([vp.width, 0])[0]]);
      //  }
    }, [deckRef, setXbounds]);

    const [resizeListener, setResizeListener] = useState(null);
    useEffect(() => {
        console.log("adding resize listener")
        window.removeEventListener("resize", resizeListener);
        window.addEventListener('resize', handleResize);
        setResizeListener(handleResize);
    }, [handleResize]);
    
    // useEffect(() => {
    //     setUpdateBrowserBounds(false);
    //     window.dispatchEvent(new Event('resize'));

    // }, [updateBrowserBounds, setUpdateBrowserBounds]);
    useEffect(() => {

        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager) {
            return;
        }

        if (xBounds[0] == 0 && xBounds[1] == 0) {
            const vp = {
                ...deckRef.current.deck.getViewports()[1],
       //         target: [0, 0],
         //       zoom: 0,

            }
            console.log("unprojecting:::start")
            console.log("width", vp.width)
            console.log(vp)

            vp && setXbounds([vp.unproject([0, 0])[0], vp.unproject([vp.width, 0])[0]]);
        }
    }, [deckRef, xBounds, yBounds]);

    useEffect(() => {
        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager) {
            return;
        }
        const vp = {
            ...deckRef.current.deck.getViewports()[1],
        //   target: [0, 0],
         //  zoom: 0
            }
        
        if (pxPerBp) {
            console.log('thisone')

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