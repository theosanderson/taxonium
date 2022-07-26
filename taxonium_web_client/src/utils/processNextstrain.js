import pako from "pako";
import axios from "axios";
import reduceMaxOrMin from "./reduceMaxOrMin";
import { kn_expand_node, kn_calxy } from "./jstree";

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

// TODO: cleanup and processJsTree are duplicated in processNewick.js
async function cleanup(tree) {
  tree.node.forEach((node, i) => {
    node.node_id = i;
  });

  tree.node = tree.node.map((node, i) => {
    return {
      name: node.name.replace(/'/g, ""),
      parent_id: node.parent ? node.parent.node_id : node.node_id,
      x_dist: node.x,
      mutations: emptyList,
      y: node.y,
      num_tips: node.num_tips,
      is_tip: node.child.length === 0,
      node_id: node.node_id,
    };
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

async function processJsTree(tree, data, sendStatusMessage) {
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
  console.log("tree root", tree.root);
  assignNumTips(tree.root);
  const total_tips = tree.root.num_tips;
  console.log("tree.root.num_tips", tree.root.num_tips);

  if (data.ladderize) {
    console.log("ladderizing");

    sortWithNumTips(tree.root);
    tree.node = kn_expand_node(tree.root);
  }

  sendStatusMessage({
    message: "Laying out the tree",
  });

  // TODO: should second argument (is_real) always
  // be true
  kn_calxy(tree, true);

  sendStatusMessage({
    message: "Sorting on Y",
  });

  // sort on y:
  tree.node.sort((a, b) => a.y - b.y);

  sendStatusMessage({
    message: "Re-processing",
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
  return output;
}

function json_preorder(root) {
  let parents = {};
  parents[root.name] = null;
  let path = [];
  let stack = [root];
  while (stack.length > 0) {
    const nodeJson = stack.pop();
    let dist;

    // For now, set branch length to # of nt mutations
    if (
      nodeJson.branch_attrs.mutations &&
      nodeJson.branch_attrs.mutations.nuc
    ) {
      dist = nodeJson.branch_attrs.mutations.nuc.length;
    } else {
      dist = 0;
    }

    // this is the node format for downstream processing
    let parsedNode = {
      name: nodeJson.name,
      child: [],
      meta: "",
      d: dist,
      hl: false,
      hidden: false,
    };
    path.push(parsedNode);
    if (nodeJson.children !== undefined) {
      for (let childJson of nodeJson.children) {
        parents[childJson.name] = parsedNode;
        stack.push(childJson);
      }
    }
  }
  return [path, parents];
}

async function json_to_tree(json) {
  const rootJson = json.tree;
  const [preorder, parents] = json_preorder(rootJson);

  let n_tips = 0;
  let nodes = [];
  let root;
  for (let node of preorder) {
    const parent = parents[node.name];
    node.parent = parent;
    if (parent) {
      parent.child.push(node);
    } else {
      root = node;
    }
    nodes.push(node);
  }

  return {
    // tree in jstree.js format
    node: nodes,
    error: 0,
    n_tips: n_tips,
    root: root,
  };
}

export async function processNextstrain(data, sendStatusMessage) {
  console.log("got data", data);
  let the_data;

  the_data = await fetch_or_extract(data, sendStatusMessage, "tree");

  sendStatusMessage({
    message: "Parsing NS file",
  });

  const jsTree = await json_to_tree(JSON.parse(the_data));
  const output = await processJsTree(jsTree, data, sendStatusMessage);
  console.log(output);
  return output;
}
