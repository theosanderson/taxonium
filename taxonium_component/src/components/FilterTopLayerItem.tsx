import SearchItem from "./SearchItem";
import { FaFilter, FaTrash } from "react-icons/fa";
import { useCallback } from "react";
import { Button } from "../components/Basic";
import { formatNumber } from "../utils/formatNumber";
import { ClipLoader } from "react-spinners";

import type { FilterSpec, FilterState } from "../types/filter";
import type { Config, SearchType } from "../types/backend";

interface FilterTopLayerItemProps {
  singleFilterSpec: FilterSpec;
  myKey: string;
  filter: FilterState;
  config: Config;
}

function FilterTopLayerItem({ singleFilterSpec, myKey, filter, config }: FilterTopLayerItemProps) {
  const filterConfig: Config = {
    ...config,
    search_types: ((config.search_types as SearchType[]) ?? []).filter(
      (type) => type.name !== "num_tips",
    ),
  };

  const myLoadingStatus = filter.filterLoadingStatus[myKey];

  const this_result = filter.filterResults[myKey];

  const num_results =
    this_result && this_result.result
      ? this_result.result.total_count
      : "Loading";

  const getMyIndex = useCallback(() => {
    const index = filter.filterSpec.findIndex(
      (item: FilterSpec) => item.key === myKey
    );
    return index;
  }, [filter.filterSpec, myKey]);

  const setThisFilterSpec = useCallback(
    (thisSpec: FilterSpec) => {
      const index = getMyIndex();
      const newFilterSpec = [...filter.filterSpec];
      newFilterSpec[index] = thisSpec;
      filter.setFilterSpec(newFilterSpec);
    },
    [filter, getMyIndex]
  );

  const enabled =
    filter.filtersEnabled[myKey] !== undefined
      ? filter.filtersEnabled[myKey]
      : false;

  return (
    <>
      <div className="border-gray-100 border-b pb-2">
        <input
          name="isGoing"
          type="checkbox"
          style={{
            outline:
              enabled && typeof num_results === "number" && num_results > 0
                ? "2px solid rgb(139, 69, 19)"
                : "0px",
            outlineOffset: "2px",
          }}
          className="m-3 inline-block"
          checked={enabled}
          onChange={(event) => filter.setEnabled(myKey, event.target.checked)}
        />
        <SearchItem
          config={filterConfig}
          singleSearchSpec={singleFilterSpec}
          setThisSearchSpec={setThisFilterSpec}
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
            {myLoadingStatus === "loading" && (
              <ClipLoader size={12} color="#444444" className="mr-3" />
            )}
          </div>
          <div>
            <Button
              title="Delete this filter"
              onClick={() => filter.deleteTopLevelFilter(myKey)}
            >
              <FaTrash className="text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FilterTopLayerItem;
