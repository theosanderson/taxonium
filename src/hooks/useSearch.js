import { useState } from "react";

const useSearch = () => {
  const [searchSpec, setSearchSpec] = useState([]);

  const addNewTopLevelSearch = () => {
    console.log("addNewTopLevelSearch");
    setSearchSpec([...searchSpec, {}]);
  };

  const deleteTopLevelSearch = (index) => {
    setSearchSpec(searchSpec.filter((_, i) => i !== index));
  };

  return {
    searchSpec,
    setSearchSpec,
    addNewTopLevelSearch,
    deleteTopLevelSearch,
  };
};

export default useSearch;
