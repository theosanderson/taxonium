import { useCallback, useEffect, useMemo, useState } from "react";

const useTreenomeAnnotations = (settings: { chromosomeName: string }) => {
  // Track list as returned from UCSC API. Keep loosely typed.
  const [trackList, setTrackList] = useState<Record<string, unknown>>({});
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
    (
      track: Record<string, any>,
      key: string,
      name: string,
      category: string[]
    ): Record<string, unknown> | null => {
      const url = track.bigDataUrl;
      if (!url) {
        return null;
      }
      const ext = url.slice(-2);
      if (ext !== "bb" && ext !== "bw") {
        return null;
      }
      const fullUrl = `${baseUrl}${url}`;
      // The structure returned here is consumed by JBrowse which expects
      // additional fields not described in our local types, so we keep it
      // as a loosely-typed object.
      const output: Record<string, unknown> = {
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
    [settings.chromosomeName]
  );

  const json = useMemo(() => {
    let allJson: Record<string, unknown>[] = [];
    const tl = trackList.wuhCor1 as Record<string, any>;
    for (const key in tl) {
      const track = tl[key];
      if (!track.bigDataUrl) {
        for (const childKey in track) {
          let childJson: Record<string, unknown> | null = null;
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
      let thisJson: Record<string, unknown> | null = getJson(
        track,
        key,
        track.longLabel,
        ["UCSC Tracks"]
      );
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
