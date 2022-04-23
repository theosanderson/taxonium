import pako from "pako";
import zlib from "zlib";
import stream from "stream";
import buffer from "buffer";

export const modules= {zlib,stream, buffer}

function reduceMaxOrMin(array, accessFunction, maxOrMin) {
  if(maxOrMin === 'max') {
    return accessFunction(array.reduce(function(max, item) {
      return accessFunction(item) > accessFunction(max) ? item : max;
    }));
  }
    else if(maxOrMin === 'min') {
    return accessFunction(array.reduce(function(min, item) {
      return accessFunction(item) < accessFunction(min) ? item : min;
    }));
  }
}

export const decodeAndConvertToObjectFromBuffer = async (uploaded_data, getProto, sendStatusMessage) => {
    const proto = await getProto();
  
    const NodeList = proto.lookupType("AllData");
    let message;
    if (uploaded_data.type && uploaded_data.type === "gz") {
      sendStatusMessage("Extracting data from compressed protobuf");
      message = NodeList.decode(new Uint8Array(pako.ungzip(uploaded_data.data))); // TODO refactor this to function so it gets deleted after use
    } else {
      sendStatusMessage("Extracting data from protobuf");
      message = NodeList.decode(new Uint8Array(uploaded_data.data));
    }
  
    sendStatusMessage("Converting data to initial javascript object");
    const result = NodeList.toObject(message);
    console.log("got result", result);
    return result;
  };
  

  export const unstackUploadedData = async (result, sendStatusMessage) => {
    let node_data_in_columnar_form = result.node_data;
  
    const nodes_initial = [];
    result.mutation_mapping = result.mutation_mapping.map((x, i) => {
      if (x === "") {
        return null;
      }
      const [gene, rest] = x.split(":");
      const [previous_residue, residue_pos, new_residue] = rest.split("_");
      return {
        gene,
        previous_residue,
        residue_pos: parseInt(residue_pos),
        new_residue,
        mutation_id: i,
      };
    });
  
    const mutation_mapping = result.mutation_mapping;
  
    sendStatusMessage("Extracting individual nodes from columnar format");
  
    for (let i in node_data_in_columnar_form.names) {
      const new_node = {
        name: node_data_in_columnar_form.names[i],
        x: node_data_in_columnar_form.x[i],
        y: node_data_in_columnar_form.y[i],
        genbank: node_data_in_columnar_form.genbanks[i],
        num_tips: node_data_in_columnar_form.num_tips[i],
        parent_id: node_data_in_columnar_form.parents[i],
        date: result.date_mapping[node_data_in_columnar_form.dates[i]],
        mutations: node_data_in_columnar_form.mutations[i].mutation
          ? node_data_in_columnar_form.mutations[i].mutation
          : [],
      };
      node_data_in_columnar_form.metadata_singles.forEach((x) => {
        new_node["meta_" + x.metadata_name] = x.mapping[x.node_values[i]];
      });
  
      // assert that y is a float
      if (typeof new_node.y !== "number") {
        new_node.y = parseFloat(new_node.y);
      }
  
      if (node_data_in_columnar_form.time_x) {
        new_node.time_x = node_data_in_columnar_form.time_x[i];
      }
  
      nodes_initial.push(new_node);
    }
    //sort on y
  
    return { nodes_initial, mutation_mapping };
  };
  
  export const processUnstackedData = async ({
    nodes_initial,
    mutation_mapping 
  }, sendStatusMessage) => {
    sendStatusMessage("Sorting nodes on y");
    const node_indices = nodes_initial.map((x, i) => i);
    const sorted_node_indices = node_indices.sort(
      (a, b) => nodes_initial[a].y - nodes_initial[b].y
    );
  
    const nodes = sorted_node_indices.map((x) => nodes_initial[x]);
    const node_to_mut = nodes.map((x) => x.mutations);
  
    nodes.forEach((node) => {
      node.mutations = node.mutations.map((x) => mutation_mapping[x]);
    });
  
    const old_to_new_mapping = Object.fromEntries(
      sorted_node_indices.map((x, i) => [x, i])
    );
  
    const scale_x = 35;
    const scale_y = 9e7 / nodes.length;
  
    sendStatusMessage("Rescaling for good fit");
  
    nodes.forEach((node, i) => {
      node.parent_id = old_to_new_mapping[node.parent_id];
      node.node_id = i;
  
      node.x = Math.fround(node.x * scale_x);
      node.y = Math.fround(node.y * scale_y);
      if (node.time_x) {
        node.time_x = Math.fround(node.time_x * scale_x);
      }
    });
  
    sendStatusMessage("Almost ready");
  
    const y_positions = nodes.map((node) => node.y);
  
    const overallMaxY = reduceMaxOrMin(nodes, (node) => node.y, "max");
    const overallMinY = reduceMaxOrMin(nodes, (node) => node.y, "min");
    const overallMaxX = reduceMaxOrMin(nodes, (node) => node.x, "max");
    const overallMinX = reduceMaxOrMin(nodes, (node) => node.x, "min");
    console.log(
      "overallMaxY is ",
      overallMaxY,
      "overallMinY is ",
      overallMinY,
      "overallMaxX is ",
      overallMaxX,
      "overallMinX is ",
      overallMinX
    );
  
    const output = {
      nodes,
      overallMaxX,
      overallMaxY,
      overallMinX,
      overallMinY,
      y_positions,
      mutations: mutation_mapping,
      node_to_mut,
    };
  
    console.log("output is ", output);
    return output;
  };
