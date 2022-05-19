var crypto = null;
import("crypto").then((c) => {
  crypto = c;
});

let revertant_mutations_set = null;

const getRevertantMutationsSet = (all_data, node_to_mut, mutations) => {
  const root = all_data.find((node) => node.node_id === node.parent_id);
  const root_mutations = node_to_mut[root.node_id];
  const all_genes = [...new Set(mutations.map((m) => m.gene))];
  const gene_sequence = Object.fromEntries(all_genes.map((g) => [g, {}]));

  root_mutations.forEach((mut) => {
    const m = mutations[mut]
    gene_sequence[m.gene][m.residue_pos] = m.new_residue;
  });
  const revertant_mutations = mutations.filter(
    (m) =>
      m.gene in gene_sequence &&
      gene_sequence[m.gene][m.residue_pos] === m.new_residue &&
      m.new_residue !== m.previous_residue
  );
  return new Set(revertant_mutations.map((m) => m.mutation_id));
};

const count_per_hash = {};
const reduceOverPlotting = (input, precisionX, precisionY, xType) => {
  const included_points = {};
  precisionX = precisionX / 5;
  console.log(
    "REDUCING20",
    "precisionX:",
    precisionX,
    "precisionY:",
    precisionY
  );

  const filtered = input.filter((node) => {
    const rounded_x = Math.round(node[xType] * precisionX) / precisionX;
    const rounded_y = Math.round(node.y * precisionY) / precisionY;
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
  // Returns where in values to insert search to maintain sorted order.

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

function getPrecision(min_y, max_y) {
  const precision = 2000.0 / (max_y - min_y);
  return precision;
}

function getNodes(data, y_positions, min_y, max_y, min_x, max_x, xType) {
  console.log("GETNODES", min_y, max_y, min_x, max_x, xType);
  const start_time = Date.now();
  // get min_x, max_x, min_y, max_y from URL

  const filtered =
    min_y !== undefined ? filter(data, y_positions, min_y, max_y) : data;
  const time2 = Date.now();
  console.log("Filtering took " + (time2 - start_time) + "ms.");

  const reduced_leaves = reduceOverPlotting(
    filtered.filter((node) => node.num_tips == 1),
    getPrecision(min_x, max_x),
    getPrecision(min_y, max_y),
    xType
  );
  const time3 = Date.now();
  console.log("Reducing took " + (time3 - time2) + "ms.");
  const reduced = addParents(data, reduced_leaves);

  return reduced;
}

function searchFiltering({ data, spec, mutations, node_to_mut, all_data }) {
  //console.log("SEARCHFILTER", data);
  console.log(spec);
  let filtered;
  if (["text_match", "text_exact"].includes(spec.method) && spec.text === "") {
    return [];
  }
  if (spec.position) {
    spec.position = parseInt(spec.position);
  }
  if (spec.method === "text_match") {
    // case insensitive
    spec.text = spec.text.toLowerCase();
    filtered = data.filter((node) =>
      node[spec.type].toLowerCase().includes(spec.text)
    );
    return filtered;
  } else if (spec.method === "text_exact") {
    // case insensitive
    spec.text = spec.text.toLowerCase();
    filtered = data.filter(
      (node) => node[spec.type].toLowerCase() === spec.text
    );
    return filtered;
  } else if (spec.method === "text_per_line") {
    // case insensitive
    const possible_matches = new Set(
      spec.text
        .toLowerCase()
        .split("\n")
        .map((line) => {
          return line.trim();
        })
        .filter((line) => line !== "")
    );

    filtered = data.filter((node) => {
      const to_test = node[spec.type].toLowerCase().trim();
      //console.log(to_test);
      // check if node's spec type is in possible_matches
      return possible_matches.has(to_test);
    });
    return filtered;
  } else if (spec.method === "mutation") {
    const relevant_mutations = mutations
      .filter((mutation) => {
        return (
          mutation &&
          mutation.gene === spec.gene &&
          mutation.residue_pos === spec.position &&
          (spec.new_residue === "any" ||
            mutation.new_residue === spec.new_residue)
        );
      })
      .map((mutation) => mutation.mutation_id);
    console.log("relevant_mutations:", relevant_mutations);
    const relevant_mutations_set = new Set(relevant_mutations);
    //console.log("node_to_mut:", node_to_mut);
    console.log("NODE", data[0]);

    filtered = data.filter(
      (node) =>
        node_to_mut[node.node_id].some((mutation_id) =>
          relevant_mutations_set.has(mutation_id)
        ) && node.num_tips > spec.min_tips
    );
    console.log("filtered:", filtered);
    return filtered;
  } else if (spec.method === "revertant") {
    if (!all_data) {
      all_data = data;
    }
    if (revertant_mutations_set === null) {
      revertant_mutations_set = getRevertantMutationsSet(
        all_data,
        node_to_mut,
        mutations
      );
    }

    filtered = data.filter(
      (node) =>
        node.num_tips > spec.min_tips &&
        node_to_mut[node.node_id].some((mutation_id) =>
          revertant_mutations_set.has(mutation_id)
        )
    );
    //console.log("filtered:", filtered);
    return filtered;
  }
  return [];
}

function singleSearch({
  data,
  spec,
  min_y,
  max_y,
  y_positions,
  mutations,
  node_to_mut,
  xType,
  min_x,
  max_x,
}) {
  const text_spec = JSON.stringify(spec);
  const max_to_return = 10000;
  const hash_spec = crypto
    .createHash("md5")
    .update(text_spec)
    .digest("hex")
    .slice(0, 8);
  let filtered = null;
  if (count_per_hash[hash_spec] === undefined) {
    filtered = searchFiltering({ data, spec, mutations, node_to_mut });
    count_per_hash[hash_spec] = filtered.length;
  }
  const num_returned = count_per_hash[hash_spec];
  let result;
  if (num_returned > max_to_return) {
    const cut = filter(data, y_positions, min_y, max_y);
    const filtered_cut = searchFiltering({
      data: cut,
      spec,
      mutations,
      node_to_mut,
      all_data: data,
    });

    const reduced = reduceOverPlotting(
      filtered_cut,
      getPrecision(min_x, max_x),
      getPrecision(min_y, max_y),
      xType
    );
    result = {
      type: "filtered",
      data: reduced,
      total_count: num_returned,
    };
  } else {
    if (filtered === null) {
      filtered = searchFiltering({ data, spec, mutations, node_to_mut });
    }
    result = {
      type: "complete",
      data: filtered,
      total_count: num_returned,
    };
  }
  return result;
}

function addMutations(input, mutations, node_to_mut) {
  const start_time = new Date();
  const result = input.map((node) => ({
    ...node,
    mutations: node_to_mut[node.node_id],
  }));
  console.log("addMutations:", new Date() - start_time);
  return result;
}

export default {
  reduceOverPlotting,
  filter,
  search,
  addParents,
  getNodes,
  singleSearch,
  addMutations,
};
