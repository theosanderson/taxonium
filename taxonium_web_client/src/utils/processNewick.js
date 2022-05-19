import {
  kn_expand_node,
  kn_reorder,
  kn_reorder_num_tips,
  kn_parse,
  kn_calxy,
} from "./jstree";
import pako from "pako";
import axios from "axios";
import reduceMaxOrMin from "./reduceMaxOrMin";
const emptyList = [];

async function do_fetch(url, sendStatusMessage, whatIsBeingDownloaded) {
  if (!sendStatusMessage) {
    sendStatusMessage = () => {};
  }
  // send progress on downloadProgress

  if (url.endsWith(".gz")) {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      onDownloadProgress: (progress) => {
        sendStatusMessage({
          message: "Downloading compressed " + whatIsBeingDownloaded,
          percentage: (progress.loaded / progress.total) * 100,
        });
      },
    });
    sendStatusMessage({
      message: "Decompressing compressed " + whatIsBeingDownloaded,
    });
    const inflated = pako.ungzip(response.data);
    const text = new TextDecoder("utf-8").decode(inflated);
    return text;
  } else {
    const response = await axios.get(url, {
      onDownloadProgress: (progress) => {
        sendStatusMessage({
          message: "Downloading " + whatIsBeingDownloaded,
          percentage: (progress.loaded / progress.total) * 100,
        });
      },
    });
    const text = response.data;
    //parse text:
    return text;
  }
}

function fetch_or_extract(file_obj, sendStatusMessage, whatIsBeingDownloaded) {
  if (file_obj.status === "url_supplied") {
    return do_fetch(
      file_obj.filename,
      sendStatusMessage,
      whatIsBeingDownloaded
    );
  } else if (file_obj.status === "loaded") {
    if (file_obj.filename.includes(".gz")) {
      const compressed_data = file_obj.data;
      sendStatusMessage({
        message: "Decompressing compressed " + whatIsBeingDownloaded,
      });
      const inflated = pako.ungzip(compressed_data);
      const text = new TextDecoder("utf-8").decode(inflated);
      return text;
    } else {
      // convert array buffer to string
      const text = new TextDecoder("utf-8").decode(file_obj.data);
      return text;
    }
  }
}

async function cleanup(tree) {
  tree.node.forEach((node, i) => {
    node.node_id = i;
  });

  tree.node = tree.node.map((node) => {

    return{
      name: node.name.replace(/\'/g, ""),
      parent_id : node.parent ? node.parent.node_id : node.node_id,
      x_dist :node.x,
      mutations : emptyList

    }
    
  });

  const scale_y = 2000;

  const all_xes = tree.node.map((node) => node.x_dist);
  all_xes.sort((a, b) => a - b);
  const ref_x_percentile = 0.99;
  const ref_x = all_xes[Math.floor(all_xes.length * ref_x_percentile)];

  const scale_x = 450 / ref_x;

  console.log(scale_y, "scale_y");
  tree.node.forEach((node) => {
    node.x_dist = node.x_dist * scale_x;
    node.y = node.y * scale_y;
  });
}

export async function processNewick(data, sendStatusMessage) {
  console.log("got data", data);
  let the_data;

  the_data = await fetch_or_extract(data, sendStatusMessage, "tree");

  sendStatusMessage({
    message: "Parsing Newick file",
  });
  const tree = kn_parse(the_data);

  function assignNumTips(node) {
    if (node.child.length === 0) {
      node.num_tips = 1;
    } else {
      node.num_tips = 0;
      node.child.forEach((child) => {
        node.num_tips += assignNumTips(child);
      });
    }

    return node.num_tips;
  }

  function sortWithNumTips(node) {
    node.child.sort((a, b) => {
      return a.num_tips - b.num_tips;
    });
    node.child.forEach((child) => {
      sortWithNumTips(child);
    });
  }
  assignNumTips(tree.root);
  const total_tips = tree.root.num_tips;
  console.log("tree.root.num_tips", tree.root.num_tips);

  if (data.ladderize) {
    console.log("ladderizing");

    sortWithNumTips(tree.root);
    tree.node = kn_expand_node(tree.root);
  }

  console.log("TREE", tree);

  sendStatusMessage({
    message: "Laying out the tree",
  });

  kn_calxy(tree, data.useDistances === true);

  sendStatusMessage({
    message: "Sorting on Y",
  });

  // sort on y:
  tree.node.sort((a, b) => a.y - b.y);

  sendStatusMessage({
    message: "Cleaning up objects",
  });

  cleanup(tree);

  const overallMaxX = reduceMaxOrMin(tree.node, (x) => x.x_dist, "max");
  const overallMinX = reduceMaxOrMin(tree.node, (x) => x.x_dist, "min");
  const overallMaxY = reduceMaxOrMin(tree.node, (x) => x.y, "max");
  const overallMinY = reduceMaxOrMin(tree.node, (x) => x.y, "min");
  const y_positions = tree.node.map((x) => x.y);

  const output = {
    nodes: tree.node,
    overallMaxX,
    overallMaxY,
    overallMinX,
    overallMinY,
    y_positions,
    mutations: [],
    node_to_mut: {},
    rootMutations: [],
    rootId: 0,
    overwrite_config: { num_tips: total_tips },
  };

  sendStatusMessage({
    message: "Finalising for display",
  });

  return output;
}

export async function processMetadataFile(data, sendStatusMessage) {
  const logStatusToConsole = (message) => {
    console.log(message.message);
  };
  let the_data;

  the_data = await fetch_or_extract(data, logStatusToConsole, "metadata");

  console.log("Got metadata file");

  const lines = the_data.split("\n");
  const output = {};
  let separator;
  if (data.filename.includes("tsv")) {
    separator = "\t";
  } else if (data.filename.includes("csv")) {
    separator = ",";
  } else {
    sendStatusMessage({
      error: "Unknown file type for metadata, should be csv or tsv",
    });
    throw new Error("Unknown file type");
  }

  let headers;

  lines.forEach((line, i) => {
    if (i % 10000 === 0) {
      sendStatusMessage({
        message: "Parsing metadata file",
        percentage: (i / lines.length) * 100,
      });
    }
    if (i === 0) {
      headers = line.split(separator);
    } else {
      const values = line.split(separator);
      const name = values[0];
      const as_obj = {};
      values.slice(1).forEach((value, j) => {
        as_obj["meta_" + headers[j + 1]] = value;
      });
      output[name] = as_obj;
    }
  });
  sendStatusMessage({
    message: "Finalising",
  });

  return [output, headers];
}

export async function processNewickAndMetadata(data, sendStatusMessage) {
  const treePromise = processNewick(data, sendStatusMessage);

  //fake promise
  /*const treePromise = new Promise((resolve, reject) => {
    resolve({
      nodes: [],
    });
  }
  );*/
  const metadataInput = data.metadata;
  if (!metadataInput) {
    return await treePromise;
  }
  // Wait for both promises to resolve
  const [tree, metadata_double] = await Promise.all([
    treePromise,
    processMetadataFile(metadataInput, sendStatusMessage),
  ]);
  const [metadata, headers] = metadata_double;
  const blanks = Object.fromEntries(
    headers.slice(1).map((x) => ["meta_" + x, ""])
  );
  tree.nodes.forEach((node) => {
    const this_metadata = metadata[node.name];
    if (this_metadata) {
      Object.assign(node, this_metadata);
    } else {
      Object.assign(node, blanks);
    }
    
  });
  return tree;
}
