import { useEffect, useMemo, useState } from "react";

function useGetDynamicData(backend, colorBy, viewState) {
  const { queryNodes } = backend;
  const [dynamicData, setDynamicData] = useState({
    status: "not_started",
    data: [],
  });

  let [boundsForQueries, setBoundsForQueries] = useState(null);
  let [triggerRefresh, setTriggerRefresh] = useState({});
  let [timeoutRef, setTimeoutRef] = useState(null);

  useEffect(() => {
    if (
      !boundsForQueries ||
      (true &&
        (viewState.min_x < boundsForQueries.min_x + viewState.real_width / 2 ||
          viewState.max_x > boundsForQueries.max_x - viewState.real_width / 2 ||
          viewState.min_y <
            boundsForQueries.min_y + viewState.real_height / 2 ||
          viewState.max_y >
            boundsForQueries.max_y - viewState.real_height / 2 ||
          Math.abs(viewState.zoom - boundsForQueries.zoom) > 0.5))
    ) {
      if (window.log) {
        console.log([viewState.min_x, boundsForQueries.min_x]);
      }

      console.log("updating parameters to query");

      const newBoundForQuery = {
        min_x: viewState.min_x - viewState.real_width,
        max_x: viewState.max_x + viewState.real_width,
        min_y: viewState.min_y - viewState.real_height,
        max_y: viewState.max_y + viewState.real_height,
        zoom: viewState.zoom,
      };

      setBoundsForQueries(newBoundForQuery);
      console.log("updating bounds");
    }
  }, [viewState, boundsForQueries, triggerRefresh]);

  const extraParams = colorBy.nodeRetrievalExtraParams;

  useEffect(() => {
    clearTimeout(timeoutRef);
    setTimeoutRef(
      setTimeout(() => {
        if (!boundsForQueries) return;

        if (dynamicData.status === "loading") {
          console.log("not trying to get as we are still loading");
          clearTimeout(timeoutRef);
          setTimeoutRef(
            setTimeout(() => {
              setTriggerRefresh({});
            }, 100)
          );
          return;
        }
        console.log("attempting get");
        // Make call to backend to get data
        queryNodes(
          boundsForQueries,
          extraParams,
          (result) => {
            setDynamicData((prevData) => {
              const new_result = {
                ...prevData,
                status: "loaded",
                data: result,
              };
              if (!boundsForQueries) {
                new_result.base_data = result;
              } else {
                if (!prevData.base_data || prevData.base_data_is_invalid) {
                  queryNodes(null, extraParams, (base_result) => {
                    setDynamicData((prevData) => {
                      const new_result = {
                        ...prevData,
                        status: "loaded",
                        base_data: base_result,
                        base_data_is_invalid: false,
                      };
                      return new_result;
                    });
                  });
                }
              }
              return new_result;
            });
          },
          setTriggerRefresh
        );

        setDynamicData({ ...dynamicData, status: "loading" });
      }, 300)
    );
  }, [boundsForQueries, extraParams, queryNodes, triggerRefresh]);

  return { data: dynamicData, boundsForQueries };
}

export default useGetDynamicData;
