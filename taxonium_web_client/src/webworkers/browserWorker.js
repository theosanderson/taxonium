import { useState } from "react";

const post_order = (nodes) => {
  console.log("POST ORDERING")
  let to_children = {};
  let root_id = null;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].parent_id == nodes[i].node_id) {
      root_id = nodes[i].node_id;
      continue;
    }
    if (to_children[nodes[i].parent_id] !== undefined) {
      to_children[nodes[i].parent_id].push(nodes[i].node_id);
    } else {
      to_children[nodes[i].parent_id] = [nodes[i].node_id];
    }
  }
  let stack = [];
  let po = [];
  stack.push(root_id);
  while (stack.length > 0) {
    const node_id = stack.pop();
    if (to_children[node_id]) {
      for (let child_id of to_children[node_id]) {
        stack.push(child_id);
      }
    }
    po.push(node_id);
  }
  //console.log("done postorder in worker", po)
  return po;
};


const computeFilteredVariationData = async (variation_data, ntBounds, data) => {
  if (!data.data || !data.data.nodes || !(variation_data.length > 0)) {
    return [];
  }
  console.log("FILTERING")
  if (data.data.nodes.length < 10000 || ntBounds[1] - ntBounds[0] < 1000) {
    return variation_data;
  } else {
    return variation_data.filter((d) => (d.y[1] - d.y[0]) > .002)
  }
}

const computeYSpan = (postorder_nodes, lookup, root) => {

  console.log("MAKING yspan")
  let yspan = {};
  let var_data = [];
  for (let i = postorder_nodes.length - 1; i >= 0; i--) {
    let node = lookup[postorder_nodes[i]];
    let parent = node.parent_id;
    if (node.node_id == root) {
      console.log("STOPEEF")
      continue;
    }
    if (!yspan[node.node_id]) { // Leaf 
      yspan[node.node_id] = [node.y, node.y];
    }
    let cur_yspan = yspan[node.node_id];
    let par_yspan = yspan[parent];
    if (par_yspan) {
      if (cur_yspan[0] < par_yspan[0]) {
        yspan[parent][0] = cur_yspan[0];
      }
      if (cur_yspan[1] > par_yspan[1]) {
        yspan[parent][1] = cur_yspan[1];
      }
    } else {
      yspan[parent] = [...cur_yspan];
    }
    for (let mut of node.mutations) {
      if (mut.gene == 'nt') {
        continue; // Skip nt mutations for now
      }
      var_data.unshift({
        y: yspan[node.node_id],
        m: mut
      });
    }
  }
  return var_data;
}

const computeVariationData = async (data, type, memoIndex) => {
  console.log("incompu")
  // compute in chunks starting at memoIndex
  let var_data = [];
  let blank = [[], {}, false]
  let ref = { 'aa': {}, 'nt': {} };
  let shouldCache = false;
  let nodes = null;
  let lookup = null;
  if (data && data.data && data.data.nodes && data.data.nodes.length < 90000) {
    console.log("smaller")
    nodes = data.data.nodes;
    lookup = data.data.nodeLookup;
  } else {
    if (!data.base_data || !data.base_data.nodes) {
      return blank;
    }
    console.log("base data")
    nodes = data.base_data.nodes;
    lookup = data.base_data.nodeLookup;
    shouldCache = true;
  }

  if (!nodes) {
    return null;
  }
  if (!data.data.nodeLookup) {
    return null;
  }

  const postorder_nodes = post_order(nodes);
  const root = postorder_nodes.find((id) => id == lookup[id].parent_id);
  for (let mut of lookup[root].mutations) {
    if (mut.gene == 'nt') {
      ref['nt'][mut.residue_pos] = mut.new_residue
    } else {
      ref['aa'][mut.gene + ':' + mut.residue_pos] = mut.new_residue;
    }
  }

  const rev_postorder_nodes = postorder_nodes.reverse();
  var_data = computeYSpan(postorder_nodes, lookup, root);
  console.log("Hear")
  // for (let i = memoIndex; i < postorder_nodes.length; i++) {
  //   const node = lookup[postorder_nodes[i]];
  //   for (let mut of node.mutations) {
  //     if (mut.gene == 'nt' && type == 'nt' || mut.gene != 'nt' && type == 'aa') {
  //       var_data.unshift({
  //         y: yspan[node.node_id],
  //         m: mut
  //       });
  //     }
  //   }
  // }
  console.log(var_data, ref, shouldCache)
  return [var_data, ref, shouldCache];
}

onmessage = async (event) => {

  //Process uploaded data:
  if (!event.data) {
    return;
  }
  let filteredVarData, ntBounds, varData, shouldCache;
  let ref = null;
  const data = event.data.data;
  ({ ntBounds } = event.data);


  if (event.data.type == "variation_data_aa") {
    const [varData, ref, shouldCache] = await computeVariationData(data, 'aa', 0);
   // filteredVarData = await computeFilteredVariationData(varData, ntBounds, data);

    if (shouldCache) {
      postMessage({
        type: "variation_data_return_cache_aa",
        filteredVarData: varData,
        reference: ref
      })
      return;
    }
    postMessage({
      type: "variation_data_return_aa",
      filteredVarData: filteredVarData,
      reference: ref,
    })
  } else if (event.data.type == "variation_data_nt") {
    const [varData, ref, shouldCache] = await computeVariationData(data, 'nt', 0);
    filteredVarData = await computeFilteredVariationData(varData, ntBounds, data);

    if (shouldCache) {
      postMessage({
        type: "variation_data_return_cache_nt",
        filteredVarData: filteredVarData,
        reference: ref
      })
      return;
    }
    postMessage({
      type: "variation_data_return_nt",
      filteredVarData: filteredVarData,
      reference: ref,
    })
  }
}

//  }