import { useMemo, useCallback, useState, useEffect } from "react";

const useBrowserState = (
    data,
    deckRef,
    view,
    settings
) => {
    const [yBounds, setYBounds] = useState([0, 0]);
    const [xBounds, setXbounds] = useState([0, 0]);
    const [ntBounds, setNtBounds] = useState([0, 29903]);
    const [ntBoundsExt, setNtBoundsExt] = useState(null);
    const [pxPerBp, setPxPerBp] = useState(0);
    const [bpWidth, setBpWidth] = useState(0);

  
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

        if (!deckRef.current || !deckRef.current.deck || !deckRef.current.deck.viewManager || !settings.browserEnabled) {
            return;
        }
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
        
       
 
    }, [deckRef, setXbounds, view.viewState, view.setViewState, view.baseViewState, settings.browserEnabled]);

    // useEffect(() => {
    //     window.setInterval(() => {
    //         handleResize();
    //     }, 1000);
    // }, []);
    // useEffect(
    //     () => {
    //         console.log(calling)
    //       const newViewState = { ...view.viewState };
    //       view.onViewStateChange({
    //         viewState: newViewState,
    //  //       interactionState: "isZooming",
    //         oldViewState: view.viewState,
    //  //       overrideZoomAxis,
    //       });
    //     },
    //     [xBounds, yBounds]
    //   );

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
        }
    }, [xBounds, yBounds, ntBounds, setNtBounds, setNtBoundsExt, pxPerBp, setPxPerBp, bpWidth, handleResize]);

    return state;
};

export default useBrowserState;