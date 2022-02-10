import { useMemo, useState } from "react";
function useColorBy() {
  const [colorByField, setColorByField] = useState("meta_Lineage");
  const [colorByGene, setColorByGene] = useState("S");
  const [colorByPosition, setColorByPosition] = useState(501);

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
        genotype: { gene: colorByGene, position: colorByPosition },
      };
    } else {
      return {};
    }
  }, [colorByField, colorByGene, colorByPosition]);

  return {
    colorByField,
    setColorByField,
    colorByOptions,
    getNodeColorField,
    nodeRetrievalExtraParams,
    colorByPosition,
    setColorByPosition,
    colorByGene,
    setColorByGene,
  };
}
export default useColorBy;
