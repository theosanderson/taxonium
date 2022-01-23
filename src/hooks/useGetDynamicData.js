import { useEffect, useState } from "react";
import axios from "axios";

function useGetDynamicData(backend_url, viewState) {
  const [dynamicData, setDynamicData] = useState({
    status: "not_started",
    data: [],
  });

  let [parametersToQuery, setParametersToQuery] = useState(null);

  useEffect(() => {
    if (
      !parametersToQuery ||
      (true &&
        (viewState.min_x <
          parametersToQuery.min_x + viewState.real_width / 2 ||
          viewState.max_x >
            parametersToQuery.max_x - viewState.real_width / 2 ||
          viewState.min_y <
            parametersToQuery.min_y + viewState.real_height / 2 ||
          viewState.max_y >
            parametersToQuery.max_y - viewState.real_height / 2 ||
          Math.abs(viewState.zoom[0] - parametersToQuery.zoom[0]) > 1 ||
          Math.abs(viewState.zoom[1] - parametersToQuery.zoom[1]) > 1))
    ) {
      if(window.log){

      console.log([viewState.min_x ,
        parametersToQuery.min_x])}

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
  }, [viewState, parametersToQuery]);

  useEffect(() => {
    if (!parametersToQuery) return;

    if (dynamicData.status === "loading") {
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

    let query_precision = {
      x: parametersToQuery.zoom[0],
      y: parametersToQuery.zoom[1],
    };

    url =
      url +
      "&x_precision=" +
      query_precision.x +
      "&y_precision=" +
      query_precision.y;

    axios.get(url).then(function (response) {
      console.log("got data", response.data);
      setDynamicData({
        status: "loaded",
        data: response.data,
      });
    });
    setDynamicData({ ...dynamicData, status: "loading" });
  }, [parametersToQuery, backend_url]);

  return dynamicData;
}

export default useGetDynamicData;
