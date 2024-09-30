import zlib from "zlib";
import stream from "stream";
import buffer from "buffer";

const roundToDp = (number, dp) => {
  return Math.round(number * Math.pow(10, dp)) / Math.pow(10, dp);
};

export const formatNumber = (num) => {
  return num !== null && typeof num === "number" ? num.toLocaleString() : "";
};

export const modules = { zlib, stream, buffer };

function reduceMaxOrMin(array, accessFunction, maxOrMin) {
  if (maxOrMin === "max") {
    return accessFunction(
      array.reduce(function (max, item) {
        return accessFunction(item) > accessFunction(max) ? item : max;
      })
    );
  } else if (maxOrMin === "min") {
    return accessFunction(
      array.reduce(function (min, item) {
        return accessFunction(item) < accessFunction(min) ? item : min;
      })
    );
  }
}

export const setUpStream = (
  the_stream,
  data,
  sendStatusMessage,
  jsonlParser
) => {
  const pipeline = the_stream.pipe(jsonlParser());

  let line_number = 0;

  pipeline.on("data", (decoded) => {
    if ((line_number % 10000 === 0 && line_number > 0) || line_number == 500) {
      console.log(`Processed ${formatNumber(line_number)} lines`);
      if (data.header.total_nodes) {
        const percentage = (line_number / data.header.total_nodes) * 100;
        sendStatusMessage({
          message: `Loaded ${formatNumber(line_number)} nodes`,
          percentage: percentage.toFixed(2),
          total: line_number == 500 ? data.header.total_nodes : undefined,
        });
      } else {
        sendStatusMessage({
          message: `Loaded ${formatNumber(line_number)} nodes.`,
        });
      }
    }

    if (line_number === 0) {
      data.header = decoded.value;
      data.nodes = [];
      data.node_to_mut = {};
    } else {
      data.node_to_mut[decoded.value.node_id] = decoded.value.mutations;
      data.nodes.push(decoded.value);
    }

    line_number++;
  });

  pipeline.on("error", function (err) {
    console.log(err);
  });

  pipeline.on("end", function () {
    console.log("end");
  });
};

export const processJsonl = async (
  jsonl,
  sendStatusMessage,
  ReadableWebToNodeStream,
  jsonlParser
) => {
  console.log("Worker processJsonl");
  const data = jsonl.data;
  const status = jsonl.status;
  let the_stream;
  if (jsonl.filename.includes("gz")) {
    the_stream = zlib.createGunzip();
  } else {
    the_stream = new stream.PassThrough();
  }
  let new_data = {};
  setUpStream(the_stream, new_data, sendStatusMessage, jsonlParser);

  if (status === "loaded") {
    const dataAsArrayBuffer = data;
    let chunkSize = 5 * 1024 * 1024;
    for (let i = 0; i < dataAsArrayBuffer.byteLength; i += chunkSize) {
      const chunk = dataAsArrayBuffer.slice(i, i + chunkSize);
      const chunkAsBuffer = buffer.Buffer.from(chunk);
      the_stream.write(chunkAsBuffer);
    }
    console.log("Worker processJsonl", data);
    the_stream.end();
  } else if (status === "url_supplied") {
    const url = jsonl.filename;
    let response;
    console.log("STARTING FETCH");
    try {
      response = await fetch(url);
    } catch (error) {
      console.log("Fetch error", error);
      sendStatusMessage({ error: `Fetch error: ${error}` });
      return;
    }
    console.log("ALL FINE", response);
    sendStatusMessage({ message: "Loading root genome" });

    const readableWebStream = response.body;
    const nodeStream = new ReadableWebToNodeStream(readableWebStream);
    nodeStream.pipe(the_stream);
  } else if (status === "stream_supplied") {
    const nodeStream = jsonl.stream;
    nodeStream.pipe(the_stream);
  } else {
    throw new Error("Unknown status: " + status);
  }

  // Wait for the stream to finish
  await new Promise((resolve, reject) => {
    the_stream.on("end", resolve);
    the_stream.on("error", reject);
  });
  console.log("done with stream");

  const scale_y =
    24e2 /
    (new_data.nodes.length > 10e3
      ? new_data.nodes.length
      : new_data.nodes.length * 0.6666);
  console.log("Scaling");
  for (const node of new_data.nodes) {
    node.y = roundToDp(node.y * scale_y, 6);
  }
  console.log("Calculating y positions");
  const y_positions = new_data.nodes.map((node) => node.y);

  console.log("Calculating coord extremes");

  const overallMaxY = reduceMaxOrMin(new_data.nodes, (node) => node.y, "max");
  const overallMinY = reduceMaxOrMin(new_data.nodes, (node) => node.y, "min");
  const overallMaxX = reduceMaxOrMin(
    new_data.nodes,
    (node) => node.x_dist,
    "max"
  );
  const overallMinX = reduceMaxOrMin(
    new_data.nodes,
    (node) => node.x_dist,
    "min"
  );

  const root = new_data.nodes.find((node) => node.parent_id === node.node_id);
  const rootMutations = root.mutations;
  root.mutations = [];

  console.log("Creating output obj");

  const overwrite_config = new_data.header.config ? new_data.header.config : {};
  overwrite_config.num_tips = root.num_tips;

  const output = {
    nodes: new_data.nodes,
    overallMaxX,
    overallMaxY,
    overallMinX,
    overallMinY,
    y_positions,
    mutations: new_data.header.mutations
      ? new_data.header.mutations
      : new_data.header.aa_mutations,
    node_to_mut: new_data.node_to_mut,
    rootMutations: rootMutations,
    rootId: root.node_id,
    overwrite_config,
  };

  return output;
};

export const generateConfig = (config, processedUploadedData) => {
  config.num_nodes = processedUploadedData.nodes.length;
  config.initial_x =
    (processedUploadedData.overallMaxX + processedUploadedData.overallMinX) / 2;
  config.initial_y =
    (processedUploadedData.overallMaxY + processedUploadedData.overallMinY) / 2;
  config.initial_zoom = config.initial_zoom ? config.initial_zoom : -2;
  config.genes = [
    ...new Set(processedUploadedData.mutations.map((x) => (x ? x.gene : null))),
  ]
    .filter((x) => x)
    .sort();

  config.rootMutations = processedUploadedData.rootMutations;
  config.rootId = processedUploadedData.rootId;

  config.name_accessor = "name";
  const to_remove = [
    "parent_id",
    "node_id",
    "x",
    "x_dist",
    "x_time",
    "y",
    "mutations",
    "name",
    "num_tips",
    "time_x",
    "clades",
    "is_tip",
  ];

  const firstNode = processedUploadedData.nodes[0];

  config.x_accessors =
    firstNode.x_dist !== undefined && firstNode.x_time !== undefined
      ? ["x_dist", "x_time"]
      : firstNode.x_dist
      ? ["x_dist"]
      : ["x_time"];

  config.keys_to_display = Object.keys(processedUploadedData.nodes[0]).filter(
    (x) => !to_remove.includes(x)
  );

  const prettyName = (x) => {
    if (x.startsWith("meta_")) {
      const bit = x.substring(5);
      const capitalised_first_letter =
        bit.charAt(0).toUpperCase() + bit.slice(1);
      return capitalised_first_letter;
    }
    if (x === "mutation") {
      return "Mutation";
    }

    const capitalised_first_letter = x.charAt(0).toUpperCase() + x.slice(1);
    return capitalised_first_letter;
  };

  const typeFromKey = (x) => {
    if (x === "mutation") {
      return "mutation";
    }
    if (x === "genotype") {
      return "genotype";
    }
    if (x === "num_tips") {
      return "number";
    }
    if (x === "genbank") {
      return "text_per_line";
    }
    if (x === "revertant") {
      return "revertant";
    }
    if (x === "meta_Lineage") {
      return "text_exact";
    }
    if (x === "boolean") return "boolean";

    return "text_match";
  };
  const initial_search_types = ["name", ...config.keys_to_display];

  if (processedUploadedData.mutations.length > 0) {
    initial_search_types.push("mutation");
    initial_search_types.push("genotype");
  }

  if (processedUploadedData.rootMutations.length > 0) {
    initial_search_types.push("revertant");
  }

  initial_search_types.push("num_tips");

  if (initial_search_types.length > 1) {
    initial_search_types.push("boolean");
  }

  config.search_types = initial_search_types.map((x) => ({
    name: x,
    label: prettyName(x),
    type: typeFromKey(x),
  }));

  config.search_types.forEach((x) => {
    if (x.type.includes("text")) {
      x.controls = true;
    }
  });

  const colorByOptions = [...config.keys_to_display];
  if (processedUploadedData.mutations.length > 0) {
    colorByOptions.push("genotype");
  }
  colorByOptions.push("None");

  if (colorByOptions.length < 2) {
    config.colorMapping = { None: [50, 50, 150] };
  }

  config.colorBy = { colorByOptions };

  config.defaultColorByField = colorByOptions.includes("meta_pangolin_lineage")
    ? "meta_pangolin_lineage"
    : colorByOptions[0];
};

export default { processJsonl, generateConfig };
