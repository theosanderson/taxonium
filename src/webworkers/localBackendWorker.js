import reduceMaxOrMin from "../utils/reduceMaxOrMin";
import filtering from "taxonium_data_handling";
import protobuf from "protobufjs";

protobuf.parse.defaults.keepCase = true;
let proto;

const proto_location = "/taxonium.proto";

const getProto = async () => {
  if (proto === undefined) {
    proto = await protobuf.load(proto_location);
  }
  return proto;
};

console.log("worker starting");
postMessage({ data: "Worker starting" });

let processedUploadedData;

const sendStatusMessage = (message) => {
  postMessage({
    type: "status",
    data: message,
  });
};

const decodeAndConvertToObjectFromBuffer = (uploaded_data, proto) => {
  sendStatusMessage("Extracting data from protobuf");
  const NodeList = proto.lookupType("AllData");
  const message = NodeList.decode(new Uint8Array(uploaded_data.data)); // TODO refactor this to function so it gets deleted after use

  sendStatusMessage("Converting data to initial javascript object");
  const result = NodeList.toObject(message);
  return result;
};

export const processUploadedData = async (uploaded_data) => {
  if (!uploaded_data) {
    return {};
  }
  const proto = await getProto();

  const result = decodeAndConvertToObjectFromBuffer(uploaded_data, proto);
  uploaded_data = undefined;

  const node_data_in_columnar_form = result.node_data;

  const country_stuff = node_data_in_columnar_form.metadata_singles.find(
    (x) => x.metadata_name === "Country"
  );
  const lineage_stuff = node_data_in_columnar_form.metadata_singles.find(
    (x) => x.metadata_name === "Lineage"
  );
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

  sendStatusMessage("Extracting individual nodes from columnar format");

  for (let i in node_data_in_columnar_form.names) {
    const new_node = {
      name: node_data_in_columnar_form.names[i],
      x: node_data_in_columnar_form.x[i],
      y: node_data_in_columnar_form.y[i],
      num_tips: node_data_in_columnar_form.num_tips[i],
      parent_id: node_data_in_columnar_form.parents[i],
      date: result.date_mapping[node_data_in_columnar_form.dates[i]],
      meta_Country: country_stuff.mapping[country_stuff.node_values[i]],
      meta_Lineage: lineage_stuff.mapping[lineage_stuff.node_values[i]],
      mutations: node_data_in_columnar_form.mutations[i].mutation
        ? node_data_in_columnar_form.mutations[i].mutation
        : [],
    };
    nodes_initial.push(new_node);
  }
  //sort on y

  sendStatusMessage("Sorting nodes on y");
  const node_indices = nodes_initial.map((x, i) => i);
  const sorted_node_indices = node_indices.sort(
    (a, b) => nodes_initial[a].y - nodes_initial[b].y
  );

  const nodes = sorted_node_indices.map((x) => nodes_initial[x]);
  const node_to_mut = nodes.map((x) => x.mutations);

  nodes.forEach((node) => {
    node.mutations = node.mutations.map((x) => result.mutation_mapping[x]);
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

    node.x = node.x * scale_x;
    node.y = node.y * scale_y;
  });

  sendStatusMessage("Adding parental coordinates");

  nodes.forEach((node, i) => {
    node.parent_x = nodes[node.parent_id].x;
    node.parent_y = nodes[node.parent_id].y;
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
    mutations: result.mutation_mapping,
    node_to_mut,
  };

  console.log("output is ", output);
  processedUploadedData = output;
};

const waitForProcessedData = async () => {
  // check if processedUploadedData is defined, if not wait until it is
  if (processedUploadedData === undefined) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (processedUploadedData !== undefined) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
};

export const queryNodes = async (boundsForQueries) => {
  console.log("Worker query Nodes");
  await waitForProcessedData();

  const {
    nodes,
    overallMaxX,
    overallMaxY,
    overallMinX,
    overallMinY,
    y_positions,
  } = processedUploadedData;

  const min_x = boundsForQueries.min_x;
  const max_x = boundsForQueries.max_x;
  let min_y = isNaN(boundsForQueries.min_y)
    ? overallMinY
    : boundsForQueries.min_y;
  let max_y = isNaN(boundsForQueries.max_y)
    ? overallMaxY
    : boundsForQueries.max_y;
  if (min_y < overallMinY) {
    min_y = overallMinY;
  }
  if (max_y > overallMaxY) {
    max_y = overallMaxY;
  }
  let result;
  console.log("filtering");

  if (false && min_y === overallMinY && max_y === overallMaxY) {
    //disabled
    //result = cached_starting_values;

    console.log("Using cached values");
  } else {
    result = {
      nodes: filtering.getNodes(nodes, y_positions, min_y, max_y, min_x, max_x),
    };
  }
  console.log("result is done");

  return result;
};

const search = async (search, bounds) => {
  console.log("Worker query Search");
  await waitForProcessedData();

  const {
    nodes,
    overallMaxX,
    overallMaxY,
    overallMinX,
    overallMinY,
    y_positions,
    node_to_mut,
    mutations,
  } = processedUploadedData;
  const spec = JSON.parse(search);
  console.log(spec);

  const min_y = bounds.min_y ? bounds.min_y : overallMinY;
  const max_y = bounds.max_y ? bounds.max_y : overallMaxY;

  const result = filtering.singleSearch({
    data: nodes,
    spec,
    min_y,
    max_y,
    y_positions,
    mutations,
    node_to_mut,
  });
  console.log("mutations var is ", mutations);
  console.log("got search result", result);
  return result;
};

onmessage = async (event) => {
  //Process uploaded data:
  console.log("Worker onmessage");
  const { data } = event;
  if (data.type === "upload") {
    console.log("Worker upload");
    processUploadedData(data.data);
  }
  if (data.type === "query") {
    console.log("Worker query");
    const result = await queryNodes(data.bounds);
    postMessage({ type: "query", data: result });
  }
  if (data.type === "search") {
    console.log("Worker search");
    const result = await search(data.search, data.bounds);
    postMessage({ type: "search", data: result });
  }
};
