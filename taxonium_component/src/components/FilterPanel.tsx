import FilterTopLayerItem from "./FilterTopLayerItem";
import { RiAddCircleLine } from "react-icons/ri";
import { Button } from "../components/Basic";
import { FaFilter } from "react-icons/fa";
import { FilterState } from "../types/filter";
import type { Config } from "../types/backend";

interface FilterPanelProps {
  filter: FilterState;
  config: Config;
  className?: string;
}

function FilterPanel({ filter, config, className }: FilterPanelProps) {
  return (
    <div className={className}>
      <div className="py-3 flex flex-col md:min-h-0 border-gray-200">
        <div className="flex items-center mb-2">
          <h2 className="font-bold text-gray-700 flex items-center">
            <FaFilter className="ml-1 mr-1.5 text-gray-500 h-4 w-4" />
            Filter
          </h2>
        </div>
        <div className="space-y-2 md:overflow-y-auto -mr-4 pr-4">
          {filter.filterSpec.map((item) => (
            <FilterTopLayerItem
              key={item.key}
              singleFilterSpec={item}
              myKey={item.key}
              filter={filter}
              config={config}
            />
          ))}
          <Button
            className="mx-auto flex items-center font-medium leading-6 mt-2"
            onClick={filter.addNewTopLevelFilter}
          >
            <RiAddCircleLine className="mr-1 h-4 w-4 text-gray-500" />
            <span>Add a new filter</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
