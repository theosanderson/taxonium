import React from "react";
import { FaSearch } from "react-icons/fa";
function SearchPanel() {
  return (
    <div>
      <h2 className="text-xl mt-5">
        <FaSearch className="inline-block mr-2" />
        Search
      </h2>
    </div>
  );
}

export default SearchPanel;
