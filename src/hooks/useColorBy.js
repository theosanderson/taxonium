import { useMemo, useState, useEffect } from "react";

let colorCache = {};
function useColorBy() {
  window.cc = colorCache;
  const [colorByField, setColorByField] = useState("meta_Lineage");
  const [colorByGene, setColorByGene] = useState("S");
  const [colorByPosition, setColorByPosition] = useState(501);

  const colorByOptions = ["meta_Lineage", "meta_Country", "genotype", "None"];
  const prettyColorByOptions = {
    meta_Lineage: "Lineage",
    meta_Country: "Country",
    genotype: "Genotype",
    None: "None",
  };

  useEffect(() => {
    console.log("clearing cache");
    colorCache = {};
  }, [colorByGene, colorByPosition]);

  console.log(colorByPosition, "b", colorByGene === "S");
  const getNodeColorField = (node, dataset) => {
    if (colorByField === "None") {
      return "none";
    }
    if (colorByField === "genotype") {
      if (colorCache[node.node_id]) {
        //console.log("using cache");
        return colorCache[node.node_id];
      }
      let result;
      const relevantMutations = node.mutations.filter(
        (mut) => mut.residue_pos === colorByPosition && mut.gene === colorByGene
      );
      if (relevantMutations.length > 0) {
        result = relevantMutations[0].new_residue;
      } else {
        const parent_id = node.parent_id;
        if (parent_id === node.node_id) {
          result = "X";
        } else {
          result = getNodeColorField(dataset.nodeLookup[parent_id], dataset);
        }
      }
      colorCache[node.node_id] = result;
      return result;
    } else {
      return node[colorByField];
    }
  };

  return {
    colorByField,
    setColorByField,
    colorByOptions,
    getNodeColorField,

    colorByPosition,
    setColorByPosition,
    colorByGene,
    setColorByGene,
    prettyColorByOptions,
  };
}
export default useColorBy;
