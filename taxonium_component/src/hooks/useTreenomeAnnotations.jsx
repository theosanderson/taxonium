import { useCallback, useEffect, useMemo, useState } from "react";

const useTreenomeAnnotations = (settings) => {
  const [trackList, setTrackList] = useState([]);
  const baseUrl = "https://hgdownload.soe.ucsc.edu";

  async function getTrackList() {
    try {
      await fetch("https://api.genome.ucsc.edu/list/tracks?genome=wuhCor1")
        .then((response) => response.json())
        .then((data) => {
          setTrackList(data);
        });
    } catch (error) {}
  }

  useEffect(() => {
    getTrackList();
  }, []);

  const getJson = useCallback(
    (track, key, name, category) => {
      const url = track.bigDataUrl;
      if (!url) {
        return null;
      }
      const ext = url.slice(-2);
      if (ext !== "bb" && ext !== "bw") {
        return null;
      }
      const fullUrl = `${baseUrl}${url}`;
      const output = {
        trackId: key,
        name: name,
        assemblyNames: [settings.chromosomeName],
        category: category,
      };
      if (ext === "bb") {
        output.type = "FeatureTrack";
        output.adapter = {
          type: "BigBedAdapter",
          bigBedLocation: {
            uri: fullUrl,
            locationType: "UriLocation",
          },
        };
      } else if (ext === "bw") {
        output.type = "QuantitativeTrack";
        output.adapter = {
          type: "BigWigAdapter",
          bigWigLocation: {
            uri: fullUrl,
            locationType: "UriLocation",
          },
        };
      }
      return output;
    },
    [settings.chromosomeName],
  );

  const json = useMemo(() => {
    let allJson = [];
    for (const key in trackList.wuhCor1) {
      const track = trackList.wuhCor1[key];
      if (!track.bigDataUrl) {
        for (const childKey in track) {
          let childJson = {};
          const child = track[childKey];
          if (!child.bigDataUrl) {
            continue;
          }
          childJson = getJson(child, childKey, `${child.longLabel}`, [
            "UCSC Tracks (Composite)",
            track.longLabel,
          ]);
          if (childJson) {
            allJson.push(childJson);
          }
        }
      }
      let thisJson = getJson(track, key, track.longLabel, ["UCSC Tracks"]);
      if (thisJson) {
        allJson.push(thisJson);
      }
    }
    return allJson;
  }, [getJson, trackList.wuhCor1]);

  const output = useMemo(() => {
    return { json };
  }, [json]);

  return output;
};

export default useTreenomeAnnotations;
