import { useMemo, useCallback, useRef } from "react";
import type { Config, NodeLookupData } from "../types/backend";
import type { Node, Mutation } from "../types/node";
import type { ColorBy } from "../types/color";
import type { Query } from "../types/query";

interface WindowWithCc extends Window {
  cc?: unknown;
}

let cachedColorByPosition: number | null = null; // todo do this with state
let cachedColorByGene: string | null = null; // todo do this with state


function useColorBy(
  config: Config,
  query: Query,
  updateQuery: (q: Partial<Query>) => void
): ColorBy {
  const colorCacheRef = useRef<Record<string, string | number>>({});
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

  const colorByOptions = config.colorBy?.colorByOptions ?? [];

  (window as WindowWithCc).cc = colorCacheRef.current;

  const setColorByField = useCallback(
    (field: string) => {
      updateQuery({ color: JSON.stringify({ ...colorByConfig, field }) });
    },
    [colorByConfig, updateQuery]
  );

  const setColorByGene = useCallback(
    (gene: string) => {
      updateQuery({ color: JSON.stringify({ ...colorByConfig, gene }) });
    },
    [colorByConfig, updateQuery]
  );

  const setColorByPosition = useCallback(
    (pos: number) => {
      updateQuery({ color: JSON.stringify({ ...colorByConfig, pos }) });
    },
    [colorByConfig, updateQuery]
  );

  const getNodeColorField = useCallback(
    (node: Node, dataset?: NodeLookupData): string | number => {
      if (
        colorByPosition != cachedColorByPosition ||
        colorByGene != cachedColorByGene
      ) {
        /* Should be able to increase perf by moving this cache invalidation to setColorByGene and setColorByPosition */
        colorCacheRef.current = {};
        cachedColorByPosition = colorByPosition;
        cachedColorByGene = colorByGene;
      }
      if (colorByField === "None") {
        return "None";
      }

      if (colorByField === "genotype") {
        if (colorCacheRef.current[node.node_id]) {
          return colorCacheRef.current[node.node_id];
        }
        let result: string | number;
        const relevantMutations = node.mutations.filter(
          (mut: Mutation) =>
            mut.residue_pos === colorByPosition && mut.gene === colorByGene
        );
        if (relevantMutations.length > 0) {
          result = relevantMutations[0].new_residue || "X";
        } else {
          const parent_id = node.parent_id ?? node.node_id;
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
        colorCacheRef.current[node.node_id] = result;
        return result;
      } else {
        return node[colorByField];
      }
    },
    [colorByField, colorByGene, colorByPosition]
  );

  return useMemo<ColorBy>(() => {
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
