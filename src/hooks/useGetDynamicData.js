import { useEffect, useState } from "react";
import axios from "axios";

function useGetDynamicData(backend_url, viewState) {
  const [dynamicData, setDynamicData] = useState({
    status: "not_started",
    data: [],
  });

  let [parametersToQuery, setParametersToQuery] = useState(null);
  let [triggerRefresh, setTriggerRefresh] = useState({});
  let [timeoutRef, setTimeoutRef] = useState(null);

  useEffect(() => {
    if (
      !parametersToQuery ||
      (true &&
        (viewState.min_x < parametersToQuery.min_x + viewState.real_width / 2 ||
          viewState.max_x >
            parametersToQuery.max_x - viewState.real_width / 2 ||
          viewState.min_y <
            parametersToQuery.min_y + viewState.real_height / 2 ||
          viewState.max_y >
            parametersToQuery.max_y - viewState.real_height / 2 ||
          Math.abs(viewState.zoom - parametersToQuery.zoom) > 0.5))
    ) {
      if (window.log) {
        console.log([viewState.min_x, parametersToQuery.min_x]);
      }

      console.log("updating parameters to query");

      const newParamsToQuery = {
        min_x: viewState.min_x - viewState.real_width,
        max_x: viewState.max_x + viewState.real_width,
        min_y: viewState.min_y - viewState.real_height,
        max_y: viewState.max_y + viewState.real_height,
        zoom: viewState.zoom,
      };
      console.log(viewState);
      console.log(newParamsToQuery);

      setParametersToQuery(newParamsToQuery);
    }
  }, [viewState, parametersToQuery, triggerRefresh]);

  useEffect(() => {
    clearTimeout(timeoutRef);
    setDynamicData({ ...dynamicData, status: "pending" });

    setTimeoutRef(
      setTimeout(() => {
        if (!parametersToQuery) return;

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
        let url = backend_url + "/nodes/?type=leaves";
        if (
          parametersToQuery.min_x &&
          parametersToQuery.max_x &&
          parametersToQuery.min_y &&
          parametersToQuery.max_y
        ) {
          url =
            url +
            "&min_x=" +
            parametersToQuery.min_x +
            "&max_x=" +
            parametersToQuery.max_x +
            "&min_y=" +
            parametersToQuery.min_y +
            "&max_y=" +
            parametersToQuery.max_y;
        }

        axios
          .get(url)
          .then(function (response) {
            console.log("got data", response.data);
            if (!parametersToQuery.min_x) {
              setDynamicData({
                status: "loaded",
                base_data: response.data,
              });
            } else {
              setDynamicData({
                ...dynamicData,
                status: "loaded",
                data: response.data,
              });
            }
          })
          .catch(function (error) {
            console.log(error);
            setDynamicData({
              status: "error",
              data: [],
            });
            setTriggerRefresh({});
          });
        setDynamicData({ ...dynamicData, status: "loading" });
      }, 300)
    );
  }, [parametersToQuery, backend_url, triggerRefresh]);

  return dynamicData;
}

export default useGetDynamicData;
