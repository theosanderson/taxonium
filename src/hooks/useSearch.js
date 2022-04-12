import { useState, useMemo, useEffect, useRef } from "react";
import { getDefaultSearch } from "../utils/searchUtil";
import reduceMaxOrMin from "../utils/reduceMaxOrMin";

const hasZoomed = false;

const useSearch = (
  data,
  boundsForQueries,
  view,
  backend,
  query,
  updateQuery
) => {
  const { singleSearch } = backend;

  const searchSpec = useMemo(() => {
    return JSON.parse(query.srch);
  }, [query.srch]);

  const [zoomToSearch, setZoomToSearch] = useState(
    query.zoomToSearch ? { index: query.zoomToSearch } : null
  );

  const setSearchSpec = (newSearchSpec) => {
    updateQuery({
      srch: JSON.stringify(newSearchSpec),
    });
  };

  const [searchResults, setSearchResults] = useState({});
  const [jsonSearch, setJsonSearch] = useState({});

  const timeouts = useRef({});

  useEffect(() => {
    // Remove search results which are no longer in the search spec
    const spec_keys = searchSpec.map((spec) => spec.key);
    const result_keys = Object.keys(searchResults);
    const keys_to_remove = result_keys.filter(
      (key) => !spec_keys.includes(key)
    );
    keys_to_remove.forEach((key) => {
      delete searchResults[key];
    });

    // create object that maps from keys to json strings of specs
    const spec_json = {};
    searchSpec.forEach((spec) => {
      spec_json[spec.key] = JSON.stringify(spec);
    });

    // check which json strings have changed
    const json_changed = Object.keys(spec_json).filter(
      (key) => spec_json[key] !== jsonSearch[key]
    );

    // also add any result where the result type is not complete, and the bounding box has changed
    const result_changed = Object.keys(searchResults).filter(
      (key) =>
        !(searchResults[key].result.type === "complete") &&
        searchResults[key].boundingBox != boundsForQueries
    );

    // if any json strings have changed, update the search results
    if (json_changed.length > 0) {
      setJsonSearch(spec_json);
    }

    const all_changed_with_dupes = json_changed.concat(result_changed);
    const all_changed = [...new Set(all_changed_with_dupes)];
    // remove dupes

    // if there are changed json strings, update the search results
    if (all_changed.length > 0) {
      all_changed.forEach((key) => {
        console.log("searching for " + key, JSON.parse(spec_json[key]));

        const this_json = spec_json[key];
        console.log("performing search");

        const do_search = () => {
          singleSearch(this_json, boundsForQueries, (result) => {
            setSearchResults((prevState) => {
              const new_result = {
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
                  if (!boundsForQueries || isNaN(boundsForQueries.min_x)) {
                    new_result.overview = result.data;
                  } else {
                    singleSearch(this_json, null, (result) => {
                      setSearchResults((prevState) => {
                        const new_result = prevState[key];
                        new_result.overview = result.data;
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
            console.log(searchResults);
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
  }, [searchSpec, searchResults, jsonSearch, singleSearch, boundsForQueries]);

  const addNewTopLevelSearch = () => {
    console.log("addNewTopLevelSearch");
    // get a random string key
    const newKey = Math.random().toString(36).substring(2, 15);
    setSearchSpec([...searchSpec, getDefaultSearch()]);
  };

  const deleteTopLevelSearch = (key) => {
    setSearchSpec(searchSpec.filter((s) => s.key !== key));
  };

  const lineColors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [255, 0, 255],
    [0, 255, 255],
  ];

  const getLineColor = (index) => lineColors[index % lineColors.length];

  useEffect(() => {
    if (zoomToSearch) {
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
      const min_y = reduceMaxOrMin(overview, (d) => d.y, "min");
      const max_y = reduceMaxOrMin(overview, (d) => d.y, "max");
      const min_x = reduceMaxOrMin(overview, (d) => d.x, "min");
      const max_x = reduceMaxOrMin(overview, (d) => d.x, "max");

      const oldViewState = { ...view.viewState };
      const viewState = {
        ...view.viewState,
        target: [2000, (min_y + max_y) / 2],
        zoom: 9 - Math.log2(max_y - min_y + 0.001),
      };
      console.log("zoom to search new VS", viewState);

      view.onViewStateChange({
        viewState: viewState,
        oldViewState,
        interactionState: "isZooming",
      });
      updateQuery({ zoomToSearch: undefined });
      setZoomToSearch(undefined);
    }
  }, [zoomToSearch, searchResults]);

  return {
    searchResults,
    searchSpec,
    setSearchSpec,
    addNewTopLevelSearch,
    deleteTopLevelSearch,
    getLineColor,
  };
};

export default useSearch;
