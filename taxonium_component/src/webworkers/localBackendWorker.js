import filtering from "taxonium_data_handling/filtering.js";
import { getNextstrainSubtreeJson } from "taxonium_data_handling/exporting.js";
import {
  processJsonl,
  generateConfig,
} from "taxonium_data_handling/importing.js";
import { processNewickAndMetadata } from "../utils/processNewick";
import { processNextstrain } from "../utils/processNextstrain.js";
import { ReadableWebToNodeStream } from "readable-web-to-node-stream";
import { parser } from "stream-json";
import { streamValues } from "stream-json/streamers/StreamValues";
import { Buffer } from "buffer";

postMessage({ data: "Worker starting" });

const the_cache = {};

const cache_helper = {
  retrieve_from_cache: (key) => the_cache[key],
  store_in_cache: (key, value) => {
    the_cache[key] = value;

    // Total size of the lists in the cache
    let total_size = 0;
    for (const key in the_cache) {
      total_size += the_cache[key].length;
    }

    // If the cache is too big, remove a random item
    if (total_size > 100e6) {
      const keys = Object.keys(the_cache);
      const random_key = keys[Math.floor(Math.random() * keys.length)];
      delete the_cache[random_key];
    }
  },
};

let processedUploadedData;

const sendStatusMessage = (status_obj) => {
  postMessage({
    type: "status",
    data: status_obj,
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
  await waitForProcessedData();

  const {
    nodes,
    overallMaxX,
    overallMaxY,
    overallMinX,
    overallMinY,
    y_positions,
  } = processedUploadedData;

  let min_y = isNaN(boundsForQueries.min_y)
    ? overallMinY
    : boundsForQueries.min_y;
  let max_y = isNaN(boundsForQueries.max_y)
    ? overallMaxY
    : boundsForQueries.max_y;

  let min_x = isNaN(boundsForQueries.min_x)
    ? overallMinX
    : boundsForQueries.min_x;
  let max_x = isNaN(boundsForQueries.max_x)
    ? overallMaxX
    : boundsForQueries.max_x;
  if (min_y < overallMinY) {
    min_y = overallMinY;
  }
  if (max_y > overallMaxY) {
    max_y = overallMaxY;
  }
  let result;

  result = {
    nodes: filtering.getNodes(
      nodes,
      y_positions,
      min_y,
      max_y,
      min_x,
      max_x,
      boundsForQueries.xType
    ),
  };


  return result;
};

const search = async (search, bounds) => {
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
    referenceSequence,
  } = processedUploadedData;
  const spec = JSON.parse(search);

  const min_y = bounds && bounds.min_y ? bounds.min_y : overallMinY;
  const max_y = bounds && bounds.max_y ? bounds.max_y : overallMaxY;
  const min_x = bounds && bounds.min_x ? bounds.min_x : overallMinX;
  const max_x = bounds && bounds.max_x ? bounds.max_x : overallMaxX;
  const xType = bounds && bounds.xType ? bounds.xType : "x_dist";

  const result = filtering.singleSearch({
    data: nodes,
    spec,
    min_y,
    max_y,
    min_x,
    max_x,
    y_positions,
    mutations,
    node_to_mut,
    xType: xType,
    cache_helper,
    referenceSequence,
  });

  result.key = spec.key;
  return result;
};

const getConfig = async () => {
  await waitForProcessedData();
  const config = {};
  generateConfig(config, processedUploadedData);

  config.mutations = processedUploadedData.mutations;


  const merged_config = {
    ...config,
    ...processedUploadedData.overwrite_config,
  };


  return merged_config;
};

const getDetails = async (node_id) => {
  await waitForProcessedData();
  const { nodes } = processedUploadedData;
  const node = nodes[node_id];
  const details = { ...node };
  details.mutations = processedUploadedData.node_to_mut[node_id]
    ? processedUploadedData.node_to_mut[node_id].map(
        (x) => processedUploadedData.mutations[x]
      )
    : [];
  return details;
};

const getList = async (node_id, att) => {
  await waitForProcessedData();
  const { nodes } = processedUploadedData;
  const atts = filtering.getTipAtts(nodes, node_id, att);
  return atts;
};

onmessage = async (event) => {
  //Process uploaded data:
  const { data } = event;
  if (
    data.type === "upload" &&
    data.data &&
    data.data.filename &&
    data.data.filename.includes("jsonl")
  ) {
    processedUploadedData = await processJsonl(
      data.data,
      sendStatusMessage,
      ReadableWebToNodeStream,
      parser,
      streamValues,
      Buffer
    );

  } else if (
    data.type === "upload" &&
    data.data &&
    data.data.filename &&
    (data.data.filetype === "nwk" || data.data.filetype === "nexus")
  ) {
    data.data.useDistances = true;
    processedUploadedData = await processNewickAndMetadata(
      data.data,
      sendStatusMessage
    );
  } else if (
    data.type === "upload" &&
    data.data &&
    data.data.filename &&
    data.data.filetype === "nextstrain"
  ) {
    processedUploadedData = await processNextstrain(
      data.data,
      sendStatusMessage
    );
  } else if (data.type === "upload" && data.data && data.data.filename) {
    sendStatusMessage({
      error:
        "Only Taxonium jsonl files are supported (could not find 'jsonl' in filename)",
    });
  } else {
    if (data.type === "query") {
      const result = await queryNodes(data.bounds);
      postMessage({ type: "query", data: result });
    }
    if (data.type === "search") {
      const result = await search(data.search, data.bounds);
      postMessage({ type: "search", data: result });
    }
    if (data.type === "config") {
      const result = await getConfig();
      postMessage({ type: "config", data: result });
    }
    if (data.type === "details") {
      const result = await getDetails(data.node_id);
      postMessage({ type: "details", data: result });
    }
    if (data.type === "list") {
      const result = await getList(data.node_id, data.key);
      postMessage({ type: "list", data: result });
    }
    if (data.type === "nextstrain") {
      const result = await getNextstrainSubtreeJson(
        data.node_id,
        processedUploadedData.nodes,
        data.config,
        processedUploadedData.mutations
      );
      postMessage({ type: "nextstrain", data: result });
    }
    if (data.type === "overall_spectrum") {
      await waitForProcessedData();
      const spectrum = filtering.computeOverallSpectrum(
        processedUploadedData.mutations,
        processedUploadedData.node_to_mut,
        processedUploadedData.referenceSequence
      );
      postMessage({ type: "overall_spectrum", data: { spectrum } });
    }
  }
};
