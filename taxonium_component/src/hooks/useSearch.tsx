import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type {
  SearchState,
  SearchSpec,
  SearchResults,
  SearchBackendResult,
  SearchResultItem,
} from "../types/search";
import type { QueryBounds } from "../types/backend";
import { getDefaultSearch } from "../utils/searchUtil";
import getDefaultQuery from "../utils/getDefaultQuery";
import reduceMaxOrMin from "../utils/reduceMaxOrMin";
const default_query = getDefaultQuery();

interface UseSearchParams {
  data: any;
  config: any;
  boundsForQueries: QueryBounds | null;
  view: any;
  backend: any;
  query: any;
  updateQuery: (q: Record<string, unknown>) => void;
  deckSize: { width: number; height: number } | null;
  xType: string;
  settings: any;
}

const useSearch = ({
  data,
  config,
  boundsForQueries,
  view,
  backend,
  query,
  updateQuery,
  deckSize,
  xType,
  settings,
}: UseSearchParams): SearchState => {
  const { singleSearch } = backend;

  const [inflightSearches, setInflightSearches] = useState<string[]>([]);

  const [searchControllers, setSearchControllers] = useState<Record<
    string,
    { con: { abort: () => void }; bounds: QueryBounds | null }[]
  >>({});

  const searchSpec = useMemo(() => {
    if (!query.srch) {
      //updateQuery({ srch: default_query.srch });
      //console.log("setting default search", default_query.srch);
      return JSON.parse(default_query.srch);
    }
    return JSON.parse(query.srch);
  }, [query.srch]);

  const [zoomToSearch, setZoomToSearch] = useState<{ index: number } | null>(
    query.zoomToSearch ? { index: query.zoomToSearch } : null
  );
  const searchesEnabled = query.enabled
    ? JSON.parse(query.enabled)
    : JSON.parse(default_query.enabled);

  const setEnabled = (key: string, enabled: boolean) => {
    console.log("setEnabled", key, enabled);
    const newSearchesEnabled = { ...searchesEnabled, [key]: enabled };
    updateQuery({ enabled: JSON.stringify(newSearchesEnabled) });
  };

  const setSearchSpec = (newSearchSpec: SearchSpec[]) => {
    updateQuery({
      srch: JSON.stringify(newSearchSpec),
    });
  };

  const [searchResults, setSearchResults] = useState<SearchResults>({});
  const [jsonSearch, setJsonSearch] = useState<Record<string, string>>({});

  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});
  const [searchLoadingStatus, setSearchLoadingStatus] = useState<Record<string, string>>({});

  const setIndividualSearchLoadingStatus = (key: string, status: string) => {
    setSearchLoadingStatus((prev) => ({ ...prev, [key]: status }));
  };

  const singleSearchWrapper = useCallback(
    (
      key: string,
      this_json: string,
      boundsForQueries: QueryBounds | null,
      setter: (result: SearchBackendResult) => void
    ) => {
      const everything = { key, this_json, boundsForQueries };
      const everything_string = JSON.stringify(everything);
      if (inflightSearches.includes(everything_string)) {
        return;
      }
      setInflightSearches((prev) => [...prev, everything_string]);

      if (searchControllers[key]) {
        searchControllers[key].forEach((controller) => {
          if (controller && boundsForQueries == controller.bounds) {
            console.log("cancelling for ", key);
            controller.con.abort();
          }
        });
      }
      searchControllers[key] = [];

        const { abortController } = singleSearch(
          this_json,
          boundsForQueries,
          (x: SearchBackendResult) => {
            setInflightSearches((prev) =>
              prev.filter((s: string) => s !== everything_string)
            );
            setter(x);
          }
        );
      searchControllers[key] = [
        ...searchControllers[key],
        { con: abortController, bounds: boundsForQueries },
      ];
      setSearchControllers({ ...searchControllers });
    },
    [searchControllers, singleSearch, inflightSearches]
  );

  useEffect(() => {
    // Remove search results which are no longer in the search spec
    const spec_keys = searchSpec.map((spec: SearchSpec) => spec.key);
    const result_keys = Object.keys(searchResults);
    const keys_to_remove = result_keys.filter(
      (key) => !spec_keys.includes(key)
    );
    keys_to_remove.forEach((key) => {
      delete searchResults[key];
    });

    // create object that maps from keys to json strings of specs
    const spec_json: Record<string, string> = {};
    searchSpec.forEach((spec: SearchSpec) => {
      spec_json[spec.key] = JSON.stringify(spec);
    });

    // check which json strings have changed
    const json_changed = Object.keys(spec_json).filter(
      (key) => spec_json[key] !== jsonSearch[key]
    );

    // also add any result where the result type is not complete, and the bounding box has changed
    const result_changed = Object.keys(searchResults).filter((key: string) => {
      if (
        !(searchResults[key].result.type === "complete") &&
        searchResults[key].boundingBox !== boundsForQueries
      ) {
        console.log(
          "result_changed",
          key,
          searchResults[key].boundingBox,
          boundsForQueries
        );

        return true;
      }

      return false;
    });

    // if any json strings have changed, update the search results
    if (json_changed.length > 0) {
      setJsonSearch(spec_json);
    }

    const all_changed_with_dupes = json_changed.concat(result_changed);
    const all_changed = [...new Set(all_changed_with_dupes)];
    // remove dupes

    // if there are changed json strings, update the search results
    if (all_changed.length > 0) {
      all_changed.forEach((key: string) => {
        console.log("searching for " + key, JSON.parse(spec_json[key]));

        const this_json = spec_json[key];
        console.log("performing search");

        const do_search = () => {
          setIndividualSearchLoadingStatus(key, "loading");

          singleSearchWrapper(key, this_json, boundsForQueries, (result) => {
            setSearchResults((prevState) => {
              const new_result: SearchResultItem = {
                boundingBox: boundsForQueries,
                result: result,
              };
              if (result.type === "complete") {
                new_result.overview = result.data;
              } else {
                if (
                  prevState[key] &&
                  prevState[key].overview &&
                  !json_changed.includes(key)
                ) {
                  new_result.overview = prevState[key].overview;
                } else {
                  if (
                    !boundsForQueries ||
                    isNaN(boundsForQueries.min_x ?? NaN)
                  ) {
                    new_result.overview = result.data;
                  } else {
                    singleSearchWrapper(key, this_json, null, (result) => {
                      setSearchResults((prevState) => {
                        let new_result: SearchResultItem | undefined =
                          prevState[key];
                        if (new_result) {
                          new_result.overview = result.data;
                        } else {
                          new_result = { overview: result.data } as SearchResultItem;
                        }
                        return {
                          ...prevState,
                          [key]: new_result,
                        };
                      });
                    });
                  }
                }
              }
              return {
                ...prevState,
                [key]: new_result,
              };
            });
            //console.log(searchResults);
            setIndividualSearchLoadingStatus(key, "loaded");
          });
        };

        // debounce the search
        if (timeouts.current[key]) {
          clearTimeout(timeouts.current[key]);
          console.log("clearing timeout");
        }
        timeouts.current[key] = setTimeout(do_search, 500);
      });
    }
  }, [
    searchSpec,
    searchResults,
    jsonSearch,
    singleSearch,
    singleSearchWrapper,
    boundsForQueries,
  ]);

  const addNewTopLevelSearch = () => {
    console.log("addNewTopLevelSearch");
    // get a random string key
    const newSearch = getDefaultSearch(config);

    setSearchSpec([...searchSpec, newSearch]);
    setTimeout(() => {
      setEnabled(newSearch.key, true);
    }, 50);
  };

    const deleteTopLevelSearch = (key: string) => {
      setSearchSpec(searchSpec.filter((s: SearchSpec) => s.key !== key));
    };

  const lineColors: [number, number, number][] = [
    [255, 0, 0],
    [0, 0, 255],
    [0, 255, 0],
    [255, 0, 255],
    [0, 255, 255],
    [255, 255, 0],
  ];

  const getLineColor = (index: number): [number, number, number] =>
    lineColors[index % lineColors.length];

  useEffect(() => {
    if (zoomToSearch && deckSize) {
      const { index } = zoomToSearch;
      const relevant = searchResults[searchSpec[index].key];
      if (!relevant) {
        console.log("no search results for index", index);
        console.log(searchResults);
        return;
      }
      const { overview } = relevant;
      if (!overview || overview.length === 0) {
        console.log("no overview for index", index);
        return;
      }
        const min_y = reduceMaxOrMin(overview, (d: any) => d.y, "min");
        const max_y = reduceMaxOrMin(overview, (d: any) => d.y, "max");
      // eslint-disable-next-line no-unused-vars
        const min_x = reduceMaxOrMin(overview, (d: any) => d[xType], "min");
      // eslint-disable-next-line no-unused-vars
        const max_x = reduceMaxOrMin(overview, (d: any) => d[xType], "max");

      console.log("Doing zoom", min_y, max_y, min_x, max_x);

      const oldViewState = { ...view.viewState };
      const newZoom =
        9 -
        Math.log2(
          max_y - min_y + 50000 / (config.num_nodes ? config.num_nodes : 10000)
        );
      const new_target = settings.treenomeEnabled
        ? [oldViewState.target[0], (min_y + max_y) / 2]
        : [(min_x + max_x) / 2, (min_y + max_y) / 2];

      const viewState = {
        ...view.viewState,
        real_target: undefined,
        target: new_target,
        zoom: newZoom,
      };
      console.log(
        "zoom to search new VS",
        viewState.target[0],
        viewState.target[1]
      );

      view.onViewStateChange({
        viewState: viewState,
        interactionState: "isZooming",
        oldViewState,
        basicTarget: settings.treenomeEnabled ? false : true,
      });
      updateQuery({ zoomToSearch: undefined });
        setZoomToSearch(null);
    }
  }, [
    zoomToSearch,
    searchResults,
    deckSize,
    config.num_nodes,
    settings.treenomeEnabled,
    searchSpec,
    updateQuery,
    view,
    xType,
  ]);

  return {
    searchResults,
    searchSpec,
    setSearchSpec,
    addNewTopLevelSearch,
    deleteTopLevelSearch,
    getLineColor,
    setZoomToSearch,
    searchesEnabled,
    setEnabled,
    searchLoadingStatus,
  };
};

export default useSearch;
