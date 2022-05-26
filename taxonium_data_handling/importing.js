import zlib from "zlib";
import stream from "stream";
import buffer from "buffer";

const roundToDp = (number, dp) => {
  return Math.round(number * Math.pow(10, dp)) / Math.pow(10, dp);
};
let ReadableWebToNodeStream;
import("readable-web-to-node-stream").then(function (module) {
  ReadableWebToNodeStream = module.ReadableWebToNodeStream;
});
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

export const setUpStream = (the_stream, data, sendStatusMessage) => {
  function processLine(line, line_number) {
    if ((line_number % 100000 === 0 && line_number > 0) || line_number == 500) {
      console.log(`Processed ${formatNumber(line_number)} lines`);
      if (data.header.total_nodes) {
        const percentage = (line_number / data.header.total_nodes) * 100;
        sendStatusMessage({
          message: `Loaded ${formatNumber(line_number)} nodes`,
          percentage: percentage.toFixed(2),
        });
      } else {
        sendStatusMessage({
          message: `Loaded ${formatNumber(line_number)} nodes.`,
        });
      }
    }
    // console.log("LINE",line_number,line);
    const decoded = JSON.parse(line);
    if (line_number === 0) {
      data.header = decoded;
      data.nodes = [];
      data.node_to_mut = {};
    } else {
      data.node_to_mut[decoded.node_id] = decoded.mutations; // this is an int to ints map
      data.nodes.push(decoded);
    }
  }
  let cur_line = "";
  let line_counter = 0;
  the_stream.on("data", function (data) {
    cur_line += data.toString();
    if (cur_line.includes("\n")) {
      const lines = cur_line.split("\n");
      cur_line = lines.pop();
      lines.forEach((line) => {
        processLine(line, line_counter);
        line_counter++;
      });
    }
  });

  the_stream.on("error", function (err) {
    console.log(err);
  });

  the_stream.on("end", function () {
    console.log("end");
  });
};

export const processJsonl = async (jsonl, sendStatusMessage) => {
  console.log(
    "Worker processJsonl" //, jsonl
  );
  const data = jsonl.data;
  const status = jsonl.status;
  let the_stream;
  if (jsonl.filename.includes("gz")) {
    // Create a stream
    the_stream = zlib.createGunzip();
  } else {
    // create a fallback stream, and process the output, initially just logging it
    the_stream = new stream.PassThrough();
  }
  let new_data = {};
  setUpStream(the_stream, new_data, sendStatusMessage);

  if (status === "loaded") {
    const my_buf = new buffer.Buffer(data);
    the_stream.write(my_buf);
    the_stream.end();
  } else if (status === "url_supplied") {
    const url = jsonl.filename;
    let response;
    // Try fetch
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
    // numerically round to the nearest 0.1

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

export default { processJsonl };
