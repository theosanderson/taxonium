import SearchTopLayerItem from "./SearchTopLayerItem";
import { RiAddCircleLine } from "react-icons/ri";
import { FaSearch } from "react-icons/fa";

const genes = ["S", "N"];
function SearchPanel({ search, colorBy, summary, selectedDetails }) {
  return (
    <div className="overflow-y-auto" style={{ height: "calc(100vh - 5em)" }}>
      <div className="text-sm mt-3 text-gray-700 mb-1">
        Displaying {summary.num_nodes} nodes
        {summary.source && ` from ${summary.source}`}
      </div>
      <h2 className="text-lg text-gray-500 mt-5">
        <FaSearch className="inline-block mr-2 w-4" />
        Search
      </h2>
      {search.searchSpec.map((item) => (
        <SearchTopLayerItem
          key={item.key}
          singleSearchSpec={item}
          myKey={item.key}
          search={search}
        />
      ))}
      <button
        className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
        onClick={search.addNewTopLevelSearch}
      >
        <RiAddCircleLine className="inline-block mr-2" />
        Add a new search
      </button>
      <hr />
      Color by:{" "}
      <select
        value={colorBy.colorByField}
        onChange={(e) => colorBy.setColorByField(e.target.value)}
        className="inline-block w-56 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
      >
        {colorBy.colorByOptions.map((item) => (
          <option key={item} value={item}>
            {colorBy.prettyColorByOptions[item]}
          </option>
        ))}
      </select>
      {colorBy.colorByField === "genotype" && (
        <div>
          Gene:{" "}
          <select
            value={colorBy.colorByGene}
            onChange={(e) => colorBy.setColorByGene(e.target.value)}
            className="inline-block w-16 mr-4 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
          >
            {genes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          Position:{" "}
          <input
            value={colorBy.colorByPosition}
            onChange={(e) =>
              colorBy.setColorByPosition(parseInt(e.target.value))
            }
            type="number"
            min="0"
            className="inline-block w-16 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
          />
        </div>
      )}
      {selectedDetails.nodeDetails && (
        <div>
          <hr />
          <h2>{selectedDetails.nodeDetails.name}</h2>
        </div>
      )}
    </div>
  );
}

export default SearchPanel;
