const addAAmuts = (aaMuts, node) => {
  const alreadyIn = [];
  aaMuts.forEach((m) => {
    if (alreadyIn.includes(m.gene)) {
      node.branch_attrs.mutations[m.gene].push(
        `${m.previous_residue}${m.residue_pos}${m.new_residue}`,
      );
    } else {
      node.branch_attrs.mutations[m.gene] = [
        `${m.previous_residue}${m.residue_pos}${m.new_residue}`,
      ];
      alreadyIn.push(m.gene);
    }
  });
};

const addNucMuts = (nucMuts, node) => {
  node.branch_attrs.mutations["nuc"] = nucMuts.map(
    (m) => `${m.previous_residue}${m.residue_pos}${m.new_residue}`,
  );
};

// can be called by local or server backend
export const getNextstrainSubtreeJson = async (
  subtree_root_id,
  nodes,
  config,
  mutations,
) => {
  const subtree_root = nodes.find((node) => node.node_id === subtree_root_id);

  const childMap = {};
  const lookup = {};
  // get child pointers
  for (const node of nodes) {
    lookup[node.node_id] = node;
    if (node.parent_id !== null) {
      if (childMap[node.parent_id] === undefined) {
        childMap[node.parent_id] = [];
      }
      childMap[node.parent_id].push(node.node_id);
    }
  }

  let muts = subtree_root.mutations.map((m) => mutations[m]);
  const nucMuts = muts.filter((m) => m.type === "nt");
  const aaMuts = muts.filter((m) => m.type === "aa");

  const treeJson = {
    name: subtree_root.name,
    node_id: subtree_root.node_id,
    node_attrs: { div: 0 },
    branch_attrs: {
      mutations: {},
    },
  };

  addAAmuts(aaMuts, treeJson);
  addNucMuts(nucMuts, treeJson);

  Object.keys(subtree_root)
    .filter((v) => v.startsWith("meta_"))
    .map((v) => ({ [v.slice(5)]: { value: subtree_root[v] } }))
    .forEach((v) => {
      Object.assign(treeJson.node_attrs, v);
    });

  const stack = [treeJson];
  const metadataSet = new Set();

  while (stack.length > 0) {
    const currNodeJson = stack.pop();
    const currNodeDiv = currNodeJson.node_attrs.div;
    const children = childMap[currNodeJson.node_id];
    const childrenJson = [];
    if (children !== undefined) {
      for (const child_id of children) {
        const child_node = lookup[child_id];
        let muts = child_node.mutations.map((m) => mutations[m]);
        const nucMuts = muts.filter((m) => m.type === "nt");
        const aaMuts = muts.filter((m) => m.type === "aa");

        const nucMutsNoAmb = nucMuts.filter(
          (m) => m.new_residue != "-" && m.previous_residue != "-",
        );
        // TODO: Above discards ambiguities from distance calculation.
        // Do we want to do this? In mpx e.g. there are nodes with
        // many thousands of ambiguous mutations which throws off display
        const childJson = {
          name: child_node.name,
          node_id: child_node.node_id,
          node_attrs: {
            div: currNodeDiv + nucMutsNoAmb.length,
          },
          branch_attrs: { mutations: {} },
        };

        // TODO add div key for genetic distance
        addAAmuts(aaMuts, childJson);
        addNucMuts(nucMuts, childJson);

        Object.keys(child_node)
          .filter((v) => v.startsWith("meta_"))
          .map((v) => ({ [v.slice(5)]: { value: child_node[v] } }))
          .forEach((v) => {
            metadataSet.add(Object.keys(v)[0]);
            Object.assign(childJson.node_attrs, v);
          });
        childrenJson.push(childJson);
        stack.push(childJson);
      }
    }
    if (childrenJson.length > 0) {
      currNodeJson.children = childrenJson;
    }
  }
  let json = {
    meta: {
      description: "JSON exported from Taxonium.",
      panels: ["tree"],
      title: config.title,
      description: "Source: " + config.source,
      display_defaults: {
        distance_measure: "div",
        color_by: metadataSet[0],
      },
      colorings: Array.from(metadataSet).map((v) => ({
        key: v,
        title: v,
        type: "categorical",
      })),
    },
    tree: treeJson,
    version: "v2",
  };
  //console.log("Nextstrain json: ", json);
  return json;
};
export default { getNextstrainSubtreeJson };
