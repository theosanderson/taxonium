import SearchTopLayerItem from "./SearchTopLayerItem";
import { RiAddCircleLine } from "react-icons/ri";

function SearchPanel({ search, colorBy }) {
  return (
    <div className="overflow-y-auto" style={{ height: "calc(100vh - 5em)" }}>
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
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SearchPanel;
