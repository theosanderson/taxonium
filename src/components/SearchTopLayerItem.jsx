import SearchItem from "./SearchItem";
import { BsTrash } from "react-icons/bs";
import { useCallback, useState } from "react";

function SearchTopLayerItem({ singleSearchSpec, myKey, search }) {
  const this_result = search.searchResults[myKey];

  const num_results =
    this_result && this_result.result
      ? this_result.result.total_count
      : "Loading";
  const setThisSearchSpec = useCallback(
    (thisSpec) => {
      // find the index of the item in the searchSpec array
      const index = search.searchSpec.findIndex((item) => item.key === myKey);
      // make a copy of the searchSpec array
      const newSearchSpec = [...search.searchSpec];
      // replace the item at the index with the new item
      newSearchSpec[index] = thisSpec;
      // set the new searchSpec array
      search.setSearchSpec(newSearchSpec);
    },
    [myKey, search]
  );

  return (
    <div className="border-gray-100 border-b mb-3 pb-3">
      <SearchItem
        singleSearchSpec={singleSearchSpec}
        setThisSearchSpec={setThisSearchSpec}
      />
      <div className="text-gray-700 text-right pr-2 text-sm">
        {num_results} results
      </div>
      <button
        className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
        onClick={() => search.deleteTopLevelSearch(myKey)}
      >
        <BsTrash className="inline-block mr-2" />
        Delete this search
      </button>
    </div>
  );
}

export default SearchTopLayerItem;
