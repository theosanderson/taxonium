import { useCallback } from "react";
import axios from "axios";
function useBackend(backend_url) {
  const queryNodes = useCallback(
    (boundsForQueries, setDynamicData, setTriggerRefresh) => {
      let url = backend_url + "/nodes/?type=leaves";
      if (
        boundsForQueries.min_x &&
        boundsForQueries.max_x &&
        boundsForQueries.min_y &&
        boundsForQueries.max_y
      ) {
        url =
          url +
          "&min_x=" +
          boundsForQueries.min_x +
          "&max_x=" +
          boundsForQueries.max_x +
          "&min_y=" +
          boundsForQueries.min_y +
          "&max_y=" +
          boundsForQueries.max_y;
      }

      axios
        .get(url)
        .then(function (response) {
          console.log("got data", response.data);
          if (!boundsForQueries.min_x) {
            setDynamicData({
              status: "loaded",
              base_data: response.data,
            });
          } else {
            setDynamicData((dynamicData) => ({
              ...dynamicData,
              status: "loaded",
              data: response.data,
            }));
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
    },
    [backend_url]
  );

  const singleSearch = useCallback(
    (singleSearch, boundsForQueries, setResult) => {
      let url = backend_url + "/search/?json=" + JSON.stringify(singleSearch);
      if (
        boundsForQueries.min_x &&
        boundsForQueries.max_x &&
        boundsForQueries.min_y &&
        boundsForQueries.max_y
      ) {
        url =
          url +
          "&min_x=" +
          boundsForQueries.min_x +
          "&max_x=" +
          boundsForQueries.max_x +
          "&min_y=" +
          boundsForQueries.min_y +
          "&max_y=" +
          boundsForQueries.max_y;
      }

      axios
        .get(url)
        .then(function (response) {
          console.log("got data", response.data);
          setResult(response.data);
        })
        .catch(function (error) {
          console.log(error);
          setResult([]);
        });
    },
    [backend_url]
  );

  return { queryNodes, singleSearch };
}
export default useBackend;
