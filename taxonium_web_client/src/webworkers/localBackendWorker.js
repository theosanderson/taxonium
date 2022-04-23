import filtering from "taxonium_data_handling";
import {processUnstackedData, decodeAndConvertToObjectFromBuffer, unstackUploadedData, modules} from "taxonium_data_handling/importing.js";
import protobuf from "protobufjs";

const {stream, zlib, buffer} = modules

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
    "time_x"
  ];

  config.x_accessors = processedUploadedData.nodes[0].time_x
    ? ["x", "time_x"]
    : ["x"];

  config.keys_to_display = Object.keys(processedUploadedData.nodes[0]).filter(
    (x) => !to_remove.includes(x)
  );

  /*config.search_types = [
    { name: "name", label: "Name", type: "text_match" },
    { name: "meta_Lineage", label: "PANGO lineage", type: "text_exact" },
    { name: "meta_Country", label: "Country", type: "text_match" },
    { name: "mutation", label: "Mutation", type: "mutation" },
    { name: "revertant", label: "Revertant", type: "revertant" },
    { name: "genbank", label: "Genbank", type: "text_per_line" },
  ];*/
  const prettyName = (x) => {
    // if x starts with meta_
    if (x.startsWith("meta_")) {
      const bit = x.substring(5);
      const capitalised_first_letter= bit.charAt(0).toUpperCase() + bit.slice(1);
      return capitalised_first_letter;
    }
    if (x === "mutation") {
      return "Mutation";
    }
    const capitalised_first_letter= x.charAt(0).toUpperCase() + x.slice(1);
    return capitalised_first_letter
  }

  const typeFromKey = (x) => {
    if (x === "mutation") {
      return "mutation";
    }
    if ( x=== "genbank") {
      return "text_per_line";
    }
    if (x=== "revertant") {
      return "revertant";
    }
    if(x === "meta_Lineage") {
      return "text_exact";
    }
    return "text_match";
  }
  config.search_types = ["name", ...config.keys_to_display, "mutation", "revertant"].map((x) => ({
    name: x,
    label: prettyName(x),
    type: typeFromKey(x),
  }));



  const colorByOptions =  [...config.keys_to_display, "genotype"]

  const prettyColorByOptions = Object.fromEntries( colorByOptions.map( (x) => [x, prettyName(x)] ) )
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

const setUpStream = (the_stream, data) =>
{
  function processLine(line, line_number) {
    console.log("LINE",line_number,line);
    const decoded = JSON.parse(line);
    if (line_number===0){
      data.header = decoded;
      data.nodes = [];
      data.node_to_mut = {};
    }
    else{
      data.node_to_mut[decoded.node_id] = decoded.mutations; // this is an int to ints map
      decoded.mutations = decoded.mutations.map( (x) =>  data.header.aa_mutations[x]  )
      data.nodes.push(decoded);
    }


  }
  let cur_line = "";
  let line_counter = 0;
  the_stream.on('data', function(data) {
    cur_line += data.toString();
    if (cur_line.includes("\n")) {
      const lines = cur_line.split("\n");
      cur_line = lines.pop();
      lines.forEach((line) => {
        processLine(line, line_counter);
        line_counter++;
        

      });
    }
    
    
  }
  );
  
  the_stream.on('error', function(err) {
    console.log(err);
  }
  );

  the_stream.on('end', function() {
    console.log("end");
  }
  );
  
}

const processJsonl = async (jsonl) => {
  console.log("Worker processJsonl", jsonl);
  const data = jsonl.data
  const type = jsonl.type
  let the_stream
  if (type.includes("gz")){
    // Create a stream
     the_stream = zlib.createGunzip();
  }
  else{
    // create a fallback stream, and process the output, initially just logging it
     the_stream = new stream.PassThrough();

  }
  let new_data = {}
  setUpStream(the_stream, new_data)
  
  const my_buf = new buffer.Buffer(data);
  the_stream.write(my_buf);
  the_stream.end();
  console.log("done with gunzip");
  // Wait for the stream to finish
  await new Promise((resolve, reject) => {
    the_stream.on('end', resolve);
    the_stream.on('error', reject);
  }
  );
  console.log("done with stream");
  console.log("new_data is ", new_data);
  const scale_x = 10;
  const scale_y = 10e2 / new_data.nodes.length;
  new_data.nodes.forEach((node) => {
    node.x_dist = node.x_dist * scale_x;
    node.x = node.x_dist
    node.y = node.y * scale_y;
  });
  const y_positions = new_data.nodes.map((node) => node.y);
  
  const overallMaxY = reduceMaxOrMin(new_data.nodes, (node) => node.y, "max");
  const overallMinY = reduceMaxOrMin(new_data.nodes, (node) => node.y, "min");
  const overallMaxX = reduceMaxOrMin(new_data.nodes, (node) => node.x, "max");
  const overallMinX = reduceMaxOrMin(new_data.nodes, (node) => node.x, "min");
  
  const output = {
    nodes : new_data.nodes,
    overallMaxX,
    overallMaxY,
    overallMinX,
    overallMinY,
    y_positions,
    mutations: new_data.header.aa_mutations,
    node_to_mut: new_data.node_to_mut,
  };

  return output

}

onmessage = async (event) => {
  //Process uploaded data:
  console.log("Worker onmessage");
  const { data } = event;
  if (data.type === "upload" && data.data.type.includes("jsonl")) {
    processedUploadedData = await processJsonl(data.data);
    console.log("processedUploadedData is ", processedUploadedData);
  }
  else if (data.type === "upload") {
    console.log("Worker upload");
    let data2 = await decodeAndConvertToObjectFromBuffer(data.data, getProto,sendStatusMessage);
    data.data = undefined;
    data2 = await unstackUploadedData(data2, sendStatusMessage);
    processedUploadedData = await processUnstackedData(data2, sendStatusMessage); 
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
