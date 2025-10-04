
import type { DynamicDataWithLookup, Config } from "../types/backend";
import type { Mutation, Node } from "../types/node";

function usePerNodeFunctions(data: DynamicDataWithLookup, config: Config) {
  const getNodeGenotype = (node_id: number) => {

    let data_to_use;
    if (data.data.nodeLookup[node_id]) {
      data_to_use = data.data;
    } else if (data.base_data.nodeLookup[node_id]) {
      data_to_use = data.base_data;
    } else {
      console.log(
        "UNEXPECTED ERROR: node not found",
        node_id,
        data.data,
        data.base_data
      );
      return null;
    }
    let cur_node: Node = data_to_use.nodeLookup[node_id];

    const assembled_mutations: Mutation[] = [];

    while (cur_node.parent_id !== cur_node.node_id) {
      const nt_mutations = cur_node.mutations.filter(
        (mutation: Mutation) => mutation.type === "nt"
      );
      const filtered_nt_mutations = nt_mutations.filter(
        (mutation: Mutation) =>
          !assembled_mutations.some(
            (m) => m.residue_pos === mutation.residue_pos
          )
      );
      assembled_mutations.push(...filtered_nt_mutations);
      cur_node = data_to_use.nodeLookup[cur_node.parent_id!];
    }
    return assembled_mutations;
  };
  const getCovSpectrumQuery = (node_id: number) => {
    const genotype = getNodeGenotype(node_id);
    if (!genotype) {
      return "";
    }
    const genotypes = genotype.map(
      (m) => `${m.residue_pos ?? ""}${m.new_residue ?? ""}`
    );
    const num_genotypes = genotypes.length;
    const query = `[${num_genotypes}-of:${genotypes.join(", ")}]`;
    const url_encoded_query = encodeURIComponent(query);
    const url = `//cov-spectrum.org/explore/World/AllSamples/AllTimes/variants?variantQuery=${url_encoded_query}`;
    return url;
  };

  return { getNodeGenotype, getCovSpectrumQuery };
}

export default usePerNodeFunctions;
