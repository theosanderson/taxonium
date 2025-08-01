import {
  kn_expand_node,
  // kn_reorder,
  //kn_reorder_num_tips,
  kn_parse,
  kn_calxy,
} from "./jstree";
import pako from "pako";
import axios from "axios";
import reduceMaxOrMin from "./reduceMaxOrMin";
import nexusToNewick from "../utils/nexusToNewick";
import type { StatusMessage } from "../types/backend";
import type {
  NewickFile,
  MetadataFile,
  ProcessedTree,
  InputFile,
} from "../types/newick";
const emptyList: any[] = [];

async function do_fetch(
  url: string,
  sendStatusMessage: (msg: StatusMessage) => void = () => {},
  whatIsBeingDownloaded: string
): Promise<string> {
  // send progress on downloadProgress

  if (url.endsWith(".gz")) {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      onDownloadProgress: (progress) => {
        sendStatusMessage({
          message: "Downloading compressed " + whatIsBeingDownloaded,
          percentage: (progress.loaded / (progress.total ?? progress.loaded)) * 100,
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
          percentage: (progress.loaded / (progress.total ?? progress.loaded)) * 100,
        });
      },
    });
    const text = response.data;
    //parse text:
    return text;
  }
}

async function fetch_or_extract(
  file_obj: InputFile,
  sendStatusMessage: (msg: StatusMessage) => void,
  whatIsBeingDownloaded: string
): Promise<string> {
  if (file_obj.status === "url_supplied") {
    return do_fetch(file_obj.filename, sendStatusMessage, whatIsBeingDownloaded);
  } else if (file_obj.status === "loaded") {
    if (file_obj.filename.includes(".gz")) {
      const compressed_data = file_obj.data as ArrayBuffer;
      sendStatusMessage({
        message: "Decompressing compressed " + whatIsBeingDownloaded,
      });
      const inflated = pako.ungzip(new Uint8Array(compressed_data));
      const text = new TextDecoder("utf-8").decode(inflated);
      return text;
    } else {
      // convert array buffer to string
      let text: string;
      // if type is not string, assume it is arraybuffer
      if (typeof file_obj.data === "string") {
        text = file_obj.data;
      } else {
        text = new TextDecoder("utf-8").decode(file_obj.data as ArrayBuffer);
      }
      return text;
    }
  }
  return "";
}

function parseNewickKeyValue(
  newickKVString: string,
  obj_to_set: Record<string, unknown>
): void {
  // Regular expression that matches key=value pairs, accounting for commas within {}
  const regex = /(&?\w+)=({[^}]*}|[^,]*)/g;

  let match;

  // Use the RegExp.exec() method to find all matches in the string
  while ((match = regex.exec(newickKVString)) !== null) {
    // Remove the '&' character if it's present at the start of the key
    const key = match[1].startsWith("&") ? match[1].slice(1) : match[1];
    // Push the key-value pair to the result array
    obj_to_set["meta_" + key] = match[2];
  }
}

function cleanup(tree: any): void {
  tree.node.forEach((node: any, i: number) => {
    node.node_id = i;
  });

  tree.node = tree.node.map((node: any) => {
    const to_return = {
      name: node.name.replace(/'/g, ""),
      parent_id: node.parent ? node.parent.node_id : node.node_id,
      x_dist: node.x,
      mutations: emptyList,
      y: node.y,
      num_tips: node.num_tips,
      is_tip: node.child.length === 0,
      node_id: node.node_id,
    };
    // if node.meta is not empty, parse it.
    // We need to parse things of the form "&name=blabla,mutations={T694A:1.0,C29870A:1.0},Ns={1-3,4-17,18-20,21-26,686-693,22029-22033,28248-28253,28271-28271}"
    if (node.meta) {
      parseNewickKeyValue(node.meta, to_return);
    }
    return to_return;
  });

  const scale_y = 2000;

  const all_xes = tree.node.map((node: any) => node.x_dist);
  all_xes.sort((a: number, b: number) => a - b);
  const ref_x_percentile = 0.99;
  const ref_x = all_xes[Math.floor(all_xes.length * ref_x_percentile)];

  const scale_x = 450 / ref_x;

  tree.node.forEach((node: any) => {
    node.x_dist = node.x_dist * scale_x;
    node.y = node.y * scale_y;
  });
}

export async function processNewick(
  data: NewickFile,
  sendStatusMessage: (msg: StatusMessage) => void
): Promise<ProcessedTree> {
  let the_data: string;

  the_data = await fetch_or_extract(data, sendStatusMessage, "tree");

  if (data.filetype == "nexus") {
    const result = nexusToNewick(the_data);
    the_data = result.newick;
  }

  sendStatusMessage({
    message: "Parsing Newick file",
  });

  // if starts with a "[", then trim to after the first "]"
  if (the_data[0] === "[") {
    the_data = the_data.slice(the_data.indexOf("]") + 1);
  }

  // remove newlines from the string

  the_data = the_data.replaceAll("\n", "");
  the_data = the_data.replaceAll("\r", "");

  const tree: any = kn_parse(the_data);

  function assignNumTips(node: any): number {
    if (node.child.length === 0) {
      node.num_tips = 1;
    } else {
      node.num_tips = 0;
      node.child.forEach((child: any) => {
        node.num_tips += assignNumTips(child);
      });
    }

    return node.num_tips;
  }

  function sortWithNumTips(node: any): void {
    node.child.sort((a: any, b: any) => {
      return a.num_tips - b.num_tips;
    });
    node.child.forEach((child: any) => {
      sortWithNumTips(child);
    });
  }
  assignNumTips(tree.root);
  const total_tips = tree.root.num_tips;

  if (data.ladderize) {
    sortWithNumTips(tree.root);
    tree.node = kn_expand_node(tree.root);
  }

  sendStatusMessage({
    message: "Laying out the tree",
  });

  kn_calxy(tree, data.useDistances === true);

  sendStatusMessage({
    message: "Sorting on Y",
  });

  // sort on y:
  tree.node.sort((a: any, b: any) => a.y - b.y);

  sendStatusMessage({
    message: "Re-processing",
  });

  cleanup(tree);

  const overallMaxX = reduceMaxOrMin(tree.node, (x: any) => x.x_dist, "max");
  const overallMinX = reduceMaxOrMin(tree.node, (x: any) => x.x_dist, "min");
  const overallMaxY = reduceMaxOrMin(tree.node, (x: any) => x.y, "max");
  const overallMinY = reduceMaxOrMin(tree.node, (x: any) => x.y, "min");
  const y_positions = tree.node.map((x: any) => x.y);

  const output: ProcessedTree = {
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
    overwrite_config: { num_tips: total_tips, from_newick: true },
  };

  return output;
}

export async function processMetadataFile(
  data: MetadataFile,
  sendStatusMessage: (msg: StatusMessage) => void
): Promise<[Map<string, Record<string, string>>, string[]]> {
  const logStatusToConsole = (message: StatusMessage) => {
  };
  let the_data: string;

  the_data = await fetch_or_extract(data, logStatusToConsole, "metadata");

  const lines = the_data.split("\n");
  const output = new Map<string, Record<string, string>>();
  let splitFunction: (line: string) => string[];

  if (data.filetype == "meta_tsv") {
    splitFunction = (x) => x.split("\t");
  } else if (data.filetype == "meta_csv") {
    // remove any double quotes
    splitFunction = (x) => x.split(",").map((x) => x.replace(/"/g, ""));
  } else {
    sendStatusMessage({
      error: "Filetype was not set, please raise an issue on our GitHub page",
    });
    throw new Error(
      "Filetype was not set, please raise an issue on our GitHub page"
    );
  }

  let headers: string[] = [];

  lines.forEach((line, i) => {
    if (i % 10000 === 0) {
      sendStatusMessage({
        message: "Parsing metadata file",
        percentage: (i / lines.length) * 100,
      });

    }
    if (i === 0) {
      headers = splitFunction(line);
    } else {
      const values = splitFunction(line);

      let name;
      if (data.taxonColumn) {
        const taxon_column_index = headers.indexOf(data.taxonColumn);
        name = values[taxon_column_index];
      } else {
        name = values[0];
      }
      const as_obj: Record<string, string> = {};
      values.slice(1).forEach((value, j) => {
        as_obj["meta_" + headers[j + 1]] = value;
      });

      output.set(name, as_obj);
    }
  });
  sendStatusMessage({
    message: "Finalising",
  });

  return [output, headers];
}

export async function processNewickAndMetadata(
  data: NewickFile,
  sendStatusMessage: (msg: StatusMessage) => void
): Promise<ProcessedTree> {
  const treePromise = processNewick(data, sendStatusMessage);
  let tree: ProcessedTree;
  let metadata_double: [Map<string, Record<string, string>>, string[]];
  let metadata = new Map<string, Record<string, string>>();
  let headers: string[] = [];
  const metadataInput = data.metadata;
  if (!metadataInput) {
    tree = await treePromise;
  } else {
    // Wait for both promises to resolve
    [tree, metadata_double] = await Promise.all([
      treePromise,
      processMetadataFile(metadataInput, sendStatusMessage),
    ]);
    [metadata, headers] = metadata_double;
  }

  const blanks: Record<string, string> = Object.fromEntries(
    headers.slice(1).map((x) => ["meta_" + x, ""])
  );

  const all_keys = new Set<string>();
  tree.nodes.forEach((node: any) => {
    // get all the keys that start with "meta_"
    const meta_keys = Object.keys(node).filter((x) => x.startsWith("meta_"));
    // add them to the set
    meta_keys.forEach((key) => {
      all_keys.add(key);
    });
  });
  // update the blanks object to include all the keys
  all_keys.forEach((key: string) => {
    if (!blanks[key]) {
      blanks[key] = "";
    }
  });

  const blanksList: [string, string][] = Object.entries(blanks);

  sendStatusMessage({
    message: "Assigning metadata to nodes",
  });
  tree.nodes.forEach((node: any) => {
    const this_metadata = metadata.get(node.name);
    // add blanks for any properties not currently set
    blanksList.forEach(([key, value]) => {
      if (!node[key]) {
        node[key] = value;
      }
    });

    if (this_metadata) {
      Object.assign(node, this_metadata);
    }
  });

  return tree;
}
