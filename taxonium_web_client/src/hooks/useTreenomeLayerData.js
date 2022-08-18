import { useCallback, useMemo, useEffect, useState } from "react";

const make_to_children = (data) => {
  if (!data) {
    return [{}, null];
  }
  const nodes = data.nodes;
  let to_children = {};
  let root_id = null;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].parent_id === nodes[i].node_id) {
      root_id = nodes[i].node_id;
      continue;
    }
    if (to_children[nodes[i].parent_id] !== undefined) {
      to_children[nodes[i].parent_id].push(nodes[i].node_id);
    } else {
      to_children[nodes[i].parent_id] = [nodes[i].node_id];
    }
  }
 
  return [to_children, root_id];
};

const postorder_traversal = ( root_id,to_children, data) => {
  if (!data) {
    return [];
  }
  const nodes = data.nodes;
  let result = [];
  let stack = [root_id];
  while (stack.length > 0) {
    let node_id = stack.pop();
    if (to_children[node_id] !== undefined) {
      for (let i = to_children[node_id].length - 1; i >= 0; i--) {
        stack.push(to_children[node_id][i]);
      }
    }
    result.push(node_id);
  }
  console.log("result", result, "root_id", root_id);
  result.reverse();
  return result;
}

const min_and_max_y = (postorder, to_children, data) =>{
  const min_y = {}
  const max_y = {}
  postorder.forEach(node_id => {

    const node = data.nodeLookup[node_id];
    min_y[node_id] = node.y;
    max_y[node_id] = node.y;
    const children = to_children[node_id];
    if (children) {
      children.forEach(child_id => {
        min_y[node_id] = Math.min(min_y[node_id], min_y[child_id]);
        max_y[node_id] = Math.max(max_y[node_id], max_y[child_id]);
      }
      )
    }
  }
  )
  return [min_y, max_y];
}


  

const nodes_satisfying_function = (starting_node_id, data, to_children, matching_function) => {
  let satisfying_nodes = [];
  let next_nodes = []
  const my_children = to_children[starting_node_id];
  if(my_children){
    next_nodes = [...my_children];
  }
  while (next_nodes.length > 0) {
    let next_node_id = next_nodes.pop();
    if (matching_function(data.nodeLookup[next_node_id])) {
      satisfying_nodes.push(next_node_id);
    }
    else{ // N.B. the else, we do not descend into children of nodes that do satisfy.
    const children = to_children[next_node_id];
    if(children){
      children.forEach(child => {
        next_nodes.push(child);
      }
      );
    }
  }
}
  return satisfying_nodes;
   
}

const node_mutation_to_lines = (node,mutation, to_children, data,minY,maxY) => {

  const has_mutation_in_same_place = (node) =>
    node.mutations.some( m=> m.residue_pos === mutation.residue_pos && m.gene === mutation.gene);
  const nodes_with_mutations_away = nodes_satisfying_function(node.node_id, data, to_children, has_mutation_in_same_place);
  //console.log("nodes_with_mutations_away", nodes_with_mutations_away);
  const ranges_negative = nodes_with_mutations_away.map(node_id => [minY[node_id], maxY[node_id]]);
  ranges_negative.sort((a,b) => a[0] - b[0]);
  const total_range = [minY[node.node_id],  maxY[node.node_id]]
  let output_ranges
  if (ranges_negative.length === 0) {
    output_ranges = [total_range];
  }
  else {
    // create a series of ranges which are the inverse of the ranges_negative
    output_ranges = [total_range];
    for (let i = 0; i < ranges_negative.length; i++) {
      const range = ranges_negative[i];
      const new_range = [range[1], output_ranges[output_ranges.length - 1][0]];
      output_ranges.push(new_range);
      output_ranges[output_ranges.length - 2][1] = range[0];
    }
  }
  const to_output = output_ranges.map(range => ({y:range, m:mutation}))
  //console.log("to_output", to_output);
  return to_output;

    

}
;

const getAllLines = (data, to_children, root_id, minY, maxY, mutation_checker) => {
  console.log("getAllLines start");
  if(!data){
    return [];
  }
  let lines = [];
  let next_nodes = to_children[root_id];
  while (next_nodes.length > 0) {
    let next_node_id = next_nodes.pop();
    //console.log("next_node_id", next_node_id);
    //console.log("data",data)
    let node = data.nodeLookup[next_node_id];
    
    node.mutations.forEach(mutation => {
      //console.log("mutation", mutation);
      if (mutation_checker(mutation)) {
      const result = node_mutation_to_lines(node,mutation, to_children, data,minY, maxY);
      result.forEach(line => {
        lines.push(line);
      }
      );
    }
    }
    );
  
    const children = to_children[next_node_id]
    if(children){
      children.forEach(child => {
        next_nodes.push(child);
      }
      );
    }
    
  }
  console.log("getAllLines end");
  console.log("lines", lines);
  return lines
}



const useTreenomeLayerData = (
  data,
  treenomeState,
  settings,
  selectedDetails
) => {
  const my_data = data.base_data
  
  
  const [treenomeLayerData, setTreenomeLayerData] = useState({});
  
  const [to_children, root_id] = useMemo(() => make_to_children(my_data), [my_data]);
  const postorder = useMemo(() => postorder_traversal(root_id, to_children, my_data), [root_id, to_children, my_data]);
  const [minY, maxY] = useMemo(() => min_and_max_y(postorder, to_children, my_data), [postorder, to_children, my_data]);
  const mutationChecker = useMemo(
    () => (mutation) => mutation.gene!=="nt"
    ,[])
  const allLines = useMemo(() => getAllLines(my_data, to_children, root_id, minY, maxY,mutationChecker), [my_data, to_children, root_id,minY,maxY,mutationChecker]);

  return {allLines}
}



export default useTreenomeLayerData;
