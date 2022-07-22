import { useEffect, useMemo, useState } from "react";



const useTreenomeAnnotations = () => {

    const [trackList, setTrackList] = useState([]);
    const baseUrl = 'https://hgdownload.soe.ucsc.edu';

    async function getTrackList() {
        try {
            await fetch('https://api.genome.ucsc.edu/list/tracks?genome=wuhCor1')
                .then((response) => response.json())
                .then(data => {
                    setTrackList(data)
                });
        } catch(error) {}
    }
    
    useEffect(() => {
        getTrackList()
    }, []);

    const getJson = (track, key, name, category) => {
        const url = track.bigDataUrl;
        if (!url) {
            return null;
        }
        const ext = url.slice(-2);
            if (ext !== 'bb' && ext !== 'bw') {
                return null;
            }
            const fullUrl = `${baseUrl}${url}`;
            const output = {
                    trackId: key,
                    name: name,
                    assemblyNames: ['NC_045512v2'],
                    category: category,
                }
            if (ext === 'bb') {
                output.type = 'FeatureTrack';
                output.adapter = {
                    type: 'BigBedAdapter',
                    bigBedLocation: {
                        uri: fullUrl,
                        locationType: 'UriLocation',
                    },
                }
            } else if (ext ==='bw') {
                output.type = 'QuantitativeTrack';
                output.adapter = {
                    type: 'BigWigAdapter',
                    bigWigLocation: {
                        uri: fullUrl,
                        locationType: 'UriLocation',
                    }
                }
            }
        return output;
    }

    const json = useMemo(() => {
        let allJson = [];
        for (const key in trackList.wuhCor1) {
            const track = trackList.wuhCor1[key];
            if (!track.bigDataUrl) {
                for (const childKey in track) {
                    let childJson = {}
                    const child = track[childKey]
                    if (!child.bigDataUrl) {
                        continue;
                    }
                    childJson = getJson(child, childKey, `${child.longLabel}`, ['Composite UCSC Tracks', track.longLabel]);
                    if (childJson) {
                        allJson.push(childJson);
                    }
                }
            }            
            let thisJson = getJson(track, key, track.longLabel, ['UCSC Tracks']);
            if (thisJson) {
                allJson.push(thisJson);
            }
        }
        return allJson
    }, [trackList]);

    const output = useMemo(() => {
        return {json};
    }, [json]);

    return output;
};

export default useTreenomeAnnotations;
