import { useCallback, useMemo, useState } from "react";
import axios from "axios";

function useServerBackend(backend_url, sid, url_on_fail) {
  const [statusMessage, setStatusMessage] = useState({ message: null });
  const queryNodes = useCallback(
    (boundsForQueries, setResult, setTriggerRefresh, config) => {
      let url = backend_url + "/nodes/?type=leaves&sid=" + sid;
      if (
        boundsForQueries &&
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

      if (boundsForQueries && boundsForQueries.xType) {
        url = url + "&xType=" + boundsForQueries.xType;
      }

      axios
        .get(url)
        .then(function (response) {
          console.log("got data", response.data);
          response.data.nodes.forEach((node) => {
            if (node.node_id === config.rootId) {
              node.mutations = config.rootMutations.map(
                (x) => config.mutations[x],
              );
            } else {
              node.mutations = node.mutations.map(
                (mutation) => config.mutations[mutation],
              );
            }
          });
          setResult(response.data);
        })
        .catch(function (error) {
          console.log(error);
          window.alert(error);
          setResult([]);
          setTriggerRefresh({});
        });
    },
    [backend_url, sid],
  );

  const singleSearch = useCallback(
    (singleSearch, boundsForQueries, setResult) => {
      const abortController = new AbortController();

      let url =
        backend_url +
        "/search/?json=" +
        JSON.stringify(singleSearch) +
        "&sid=" +
        sid;

      const xType =
        boundsForQueries && boundsForQueries.xType
          ? boundsForQueries.xType
          : "x_dist";

      if (
        boundsForQueries &&
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
      url = url + "&xType=" + xType;

      axios
        .get(url, { signal: abortController.signal })
        .then(function (response) {
          console.log("got data", response.data);
          setResult(response.data);
        })
        .catch(function (error) {
          // if cancelled then do nothing
          if (error.name === "CanceledError") {
            return;
          }
          console.log(error);
          window.alert(error);
          setResult([]);
        });
      return { abortController };
    },
    [backend_url, sid],
  );

  const getDetails = useCallback(
    (node_id, setResult) => {
      let url = backend_url + "/node_details/?id=" + node_id + "&sid=" + sid;
      axios.get(url).then(function (response) {
        setResult(response.data);
      });
    },
    [backend_url, sid],
  );

  const getConfig = useCallback(
    (setResult) => {
      let url = backend_url + "/config/?sid=" + sid;
      axios.get(url).then(function (response) {
        console.log("got config", response.data);
        if (response.data.error) {
          window.alert(
            response.data.error + (url_on_fail ? "\nRedirecting you." : ""),
          );
          window.location.href = url_on_fail;
        }
        setResult(response.data);
      });
    },
    [backend_url, sid, url_on_fail],
  );

  const getTipAtts = useCallback(
    (nodeId, selectedKey, callback) => {
      let url =
        backend_url +
        "/tip_atts?id=" +
        nodeId +
        "&att=" +
        selectedKey +
        "&sid=" +
        sid;
      axios.get(url).then(function (response) {
        callback(response.err, response.data);
      });
    },
    [backend_url, sid],
  );

  const getNextstrainJsonUrl = useCallback(
    (nodeId, config) => {
      return backend_url + "/nextstrain_json/" + nodeId;
    },
    [backend_url],
  );

  const getNextstrainJson = useCallback(
    (nodeId, config) => {
      const url = getNextstrainJsonUrl(nodeId, config);
      // load this
      window.location.href = url;
    },
    [getNextstrainJsonUrl],
  );

  return useMemo(() => {
    return {
      queryNodes,
      singleSearch,
      getDetails,
      getConfig,
      setStatusMessage,
      statusMessage,
      getTipAtts,
      type: "server",
      backend_url: backend_url,
      getNextstrainJson,
      getNextstrainJsonUrl,
    };
  }, [
    queryNodes,
    singleSearch,
    getDetails,
    getConfig,
    setStatusMessage,
    statusMessage,
    getTipAtts,
    backend_url,
    getNextstrainJson,
    getNextstrainJsonUrl,
  ]);
}

export default useServerBackend;
