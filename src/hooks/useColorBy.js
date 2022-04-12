import { useMemo, useState, useEffect, useCallback } from "react";

let colorCache = {};

function useColorBy(config) {
  const { colorByOptions, prettyColorByOptions } = config.colorBy
    ? config.colorBy
    : { colorByOptions: [], prettyColorByOptions: {} };

  window.cc = colorCache;
  const [colorByField, setColorByField] = useState("meta_Lineage");
  const [colorByGene, setColorByGene] = useState("S");
  const [colorByPosition, setColorByPosition] = useState(501);

  useEffect(() => {
    console.log("clearing cache");
    colorCache = {};
  }, [colorByGene, colorByPosition]);

  const getNodeColorField = useCallback(
    (node, dataset) => {
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
          (mut) =>
            mut.residue_pos === colorByPosition && mut.gene === colorByGene
        );
        if (relevantMutations.length > 0) {
          result = relevantMutations[0].new_residue;
        } else {
          const parent_id = node.parent_id;
          if (parent_id === node.node_id) {
            result = "X";
          } else {
            if (
              dataset &&
              dataset.nodeLookup &&
              dataset.nodeLookup[parent_id]
            ) {
              result = getNodeColorField(
                dataset.nodeLookup[parent_id],
                dataset
              );
            } else {
              result = "X";
            }
          }
        }
        colorCache[node.node_id] = result;
        return result;
      } else {
        return node[colorByField];
      }
    },
    [colorByField, colorByGene, colorByPosition]
  );

  return useMemo(() => {
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
  }, [
    colorByField,
    colorByOptions,
    getNodeColorField,
    colorByPosition,
    colorByGene,
    prettyColorByOptions,
  ]);
}
export default useColorBy;
