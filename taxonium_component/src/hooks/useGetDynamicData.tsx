import { useEffect, useMemo, useState } from "react";
import type {
  Backend,
  Config,
  QueryBounds,
  NodeLookupData,
  NodesResponse,
} from "../types/backend";
import computeBounds from "../utils/computeBounds";

const DEBOUNCE_TIME = 100;
const CHECK_AGAIN_TIME = 100;
function addNodeLookup(data: NodeLookupData): NodeLookupData {
  const output: NodeLookupData = {
    ...data,
    nodeLookup: Object.fromEntries(data.nodes.map((n) => [n.node_id, n])),
  };
  console.log("cc");
  return output;
}

interface DynamicData {
  status: string;
  data: NodeLookupData;
  base_data?: NodeLookupData;
  base_data_is_invalid?: boolean;
  lastBounds?: QueryBounds;
}

function useGetDynamicData(
  backend: Backend,
  colorBy: any,
  viewState: any,
  config: Config,
  xType: string,
  deckSize: { width: number; height: number } | null
): {
  data: DynamicData;
  boundsForQueries: QueryBounds | null;
  isCurrentlyOutsideBounds: boolean;
} {
  const { queryNodes } = backend;
  const [dynamicData, setDynamicData] = useState<DynamicData>({
    status: "not_started",
    data: { nodes: [], nodeLookup: {} },
  });

  let [boundsForQueries, setBoundsForQueries] = useState<QueryBounds | null>(null);
  let [triggerRefresh, setTriggerRefresh] = useState<Record<string, unknown>>({});
  let [timeoutRef, setTimeoutRef] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const vs = computeBounds({ ...viewState }, deckSize);
    if (
      !boundsForQueries ||
      xType !== boundsForQueries.xType ||
      (true &&
        (vs.min_x < (boundsForQueries!.min_x! + vs.real_width / 2) ||
          vs.max_x > (boundsForQueries!.max_x! - vs.real_width / 2) ||
          vs.min_y < (boundsForQueries!.min_y! + vs.real_height / 2) ||
          vs.max_y > (boundsForQueries!.max_y! - vs.real_height / 2) ||
          Math.abs(vs.zoom[1] - boundsForQueries!.zoom![1]) > 0.5))
    ) {
      if ((window as Window & { log?: boolean }).log) {
        console.log([
          vs.min_x,
          boundsForQueries ? boundsForQueries.min_x : null,
        ]);
      }
      console.log("VIEWSTATE", vs);

      console.log("updating parameters to query");

      const newBoundForQuery: QueryBounds = {
        min_x: vs.min_x - vs.real_width,
        max_x: vs.max_x + vs.real_width,
        min_y: vs.min_y - vs.real_height,
        max_y: vs.max_y + vs.real_height,
        zoom: vs.zoom,
        xType: xType,
      };

      setBoundsForQueries(newBoundForQuery);
      console.log("updating bounds", newBoundForQuery);
    }
  }, [viewState, boundsForQueries, triggerRefresh, xType, deckSize]);

  const isCurrentlyOutsideBounds = useMemo(() => {
    const vs = computeBounds({ ...viewState }, deckSize);
    return (
      vs.min_x &&
      dynamicData &&
      dynamicData.lastBounds &&
      dynamicData.lastBounds.min_x !== undefined &&
      (vs.min_x < dynamicData.lastBounds.min_x! ||
        vs.max_x > dynamicData.lastBounds.max_x! ||
        vs.min_y < dynamicData.lastBounds.min_y! ||
        vs.max_y > dynamicData.lastBounds.max_y!)
    );
  }, [viewState, dynamicData, deckSize]);

  useEffect(() => {
      if (config.title !== "loading") {
        if (timeoutRef) {
          clearTimeout(timeoutRef);
        }
        setTimeoutRef(
        setTimeout(() => {
          if (!boundsForQueries) return;

          if (dynamicData.status === "loading") {
            console.log("not trying to get as we are still loading");
            if (timeoutRef) {
              clearTimeout(timeoutRef);
            }
            setTimeoutRef(
              setTimeout(() => {
                setTriggerRefresh({});
              }, CHECK_AGAIN_TIME)
            );
            return;
          }
          console.log("attempting get");
          // Make call to backend to get data

          setDynamicData({ ...dynamicData, status: "loading" });

          queryNodes(
            boundsForQueries,
            (result: NodesResponse) => {
              const nodeResult = result as NodeLookupData;
              console.log(
                "got result, bounds were",
                boundsForQueries,
                " result is "
              );

              setDynamicData((prevData) => {
                const new_result: DynamicData = {
                  ...prevData,
                  status: "loaded",
                    data: addNodeLookup(nodeResult),
                  lastBounds: boundsForQueries,
                };
                if (!boundsForQueries || isNaN(boundsForQueries!.min_x as number)) {
                    new_result.base_data = addNodeLookup(nodeResult);
                } else {
                  if (!prevData.base_data || prevData.base_data_is_invalid) {
                    console.log("query for minimap");
                      queryNodes(
                        null,
                        (base_result: NodesResponse) => {
                          const nodeBase = base_result as NodeLookupData;
                          setDynamicData((prevData) => {
                            const new_result: DynamicData = {
                              ...prevData,
                              status: "loaded",
                              base_data: addNodeLookup(nodeBase),
                              base_data_is_invalid: false,
                            };
                            return new_result;
                          });
                        },
                        setTriggerRefresh,
                        config
                      );
                  }
                }
                return new_result;
              });
            },
            setTriggerRefresh,
            config
          );
        }, DEBOUNCE_TIME)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsForQueries, queryNodes, triggerRefresh, config]);

  return { data: dynamicData, boundsForQueries, isCurrentlyOutsideBounds };
}

export default useGetDynamicData;
