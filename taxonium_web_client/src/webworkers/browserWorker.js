import { useState } from "react";

const post_order = (nodes) => {
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
  if (data.data.nodes.length < 10000 || ntBounds[1] - ntBounds[0] < 1000) {
    return variation_data;
  } else {
    return variation_data.filter((d) => (d.y[1] - d.y[0]) > .002)
  }
}
const computeVariationData = async (data) => {


  // Assumes that nodes in data are in preorder.
  // We visit them in reverse order to traverse bottom up
  let var_data = [];
  let blank = [[], {}, false]
  let ref = {};
  let shouldCache = false;
  let nodes = null;
  let lookup = null;
  if (data && data.data && data.data.nodes && data.data.nodes.length < 90000) {
    nodes = data.data.nodes;
    lookup = data.data.nodeLookup;
  } else {
    if (!data.base_data || !data.base_data.nodes) {
      return blank;
    }
    nodes = data.base_data.nodes;
    lookup = data.base_data.nodeLookup;
    shouldCache = true;
  }

  if (!nodes) {
    return blank;
  }
  if (!data.data.nodeLookup) {
    return blank;
  }
  const postorder_nodes = post_order(nodes);

  const root = postorder_nodes.find((id) => id == lookup[id].parent_id);
  let yspan = {};
  for (let i = postorder_nodes.length - 1; i >= 0; i--) {
    let node = lookup[postorder_nodes[i]];
    let parent = node.parent_id;
    if (!yspan[node.node_id]) { // Leaf 
      yspan[node.node_id] = [node.y, node.y];
    }
    //console.log("node", node, parent, node.name)
    let cur_yspan = yspan[node.node_id];
    let par_yspan = yspan[parent];
    //console.log("cur, par", cur_yspan, par_yspan);
    if (par_yspan) {
      if (cur_yspan[0] < par_yspan[0]) {
        yspan[parent][0] = cur_yspan[0];
      }
      if (cur_yspan[1] > par_yspan[1]) {
        yspan[parent][1] = cur_yspan[1];
      }
    } else {
      //  console.log(cur_yspan)
      yspan[parent] = [...cur_yspan];
    }
    for (let mut of node.mutations) {
      if (mut.gene == 'nt') {
        continue; // Skip nt mutations for now
      }
      if (node.node_id == root) {
        ref[mut.gene + ':' + mut.residue_pos] = mut.new_residue;
        continue;
      }
      var_data.unshift({
        y: yspan[node.node_id],
        m: mut
      });
    }

  }

  console.log("stop var")

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


  if (event.data.type == "variation_data") {
    console.log("DOING BOTH ONES")
    const [varData, ref, shouldCache] = await computeVariationData(data);
    filteredVarData = await computeFilteredVariationData(varData, ntBounds, data);

    //    [varData, ref, shouldCache] = await computeVariationData(data);
    console.log("RESULT", varData, ref, shouldCache)
    if (shouldCache) {
      console.log("sending back cacheable")
      postMessage({
        type: "variation_data_return_cache",
        filteredVarData: filteredVarData,
        reference: ref
      })
      return;
    }

    postMessage({
      type: "variation_data_return",
      filteredVarData: filteredVarData,
      reference: ref,
      //  filteredVariationData: filteredVariationData
    })
  }
}

//  }

