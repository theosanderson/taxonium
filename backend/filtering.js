const reduceOverPlotting = (input, precision) => {
  const included_points = {};

  const filtered = input.filter((node) => {
    const rounded_x = Math.round(node.x * precision) / precision;
    const rounded_y = Math.round(node.y * precision) / precision;
    if (included_points[rounded_x]) {
      if (included_points[rounded_x][rounded_y]) {
        return false;
      } else {
        included_points[rounded_x][rounded_y] = 1;
        return true;
      }
    } else {
      included_points[rounded_x] = { [rounded_y]: 1 };
      return true;
    }
  });

  return filtered;
};

function filter(input, min_y, max_y) {
  return input.filter((node) => {
    return node.y >= min_y && node.y <= max_y;
  });
}

function search(input, search_spec) {}

const addParents = (data, filtered) => {
  const start_time = Date.now();
  const selected_node_ids = filtered.map((node) => node.node_id);
  // creat a set to keep track of selected_node_ids
  const selected_node_ids_set = new Set(selected_node_ids);
  const edges = selected_node_ids.map((node_id) => {
    const parent_id = data[node_id].parent_id;
    // if parent_id is not in selected_node_ids, then add it
    if (!selected_node_ids_set.has(parent_id)) {
      selected_node_ids_set.add(parent_id);
      selected_node_ids.push(parent_id);
    }
    return data[node_id];
  });
  console.log("Adding parents took " + (Date.now() - start_time) + "ms.");

  return edges;
};
module.exports = { reduceOverPlotting, filter, search, addParents };
