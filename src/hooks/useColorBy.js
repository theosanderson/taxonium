import { useState } from "react";
function useColorBy(data) {
  const [colorByField, setColorByField] = useState("meta_Lineage");
  const colorByOptions = ["meta_Lineage", "meta_Country", "None"];
  const getNodeColorField = (node) => {
    if (colorByField === "None") {
      return "";
    }
    return node[colorByField];
  };
  return { colorByField, setColorByField, colorByOptions, getNodeColorField };
}
export default useColorBy;
