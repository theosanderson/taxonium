import zlib from "zlib";
import stream from "stream";
import buffer from "buffer";
let ReadableWebToNodeStream;
import("readable-web-to-node-stream").then(function (module) {
  ReadableWebToNodeStream = module.ReadableWebToNodeStream;
});
export const formatNumber = (num) => {
  return num !== null
    ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
    : "";
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
    // log every 1000
    if (line_number % 10000 === 0 && line_number > 0) {
      console.log(`Processed ${formatNumber(line_number)} lines`);
      if (data.header.total_nodes) {
        const percentage = (line_number / data.header.total_nodes) * 100;
        sendStatusMessage({
          message: `Loaded ${formatNumber(line_number)} nodes`,
          percentage: percentage.toFixed(0),
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
      decoded.mutations = decoded.mutations.map(
        (x) => data.header.aa_mutations[x]
      );
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
  console.log("Worker processJsonl", jsonl);
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

  const scale_x = 7;
  const scale_y = 24e2 / new_data.nodes.length;
  console.log("Scaling");
  for (const node of new_data.nodes) {
    node.x_dist = node.x_dist * scale_x;
    node.x = node.x_dist;
    node.y = node.y * scale_y;
  }
  console.log("Calculating y positions");
  const y_positions = new_data.nodes.map((node) => node.y);

  console.log("Calculating coord extremes");

  const overallMaxY = reduceMaxOrMin(new_data.nodes, (node) => node.y, "max");
  const overallMinY = reduceMaxOrMin(new_data.nodes, (node) => node.y, "min");
  const overallMaxX = reduceMaxOrMin(new_data.nodes, (node) => node.x, "max");
  const overallMinX = reduceMaxOrMin(new_data.nodes, (node) => node.x, "min");

  console.log("Creating output obj");
  const output = {
    nodes: new_data.nodes,
    overallMaxX,
    overallMaxY,
    overallMinX,
    overallMinY,
    y_positions,
    mutations: new_data.header.aa_mutations,
    node_to_mut: new_data.node_to_mut,
  };

  return output;
};

export default { processJsonl };
