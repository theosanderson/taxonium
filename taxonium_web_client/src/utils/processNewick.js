import { kn_expand_node, kn_reorder, kn_reorder_num_tips, kn_parse, kn_calxy } from "./jstree";
import pako from "pako";
import axios from "axios";
import reduceMaxOrMin from "./reduceMaxOrMin";

async function do_fetch(url, sendStatusMessage) {
  // send progress on downloadProgress
  
  if (url.endsWith(".gz")) {
    const response = await axios.get(url, { responseType: "arraybuffer" , onDownloadProgress: (progress) => {
      sendStatusMessage({
        message: "Downloading compressed Newick file",
        percentage: progress.loaded / progress.total * 100,
      });
    }});
    sendStatusMessage({
      message: "Decompressing compressed Newick file",

    });
    const inflated = pako.ungzip(response.data);
    const text = new TextDecoder("utf-8").decode(inflated);
    return text;


  }
  else{
    const response = await axios.get(url, { onDownloadProgress: (progress) => {
      sendStatusMessage({
        message: "Downloading Newick file",
        percentage: progress.loaded / progress.total * 100,
      });
    }});
  const text = response.data;
  //parse text:
  return text;
  }}



async function cleanup(tree) {
  tree.node.forEach((node, i) => {
    node.node_id = i;
  });

  tree.node.forEach((node) => {
    node.parent_id = node.parent ? node.parent.node_id : node.node_id;
    delete node.parent;
    node.x_dist = node.x;
    delete node.x;
    node.mutations = [];
    node.num_tips = node.child.length + 1; // This isn't accurate but ensures leaves have 1 tip and others have more
    delete node.child;
  });

  const scale_x = 900;
  const scale_y = 2000;
  tree.node.forEach((node) => {
    node.x_dist = node.x_dist * scale_x;
    node.y = node.y * scale_y;
  });
}

export async function processNewick(data, sendStatusMessage) {
  let the_data;
 
  if (data.status === "url_supplied") {
    console.log("url_supplied");
    the_data = await do_fetch(data.filename, sendStatusMessage);
  }

  sendStatusMessage({
    message: "Parsing Newick file",
  })
  const tree = kn_parse(the_data);

  function assignNumTips(node) {
    if (node.child.length === 0) {
      node.num_tips = 1;
    }
    else {
      node.num_tips = 0;
      node.child.forEach((child) => {
        node.num_tips += assignNumTips(child);
      }
      );

  }
  
  return node.num_tips
  }

  function sortWithNumTips(node){
    node.child.sort((a, b) => {
      return a.num_tips - b.num_tips;
    });
    node.child.forEach((child) => {
      sortWithNumTips(child);
    }
    );
  }
  assignNumTips(tree.root);
  console.log("tree.root.num_tips", tree.root.num_tips);
 
  sortWithNumTips(tree.root);
  tree.node = kn_expand_node(tree.root);
    
  
  console.log("TREE", tree);

  sendStatusMessage({
    message: "Laying out the tree",
  })
  
  kn_calxy(tree, data.useDistances === true);

 
  sendStatusMessage({
    message: "Sorting on Y",
  })

  // sort on y:
  tree.node.sort((a, b) => a.y - b.y);

  sendStatusMessage({
    message: "Doing some rescaling",
  })

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
    overwrite_config: {},
  };

  sendStatusMessage({
    message: "Finalising for display",
  })

  return output;
}
