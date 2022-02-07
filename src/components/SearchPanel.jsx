import SearchTopLayerItem from "./SearchTopLayerItem";
import { RiAddCircleLine } from "react-icons/ri";

function SearchPanel({ search }) {
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
    </div>
  );
}

export default SearchPanel;
