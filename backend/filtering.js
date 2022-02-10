var crypto = require("crypto");
const count_per_hash = {};
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
  const precision = 4000.0 / (max_y - min_y);
  return precision;
}

function getNodes(data, y_positions, min_y, max_y, min_x, max_x) {
  const start_time = Date.now();
  // get min_x, max_x, min_y, max_y from URL

  const filtered =
    min_y !== undefined ? filter(data, y_positions, min_y, max_y) : data;
  const time2 = Date.now();
  console.log("Filtering took " + (time2 - start_time) + "ms.");
  const precision = getPrecision(min_y, max_y);
  const reduced_leaves = reduceOverPlotting(filtered, precision);
  const time3 = Date.now();
  console.log("Reducing took " + (time3 - time2) + "ms.");
  const reduced = addParents(data, reduced_leaves);
  console.log("precision:", precision);
  return reduced;
}

function searchFiltering({ data, spec, mutations, node_to_mut }) {
  console.log(mutations);
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
  } else if (spec.method === "mutation") {
    const relevant_mutations = mutations
      .filter((mutation) => {
        return (
          mutation.gene === spec.gene &&
          mutation.residue_pos === spec.position &&
          (spec.new_residue === "any" ||
            mutation.new_residue === spec.new_residue)
        );
      })
      .map((mutation) => mutation.mutation_id);
    console.log("relevant_mutations:", relevant_mutations);
    const relevant_mutations_set = new Set(relevant_mutations);
    console.log("node_to_mut:", node_to_mut);

    filtered = data.filter(
      (node) =>
        node_to_mut[node.node_id].some((mutation_id) =>
          relevant_mutations_set.has(mutation_id)
        ) && node.num_tips > spec.min_tips
    );
    console.log("filtered:", filtered);
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
    });

    const reduced = reduceOverPlotting(
      filtered_cut,
      getPrecision(min_y, max_y)
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
function getGenotype({
  node_index,
  relevant_mutations_set,
  node_to_mut,
  mutations,
  data,
  cache,
}) {
  if (node_index == 0) {
    return "X";
  }
  //console.log("getting genotype for node:", node_index);
  if (node_index in cache) {
    return cache[node_index];
  }
  const node = data[node_index];

  let relevant_node_mutations = node_to_mut[node_index].filter((x) =>
    relevant_mutations_set.has(x)
  );
  if (relevant_node_mutations.length === 0) {
    if (node.parent_id === node_index) {
      return "X";
    } else {
      const answer = getGenotype({
        node_index: node.parent_id,
        relevant_mutations_set,
        node_to_mut,
        mutations,
        data,
        cache,
      });
      cache[node_index] = answer;
      return answer;
    }
  } else {
    const answer = mutations[relevant_node_mutations[0]].new_residue;
    cache[node_index] = answer;
    //console.log("Finally returning genotype:", answer, "for node:", node_index);
    return answer;
  }
}

const extraAnnotation = ({
  input,
  data,
  extra_params,
  node_to_mut,
  mutations,
}) => {
  if (extra_params.genotype === undefined) {
    console.log("extraAnnotation: genotype is undefined, giving up");
    return input;
  }
  const relevant_mutations = mutations
    .filter(
      (mutation) =>
        mutation.gene == extra_params.genotype.gene &&
        mutation.residue_pos == extra_params.genotype.position
    )
    .map((x) => x.mutation_id);

  const relevant_mutations_set = new Set(relevant_mutations);
  console.log("relevant_mutations_set", relevant_mutations_set);
  const cache = {};

  const output = input.map((node) => ({
    ...node,
    genotype: getGenotype({
      node_index: node.node_id,
      relevant_mutations_set,
      node_to_mut,
      mutations,
      data,
      cache,
    }),
  }));
  return output;
};

module.exports = {
  reduceOverPlotting,
  filter,
  search,
  addParents,
  getNodes,
  singleSearch,
  extraAnnotation,
};
