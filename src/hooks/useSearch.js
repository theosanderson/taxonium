import { useState, useMemo, useEffect } from "react";
import axios from "axios";

const useSearch = (data) => {
  const [searchSpec, setSearchSpec] = useState([]);
  const [searchResults, setSearchResults] = useState({});
  const [jsonSearch, setJsonSearch] = useState({});
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

    // if any json strings have changed, update the search results
    if (json_changed.length > 0) {
      setJsonSearch(spec_json);
    }

    // if there are changed json strings, update the search results
    if (json_changed.length > 0) {
      json_changed.forEach((key) => {
        console.log("searching for " + key, JSON.parse(spec_json[key]));
        // make an axios call to /search/?json=<json>
        axios.get(`/search/?json=${spec_json[key]}`).then((response) => {
          setSearchResults((prevState) => ({
            ...prevState,
            [key]: response.data,
          }));
          console.log(searchResults);
        });
      });
    }
  }, [searchSpec, searchResults, jsonSearch]);

  const addNewTopLevelSearch = () => {
    console.log("addNewTopLevelSearch");
    // get a random string key
    const newKey = Math.random().toString(36).substring(2, 15);
    setSearchSpec([...searchSpec, { key: newKey }]);
  };

  const deleteTopLevelSearch = (key) => {
    setSearchSpec(searchSpec.filter((s) => s.key !== key));
  };

  return {
    searchSpec,
    setSearchSpec,
    addNewTopLevelSearch,
    deleteTopLevelSearch,
  };
};

export default useSearch;
