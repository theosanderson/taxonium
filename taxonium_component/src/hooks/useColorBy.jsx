import { useMemo, useEffect, useCallback } from "react";

let colorCache = {}; // todo do this with state
let cachedColorByPosition = null; // todo do this with state
let cachedColorByGene = null; // todo do this with state

function useColorBy(config, query, updateQuery) {
  const colorByConfig = useMemo(() => {
    return query.color ? JSON.parse(query.color) : {};
  }, [query.color]);

  const colorByField = colorByConfig.field
    ? colorByConfig.field
    : config.defaultColorByField
      ? config.defaultColorByField
      : "meta_pangolin_lineage";
  const colorByGene = colorByConfig.gene
    ? colorByConfig.gene
    : config.genes && config.genes.includes("S")
      ? "S"
      : "nt";
  const colorByPosition =
    colorByConfig.pos !== undefined ? colorByConfig.pos : 484;

  const { colorByOptions } = config.colorBy
    ? config.colorBy
    : { colorByOptions: [] };

  window.cc = colorCache;

  const setColorByField = useCallback(
    (field) => {
      updateQuery({ color: JSON.stringify({ ...colorByConfig, field }) });
    },
    [colorByConfig, updateQuery],
  );

  const setColorByGene = useCallback(
    (gene) => {
      updateQuery({ color: JSON.stringify({ ...colorByConfig, gene }) });
    },
    [colorByConfig, updateQuery],
  );

  const setColorByPosition = useCallback(
    (pos) => {
      updateQuery({ color: JSON.stringify({ ...colorByConfig, pos }) });
    },
    [colorByConfig, updateQuery],
  );

  const getNodeColorField = useCallback(
    (node, dataset) => {
      if (
        colorByPosition != cachedColorByPosition ||
        colorByGene != cachedColorByGene
      ) {
        /* Should be able to increase perf by moving this cache invalidation to setColorByGene and setColorByPosition */
        colorCache = {};
        cachedColorByPosition = colorByPosition;
        cachedColorByGene = colorByGene;
      }
      if (colorByField === "None") {
        return "None";
      }
      if (colorByField === "genotype") {
        if (colorCache[node.node_id]) {
          //console.log("using cache");
          return colorCache[node.node_id];
        }
        let result;
        const relevantMutations = node.mutations.filter(
          (mut) =>
            mut.residue_pos === colorByPosition && mut.gene === colorByGene,
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
                dataset,
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
    [colorByField, colorByGene, colorByPosition],
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
    };
  }, [
    colorByField,
    colorByOptions,
    getNodeColorField,
    colorByPosition,
    colorByGene,
    setColorByField,
    setColorByGene,
    setColorByPosition,
  ]);
}
export default useColorBy;
