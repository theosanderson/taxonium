import SearchItem from "./SearchItem";
import { BsTrash } from "react-icons/bs";
import { FaSearch } from "react-icons/fa";
import { useCallback } from "react";
import { formatNumber } from "../utils/formatNumber";

function SearchTopLayerItem({ singleSearchSpec, myKey, search, config }) {
  const this_result = search.searchResults[myKey];

  const num_results =
    this_result && this_result.result
      ? this_result.result.total_count
      : "Loading";

  const getMyIndex = useCallback(() => {
    const index = search.searchSpec.findIndex((item) => item.key === myKey);
    return index;
  }, [search.searchSpec, myKey]);

  const setThisSearchSpec = useCallback(
    (thisSpec) => {
      // find the index of the item in the searchSpec array
      const index = getMyIndex();

      // make a copy of the searchSpec array
      const newSearchSpec = [...search.searchSpec];
      // replace the item at the index with the new item
      newSearchSpec[index] = thisSpec;
      // set the new searchSpec array
      search.setSearchSpec(newSearchSpec);
    },
    [search, getMyIndex]
  );

  const enabled =
    search.searchesEnabled[myKey] !== undefined
      ? search.searchesEnabled[myKey]
      : false;

  const thecolor = search.getLineColor(getMyIndex());

  return (
    <div className="border-gray-100 border-b mb-3 pb-3">
      <input
        name="isGoing"
        type="checkbox"
        style={{
          outline:
            enabled && num_results > 0
              ? `1px solid rgb(${thecolor[0]},${thecolor[1]},${thecolor[2]})`
              : "0px",
          outlineOffset: "2px",
        }}
        className="w-3 h-3 m-3 inline-block"
        checked={enabled}
        onChange={(event) => search.setEnabled(myKey, event.target.checked)}
      />
      <SearchItem
        config={config}
        singleSearchSpec={singleSearchSpec}
        setThisSearchSpec={setThisSearchSpec}
      />
      <div className="text-black  pr-2 text-sm">
        {" "}
        {num_results !== "Loading" && (
          <>
            {formatNumber(num_results)} result{num_results === 1 ? "" : "s"}
          </>
        )}{" "}
        {num_results > 0 && (
          <button
            className="inline-block bg-gray-100 text-xs mx-auto h-5 rounded border-gray-300 border m-4 text-gray-700"
            onClick={() => {
              search.setZoomToSearch({ index: getMyIndex() });
            }}
          >
            <FaSearch />
          </button>
        )}
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
