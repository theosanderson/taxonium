import SearchItem from "./SearchItem";
import { BsTrash } from "react-icons/bs";

function SearchTopLayerItem({ singleSearchSpec, myKey, search }) {
  return (
    <div className="border-gray-100 border-b mb-3 pb-3">
      <SearchItem singleSearchSpec={singleSearchSpec} />
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
