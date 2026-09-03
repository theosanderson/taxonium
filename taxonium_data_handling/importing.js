import zlib from "zlib";
import stream from "stream";

class ChunkCounterStream extends stream.PassThrough {
  constructor(sendStatusMessage, options = {}) {
    super(options);
    this.sendStatusMessage = sendStatusMessage;
    this.chunkCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.chunkCount++;
    if (this.chunkCount % 100 === 0) {
      this.sendStatusMessage({
        message: `Processed ${this.chunkCount} groups of mutations`,
        count: this.chunkCount,
      });
    }

    // Pass the chunk through unchanged
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    this.sendStatusMessage({
      message: `Finished processing. Total chunks: ${this.chunkCount}`,
      count: this.chunkCount,
      finished: true,
    });
    callback();
  }
}

class StreamSplitter extends stream.Transform {
  constructor(headerParser, dataParser, options = {}) {
    super(options);
    this.headerParser = headerParser;
    this.dataParser = dataParser;
    this.firstPart = true;
    this.buffer = null; // Buffer to hold partial data
  }

  _transform(chunk, encoding, callback) {
    let data = chunk;
    let newlineIndex = data.indexOf(10); // ASCII code for '\n'

    if (this.firstPart) {
      if (newlineIndex !== -1) {
        // Found newline, split the data
        const headerData = data.slice(0, newlineIndex);
        const restData = data.slice(newlineIndex + 1);

        // Write header data to headerParser
        this.headerParser.write(headerData);
        this.headerParser.end();

        // Write restData to dataParser
        if (restData.length > 0) {
          this.dataParser.write(restData);
        }

        this.firstPart = false;
      } else {
        // No newline found, store data in buffer
        this.headerParser.write(data);
      }
    } else {
      // After header is processed, pass data to dataParser
      this.dataParser.write(data);
    }

    callback();
  }

  _flush(callback) {
    if (this.firstPart && this.buffer) {
      // No newline found in the entire stream, treat entire data as header
      this.headerParser.write(this.buffer);
      this.headerParser.end();
      this.firstPart = false;
    }
    this.dataParser.end();
    callback();
  }
}

const roundToDp = (number, dp) => {
  return Math.round(number * Math.pow(10, dp)) / Math.pow(10, dp);
};

export const formatNumber = (num) => {
  return num !== null && typeof num === "number" ? num.toLocaleString() : "";
};

export const modules = { zlib, stream };

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

// A handful of very divergent sequences (e.g. ones with many spurious
// mutations) can make the x extent of a tree several times wider than the
// part of it that anyone wants to look at. The initial view is therefore
// fitted to a "robust" x range: the X_ROBUST_QUANTILE quantile of node x
// positions, with some headroom, capped at the true maximum. For a tree
// without such outliers this is just the true maximum.
const X_ROBUST_QUANTILE = 0.99;
const X_ROBUST_HEADROOM = 1.3;
// If the robust range would be narrower than this fraction of the full range
// there is no bulk worth zooming in on (e.g. nearly every node sits at the
// same x), so the full range is used instead.
const X_ROBUST_MIN_FRACTION = 0.15;
const QUANTILE_BINS = 4096;

// Histogram-based quantile so that we never have to sort (or copy) a list of
// x positions that can have tens of millions of entries. The value returned is
// the top of the bin the quantile falls in, so it is a slight over-estimate.
const approximateQuantile = (nodes, accessor, min, max, quantile) => {
  if (!(max > min)) {
    return max;
  }
  const counts = new Int32Array(QUANTILE_BINS);
  const scale = QUANTILE_BINS / (max - min);
  let total = 0;
  for (const node of nodes) {
    const value = node[accessor];
    if (typeof value !== "number" || !isFinite(value)) {
      continue;
    }
    let bin = Math.floor((value - min) * scale);
    if (bin < 0) {
      bin = 0;
    } else if (bin >= QUANTILE_BINS) {
      bin = QUANTILE_BINS - 1;
    }
    counts[bin]++;
    total++;
  }
  if (total === 0) {
    return max;
  }
  const target = quantile * total;
  let cumulative = 0;
  for (let bin = 0; bin < QUANTILE_BINS; bin++) {
    cumulative += counts[bin];
    if (cumulative >= target) {
      return min + ((bin + 1) / QUANTILE_BINS) * (max - min);
    }
  }
  return max;
};

// Which x accessors the nodes actually carry.
export const getXAccessors = (nodes) => {
  const firstNode = nodes && nodes.length ? nodes[0] : null;
  const accessors = [];
  if (firstNode && firstNode.x_dist !== undefined) {
    accessors.push("x_dist");
  }
  if (firstNode && firstNode.x_time !== undefined) {
    accessors.push("x_time");
  }
  // A tree with neither is treated as a time tree, which is what the client
  // falls back to when there are no distances.
  return accessors.length ? accessors : ["x_time"];
};

// { min, max, robust_max } for one x accessor, or null if the nodes don't
// have usable values for it.
export const getXRange = (nodes, accessor) => {
  if (!nodes || !nodes.length) {
    return null;
  }
  let min = Infinity;
  let max = -Infinity;
  let count = 0;
  for (const node of nodes) {
    const value = node[accessor];
    if (typeof value !== "number" || !isFinite(value)) {
      continue;
    }
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
    count++;
  }
  if (count === 0) {
    return null;
  }
  const quantile = approximateQuantile(
    nodes,
    accessor,
    min,
    max,
    X_ROBUST_QUANTILE
  );
  let robustMax = min + (quantile - min) * X_ROBUST_HEADROOM;
  if (robustMax < min + (max - min) * X_ROBUST_MIN_FRACTION) {
    robustMax = max;
  }
  if (robustMax > max) {
    robustMax = max;
  }
  return { min, max, robust_max: robustMax };
};

export const getXRanges = (nodes, accessors) => {
  const ranges = {};
  for (const accessor of accessors ? accessors : getXAccessors(nodes)) {
    const range = getXRange(nodes, accessor);
    if (range) {
      ranges[accessor] = range;
    }
  }
  return ranges;
};

// Everything the client needs in order to pick a sensible starting view.
// initial_x / initial_y stay for backwards compatibility with clients that
// only know about a centre point; x_ranges and y_range let a newer client
// also work out how far to zoom out.
export const getInitialViewConfig = (nodes, { minY, maxY }) => {
  const x_accessors = getXAccessors(nodes);
  const x_ranges = getXRanges(nodes, x_accessors);
  const primaryRange = x_ranges[x_accessors[0]];
  const initialView = {
    x_accessors,
    x_ranges,
    y_range: { min: minY, max: maxY },
    initial_y: (minY + maxY) / 2,
  };
  if (primaryRange) {
    initialView.initial_x = (primaryRange.min + primaryRange.robust_max) / 2;
  }
  return initialView;
};

export const setUpStream = (
  the_stream,
  data,
  sendStatusMessage,
  parser,
  streamValues
) => {
  // Header parser
  const headerParser = parser({ jsonStreaming: true });
  const headerPipeline = headerParser.pipe(streamValues());
  headerPipeline.on("data", (chunk) => {
    data.header = chunk.value;
    data.nodes = [];
    data.node_to_mut = {};
  });
  headerPipeline.on("error", (err) => {
    console.error("Header parser error:", err);
  });

  // Data parser for the rest of the stream
  let lineBuffer = "";
  let line_number = 0;
  const dataParser = new stream.Writable({
    write(chunk, encoding, callback) {
      const chunkStr = chunk.toString();
      let start = 0;
      let end = chunkStr.indexOf("\n");

      while (end !== -1) {
        lineBuffer += chunkStr.slice(start, end);
        processLine(lineBuffer, line_number);
        line_number++;
        lineBuffer = "";
        start = end + 1;
        end = chunkStr.indexOf("\n", start);
      }

      lineBuffer += chunkStr.slice(start);
      callback();
    },
    final(callback) {
      if (lineBuffer) {
        processLine(lineBuffer, line_number);
      }
      callback();
    },
  });

  function processLine(line, line_number) {
    if (line.trim() === "") return;

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
    const decoded = JSON.parse(line);
    data.node_to_mut[decoded.node_id] = decoded.mutations;
    data.nodes.push(decoded);
  }
  const chunkCounterStream = new ChunkCounterStream(sendStatusMessage);
  chunkCounterStream.pipe(headerParser);
  const splitter = new StreamSplitter(chunkCounterStream, dataParser);

  // Pipe the input stream through the splitter
  the_stream
    .pipe(splitter)
    .on("error", (err) => console.error("Splitter error:", err));

  // Handle the completion of the dataParser
  dataParser.on("finish", () => {
    console.log("Finished processing the stream");
  });
};

export const processJsonl = async (
  jsonl,
  sendStatusMessage,
  ReadableWebToNodeStream,
  parser,
  streamValues,
  Buffer
) => {
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
  setUpStream(the_stream, new_data, sendStatusMessage, parser, streamValues);

  if (status === "loaded") {
    const dataAsArrayBuffer = data;
    // In a Convert the arrayBuffer to a buffer in a series of chunks
    let chunkSize = 5 * 1024 * 1024;
    for (let i = 0; i < dataAsArrayBuffer.byteLength; i += chunkSize) {
      const chunk = dataAsArrayBuffer.slice(i, i + chunkSize);
      const chunkAsBuffer = Buffer.from(chunk);
      // Pipe the chunkStream to the stream
      the_stream.write(chunkAsBuffer);
    }
    console.log("Worker processJsonl", data);
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

export const generateConfig = (config, processedUploadedData) => {
  config.num_nodes = processedUploadedData.nodes.length;
  Object.assign(
    config,
    getInitialViewConfig(processedUploadedData.nodes, {
      minY: processedUploadedData.overallMinY,
      maxY: processedUploadedData.overallMaxY,
    })
  );
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

  config.x_accessors = getXAccessors(processedUploadedData.nodes);

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
    // if "text" is found in the type
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

  //check if 'meta_pangolin_lineage' is in options

  config.defaultColorByField = colorByOptions.includes("meta_pangolin_lineage")
    ? "meta_pangolin_lineage"
    : colorByOptions[0];
};

export default {
  processJsonl,
  generateConfig,
  getXAccessors,
  getXRange,
  getXRanges,
  getInitialViewConfig,
};
