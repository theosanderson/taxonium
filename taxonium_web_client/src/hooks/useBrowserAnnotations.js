import { useMemo } from "react";


async function getTrackList() {
    try {
        const response = await fetch('https://api.genome.ucsc.edu/list/tracks?genome=wuhCor1');
        return await response.json();
    } catch(error) {
        return [];
    }
    
}
const useBrowserAnnotations = () => {

    const json = useMemo(() => {
        const trackList = getTrackList();
        console.log(trackList)
        return []
    }, []);

    const output = useMemo(() => {
        return {json};
    }, [json]);

    return output;
};

export default useBrowserAnnotations;
