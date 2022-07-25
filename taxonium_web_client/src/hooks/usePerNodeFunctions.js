import { useMemo } from "react";

function usePerNodeFunctions(data, config) {
  const getNodeGenotype = (node_id) => {
    console.log("data", data);
    let cur_node = data.data.nodeLookup[node_id];
    const assembled_mutations = [];

    while (cur_node.parent_id !== cur_node.node_id) {
      const nt_mutations = cur_node.mutations.filter(
        (mutation) => mutation.type === "nt"
      );
      const filtered_nt_mutations = nt_mutations.filter(
        (mutation) =>
          !assembled_mutations.some(
            (m) => m.residue_pos === mutation.residue_pos
          )
      );
      assembled_mutations.push(...filtered_nt_mutations);
      cur_node = data.data.nodeLookup[cur_node.parent_id];
    }
    return assembled_mutations;
  };
  const getCovSpectrumQuery = (node_id) => {
    const genotypes = getNodeGenotype(node_id).map(
      (m) => m.residue_pos + m.new_residue
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
