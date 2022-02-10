import { useState, useMemo, useEffect, useRef } from "react";

const useSearch = (data, boundsForQueries, view, backend) => {
  const { singleSearch } = backend;

  const [searchSpec, setSearchSpec] = useState([]);
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
    setSearchSpec([
      ...searchSpec,
      { key: newKey, type: "meta_Lineage", method: "text_exact", text: "abc" },
    ]);
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
