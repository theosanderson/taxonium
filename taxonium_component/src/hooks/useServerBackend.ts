import { useCallback, useMemo, useState } from "react";
import type { Node, Mutation } from "../types/node";
import axios from "axios";
import type {
  Config,
  NodesResponse,
  QueryBounds,
  NodeDetails,
  SearchResult,
  ServerBackend,
} from "../types/backend";

function useServerBackend(
  backend_url: string | null,
  sid: string | null
): ServerBackend {
  const [statusMessage, setStatusMessage] = useState<
    | { percentage?: number; message?: string | null }
    | null
  >({ message: null });
  const queryNodes = useCallback(
    (
      boundsForQueries: QueryBounds | null,
      setResult: (res: NodesResponse) => void,
      setTriggerRefresh: (v: Record<string, unknown>) => void,
      config: Config
    ) => {
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
          response.data.nodes.forEach((node: Node) => {
            if (node.node_id === config.rootId) {
              if (config.useHydratedMutations) {
                node.mutations = config.rootMutations as Mutation[];
              } else {
                node.mutations = (config.rootMutations as unknown as number[])
                  .map((x) => config.mutations?.[x])
                  .filter(Boolean) as Mutation[];
              }
            } else {
              if (!config.useHydratedMutations) {
                node.mutations = (node.mutations as unknown as number[])
                  .map((mutation: number) => config.mutations?.[mutation])
                  .filter(Boolean) as Mutation[];
              }
            }
          });
          setResult(response.data);
        })
        .catch(function (error) {
          console.log(error);
          window.alert(error);
          setResult({ nodes: [] } as NodesResponse);
          setTriggerRefresh({});
        });
    },
    [backend_url, sid]
  );

  const singleSearch = useCallback(
    (
      singleSearch: unknown,
      boundsForQueries: QueryBounds | null,
      setResult: (res: SearchResult) => void
    ) => {
      const abortController = new AbortController();

      let url =
        backend_url +
        "/search/?json=" +
        encodeURIComponent(JSON.stringify(singleSearch)) +
        "&sid=" +
        encodeURIComponent(sid ?? "");

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
          setResult(response.data);
        })
        .catch(function (error) {
          // if cancelled then do nothing
          if (error.name === "CanceledError") {
            return;
          }
          console.log(error);
          window.alert(error);
          setResult({ type: "", data: [], total_count: 0, key: "" } as SearchResult);
        });
      return { abortController };
    },
    [backend_url, sid]
  );

  const getDetails = useCallback(
    (node_id: string | number, setResult: (res: NodeDetails) => void) => {
      let url = backend_url + "/node_details/?id=" + node_id + "&sid=" + sid;
      axios.get(url).then(function (response) {
        setResult(response.data);
      });
    },
    [backend_url, sid]
  );
  const getConfig = useCallback(
    (setResult: (res: Config) => void) => {
      const url = `${backend_url}/config/?sid=${sid}`;

      // Fetch initial config
      axios
        .get(url)
        .then((response) => {
          if (response.data.error) {
            window.alert(response.data.error + "Error.");
            return;
          }

          const config = response.data;
          if (!config.useHydratedMutations) {
            config.mutations = config.mutations ? config.mutations : [];

            // Stream mutations
            const mutationsUrl = `${backend_url}/mutations/?sid=${sid}`;
            const eventSource = new EventSource(mutationsUrl);

            eventSource.onmessage = (event) => {
              if (event.data === "END") {
                eventSource.close();
                setResult(config);
                return;
              }

              try {
                const mutationsChunk = JSON.parse(event.data);
                if (Array.isArray(mutationsChunk)) {
                  config.mutations.push(...mutationsChunk);
                } else {
                  console.error("Received non-array chunk:", mutationsChunk);
                }
              } catch (error) {
                console.error("Error parsing mutations chunk:", error);
              }
            };

            eventSource.onerror = (error) => {
              console.error("EventSource failed:", error);
              eventSource.close();
              setResult(config);
              // TODO atm we set the Result above for backwards compatibility with backends which don't stream mutations and use /config/
              // instead. After a while we should stop doing this so that if the stream dies in the middle we don't get
              // possible weird behavior.
            };
          } else {
            setResult(config);
          }
        })

        .catch((error) => {
          console.error("Error fetching config:", error);

          window.alert("Failed to fetch config. ");
        });
    },
    [backend_url, sid]
  );

  const getTipAtts = useCallback(
    (
      nodeId: string | number,
      selectedKey: string,
      callback: (err: unknown, data: unknown) => void,
    ) => {
      let url =
        backend_url +
        "/tip_atts?id=" +
        nodeId +
        "&att=" +
        selectedKey +
        "&sid=" +
        sid;
      axios.get(url).then(function (response) {
        callback((response.data as { err?: unknown }).err, response.data);
      });
    },
    [backend_url, sid]
  );

  const getNextstrainJsonUrl = useCallback(
    (nodeId: string | number, config: Config) => {
      return backend_url + "/nextstrain_json/" + nodeId;
    },
    [backend_url]
  );

  const getNextstrainJson = useCallback(
    (nodeId: string | number, config: Config) => {
      const url = getNextstrainJsonUrl(nodeId, config);
      // load this
      window.location.href = url;
    },
    [getNextstrainJsonUrl]
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
