import reduceMaxOrMin from "../utils/reduceMaxOrMin";
import filtering from "taxonium_data_handling";
import protobuf from "protobufjs";
import pako from "pako";

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

const decodeAndConvertToObjectFromBuffer = async (uploaded_data) => {
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

export const unstackUploadedData = async (result) => {
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
  mutation_mapping,
}) => {
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
    // eslint-disable-next-line no-unused-vars
    overallMaxX,
    overallMaxY,
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
    overallMaxX,
    overallMaxY,
    // eslint-disable-next-line no-unused-vars
    overallMinX,
    overallMinY,
    y_positions,
    node_to_mut,
    mutations,
  } = processedUploadedData;
  const spec = JSON.parse(search);
  console.log(spec);

  const min_y = bounds && bounds.min_y ? bounds.min_y : overallMinY;
  const max_y = bounds && bounds.max_y ? bounds.max_y : overallMaxY;

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
  result.key = spec.key;
  return result;
};

const getConfig = async () => {
  console.log("Worker getConfig");
  await waitForProcessedData();
  const config = {};
  config.num_nodes = processedUploadedData.nodes.length;
  config.initial_x =
    (processedUploadedData.overallMaxX + processedUploadedData.overallMinX) / 2;
  config.initial_y =
    (processedUploadedData.overallMaxY + processedUploadedData.overallMinY) / 2;
  config.initial_zoom = -3;
  config.genes = [
    ...new Set(processedUploadedData.mutations.map((x) => (x ? x.gene : null))),
  ]
    .filter((x) => x)
    .sort();

  config.name_accessor = "name";
  const to_remove = [
    "parent_id",
    "node_id",
    "x",
    "y",
    "mutations",
    "name",
    "num_tips",
  ];

  config.x_accessors = processedUploadedData.nodes[0].time_x
    ? ["x", "time_x"]
    : ["x"];

  config.keys_to_display = Object.keys(processedUploadedData.nodes[0]).filter(
    (x) => !to_remove.includes(x)
  );

  config.search_types = [
    { name: "name", label: "Name", type: "text_match" },
    { name: "meta_Lineage", label: "PANGO lineage", type: "text_exact" },
    { name: "meta_Country", label: "Country", type: "text_match" },
    { name: "mutation", label: "Mutation", type: "mutation" },
    { name: "revertant", label: "Revertant", type: "revertant" },
  ];

  const colorByOptions = ["meta_Lineage", "meta_Country", "genotype", "None"];
  const prettyColorByOptions = {
    meta_Lineage: "Lineage",
    meta_Country: "Country",
    genotype: "Genotype",
    None: "None",
  };
  config.colorBy = { colorByOptions, prettyColorByOptions };

  console.log("config is ", config);

  return config;
};

const getDetails = async (node_id) => {
  console.log("Worker getDetails");
  await waitForProcessedData();
  const { nodes } = processedUploadedData;
  const node = nodes[node_id];
  console.log("node is ", node);
  return node;
};

onmessage = async (event) => {
  //Process uploaded data:
  console.log("Worker onmessage");
  const { data } = event;
  if (data.type === "upload") {
    console.log("Worker upload");
    let data2 = await decodeAndConvertToObjectFromBuffer(data.data);
    data.data = undefined;
    data2 = await unstackUploadedData(data2);
    await processUnstackedData(data2);
  } else {
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
    if (data.type === "config") {
      console.log("Worker config");
      const result = await getConfig();
      postMessage({ type: "config", data: result });
    }
    if (data.type === "details") {
      console.log("Worker details");
      const result = await getDetails(data.node_id);
      postMessage({ type: "details", data: result });
    }
  }
};
