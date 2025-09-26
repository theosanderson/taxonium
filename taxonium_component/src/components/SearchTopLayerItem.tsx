import SearchItem from "./SearchItem";
import { FaSearch, FaLink, FaTrash } from "react-icons/fa";
import { useCallback, useState } from "react";
import { Button } from "../components/Basic";
import { formatNumber } from "../utils/formatNumber";
import { ClipLoader } from "react-spinners";
import TaxoniumModal from "./TaxoniumModal";

import type { SearchSpec, SearchState } from "../types/search";
import type { Config } from "../types/backend";

interface SearchTopLayerItemProps {
  singleSearchSpec: SearchSpec;
  myKey: string;
  search: SearchState;
  config: Config;
}

function SearchTopLayerItem({ singleSearchSpec, myKey, search, config }: SearchTopLayerItemProps) {
  const myLoadingStatus = search.searchLoadingStatus[myKey];

  const [permaLinkModalOpen, setPermaLinkModalOpen] = useState(false);
  const this_result = search.searchResults[myKey];

  const num_results =
    this_result && this_result.result
      ? this_result.result.total_count
      : "Loading";

  const getMyIndex = useCallback(() => {
    const index = search.searchSpec.findIndex(
      (item: SearchSpec) => item.key === myKey
    );
    return index;
  }, [search.searchSpec, myKey]);

  const setThisSearchSpec = useCallback(
    (thisSpec: SearchSpec) => {
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
    <>
      <TaxoniumModal
        isOpen={permaLinkModalOpen}
        onRequestClose={() => setPermaLinkModalOpen(false)}
      >
        A permalink that will link to a tree zoomed to this search is below:
        <br />
        <textarea
          onClick={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.focus();
            target.select();
          }}
          value={window.location.href + "&zoomToSearch=" + getMyIndex()}
          className="border p-2 m-4 text-xs w-full bg-neutral-100"
          readOnly={true}
        ></textarea>
      </TaxoniumModal>
      <div className="border-gray-100 border-b pb-2">
        <input
          name="isGoing"
          type="checkbox"
          style={{
            outline:
              enabled && typeof num_results === "number" && num_results > 0
                ? `2px solid rgb(${thecolor[0]},${thecolor[1]},${thecolor[2]})`
                : "0px",
            outlineOffset: "2px",
          }}
          className="m-3 inline-block"
          checked={enabled}
          onChange={(event) => search.setEnabled(myKey, event.target.checked)}
        />
        <SearchItem
          config={config}
          singleSearchSpec={singleSearchSpec}
          setThisSearchSpec={setThisSearchSpec}
        />

        <div className="flex justify-between items-center mt-2">
          <div className="text-black pr-2 text-sm">
            {" "}
            {num_results !== "Loading" && (
              <>
                {formatNumber(num_results)} result
                {typeof num_results === "number" && num_results === 1 ? "" : "s"}
              </>
            )}{" "}
            {typeof num_results === "number" && num_results > 0 && (
              <>
                <Button
                  className="inline-block bg-gray-100 text-xs mx-auto h-5 rounded-sm border-gray-300 border  text-gray-700 "
                  onClick={() => {
                    search.setZoomToSearch({ index: getMyIndex() });
                  }}
                  title="Zoom to this search"
                >
                  <FaSearch />
                </Button>{" "}
                {
                  // check if window href includes 'protoUrl'
                  (window.location.href.includes("protoUrl") ||
                    window.location.href.includes("treeUrl") ||
                    window.location.href.includes("cov2tree.org") ||
                    window.location.href.includes("backend")) &&
                    config &&
                    !config.disable_permalink && (
                      <Button
                        className="inline-block bg-gray-100 text-xs mx-auto h-5 rounded-sm border-gray-300 border text-gray-700"
                        onClick={() => {
                          setPermaLinkModalOpen(true);
                        }}
                        title="Get permalink"
                      >
                        <FaLink />
                      </Button>
                    )
                }{" "}
              </>
            )}
            {myLoadingStatus === "loading" && (
              <ClipLoader size={12} color="#444444" className="mr-3" />
            )}
          </div>
          <div>
            <Button
              title="Delete this search"
              onClick={() => search.deleteTopLevelSearch(myKey)}
            >
              <FaTrash className="text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchTopLayerItem;
