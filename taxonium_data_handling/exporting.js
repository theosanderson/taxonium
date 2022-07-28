// can be called by local or server backend
export const getNextstrainSubtreeJson = async (subtree_root_id, nodes) => {
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

  const treeJson = {
    name: subtree_root.name,
    node_id: subtree_root.node_id,
    node_attrs: {},
  };
  Object.keys(subtree_root)
    .filter((v) => v.startsWith("meta_"))
    .map((v) => ({ [v.slice(5)]: { value: subtree_root[v] } }))
    .forEach((v) => Object.assign(treeJson.node_attrs, v));

  const stack = [treeJson];

  while (stack.length > 0) {
    const currNodeJson = stack.pop();
    const children = childMap[currNodeJson.node_id];
    const childrenJson = [];
    if (children !== undefined) {
      for (const child_id of children) {
        const child_node = lookup[child_id];
        const childJson = {
          name: child_node.name,
          node_id: child_node.node_id,
          node_attrs: {},
        };

        // TODO add div key for genetic distance

        Object.keys(child_node)
          .filter((v) => v.startsWith("meta_"))
          .map((v) => ({ [v.slice(5)]: { value: child_node[v] } }))
          .forEach((v) => Object.assign(childJson.node_attrs, v));

        childrenJson.push(childJson);
        stack.push(childJson);
      }
    }
    currNodeJson.children = childrenJson;
  }
  let json = {
    meta: {
      description: "JSON exported from Taxonium.",
      panels: ["tree"],
      title: "Taxonium JSON",
    },
    tree: treeJson,
    version: "v2",
  };
  console.log("Nextstrain json: ", json);
};
export default { getNextstrainSubtreeJson };
