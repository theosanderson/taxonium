import { useMemo, useState } from "react";
function useColorBy() {
  const [colorByField, setColorByField] = useState("meta_Lineage");

  const colorByOptions = ["meta_Lineage", "meta_Country", "genotype", "None"];
  const getNodeColorField = (node) => {
    if (colorByField === "None") {
      return "";
    }
    return node[colorByField];
  };

  const nodeRetrievalExtraParams = useMemo(() => {
    if (colorByField === "genotype") {
      return {
        genotype: { gene: "S", position: 484 },
      };
    } else {
      return {};
    }
  }, [colorByField]);

  return {
    colorByField,
    setColorByField,
    colorByOptions,
    getNodeColorField,
    nodeRetrievalExtraParams,
  };
}
export default useColorBy;
