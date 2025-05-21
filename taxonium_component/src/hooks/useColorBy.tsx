import { useMemo, useCallback, useRef } from "react";
import type { Config, NodeLookupData } from "../types/backend";
import type { Node, Mutation } from "../types/node";

interface WindowWithCc extends Window {
  cc?: unknown;
}

let cachedColorByPosition: number | null = null; // todo do this with state
let cachedColorByGene: string | null = null; // todo do this with state

interface ColorByState {
  colorByField: string;
  setColorByField: (field: string) => void;
  colorByOptions: string[];
  getNodeColorField: (node: Node, dataset: NodeLookupData) => string;
  colorByPosition: number;
  setColorByPosition: (pos: number) => void;
  colorByGene: string;
  setColorByGene: (gene: string) => void;
}

function useColorBy(
  config: Config,
  query: Record<string, any>,
  updateQuery: (q: Record<string, any>) => void
): ColorByState {
  const colorCacheRef = useRef<Record<string, string>>({});
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
    (node: Node, dataset: NodeLookupData): string => {
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
          //console.log("using cache");
          return colorCacheRef.current[node.node_id];
        }
        let result: string;
        const relevantMutations = node.mutations.filter(
          (mut: Mutation) =>
            mut.residue_pos === colorByPosition && mut.gene === colorByGene
        );
        if (relevantMutations.length > 0) {
          result = relevantMutations[0].new_residue || "X";
        } else {
          const parent_id = node.parent_id as string;
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

  return useMemo<ColorByState>(() => {
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
