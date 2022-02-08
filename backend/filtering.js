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

function binary_search_for_insertion_point(values, search) {
  //console.log("search:", search);
  //console.log("values:", values);
  // Returns where in values to insert search to maintain sorted order.
  // If search is already in values, return its index.
  // If search is not in values, return the index where it would be inserted.
  let low = 0;
  let high = values.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] < search) {
      low = mid + 1;
    } else if (values[mid] > search) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return low;
}

function filter(input, y_positions, min_y, max_y) {
  console.log(y_positions);
  // do binary search for min_y and max_y
  const min_y_index = binary_search_for_insertion_point(y_positions, min_y);
  const max_y_index = binary_search_for_insertion_point(y_positions, max_y);

  console.log("min_y_index:", min_y_index);
  console.log("max_y_index:", max_y_index);
  // Return sliced input array
  return input.slice(min_y_index, max_y_index + 1);
}

function search(input, search_spec) {}

const addParents = (data, filtered) => {
  const start_time = Date.now();
  const selected_node_ids = filtered.map((node) => node.node_id);
  // creat a set to keep track of selected_node_ids
  const selected_node_ids_set = new Set(selected_node_ids);
  const starting_size = filtered.length;
  for (let i = 0; i < selected_node_ids.length; i++) {
    const node_id = selected_node_ids[i];
    const parent_id = data[node_id].parent_id;
    //console.log(i);

    // if parent_id is not in selected_node_ids, then add it
    if (!selected_node_ids_set.has(parent_id)) {
      selected_node_ids_set.add(parent_id);
      selected_node_ids.push(parent_id);
      //console.log("adding parent:", parent_id);
      //console.log("New length is", selected_node_ids.length);
    }
  }
  const with_parents = data.filter((node) =>
    selected_node_ids_set.has(node.node_id)
  );
  const final_size = with_parents.length;
  console.log("Adding parents took " + (Date.now() - start_time) + "ms.");
  console.log("Went from " + starting_size + " to " + final_size + " nodes.");

  return with_parents;
};

function getNodes(data, y_positions, min_y, max_y, min_x, max_x) {
  const start_time = Date.now();
  // get min_x, max_x, min_y, max_y from URL

  const filtered =
    min_y !== undefined ? filter(data, y_positions, min_y, max_y) : data;
  const time2 = Date.now();
  console.log("Filtering took " + (time2 - start_time) + "ms.");
  const precision = 4000.0 / (max_y - min_y);
  const reduced_leaves = reduceOverPlotting(filtered, precision);
  const time3 = Date.now();
  console.log("Reducing took " + (time3 - time2) + "ms.");
  const reduced = addParents(data, reduced_leaves);
  console.log("precision:", precision);
  return reduced;
}

module.exports = { reduceOverPlotting, filter, search, addParents, getNodes };
