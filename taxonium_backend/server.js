var express = require("express");
var cors = require("cors");
var compression = require("compression");
var queue = require("express-queue");
var app = express();
var fs = require("fs");
const path = require("node:path");
const os = require("node:os");
var https = require("https");
var xml2js = require("xml2js");
var axios = require("axios");
var pako = require("pako");
const URL = require("url").URL;
const ReadableWebToNodeStream = require("readable-web-to-node-stream");
const { execSync } = require("child_process");
var importing;
var filtering;
var exporting;

const { program } = require("commander");

program
  .option("--ssl", "use ssl")
  .option("--port <port>", "port", 8000)
  .option("--config_json <config_json>", "config json")
  .option("--data_url <data url>", "data url")
  .option(
    "--data_file <data file>",
    "local data file, as alternative to data url",
  );

program.parse();

const command_options = program.opts();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "taxonium"));

const in_cache = new Set();

const cache_helper = {
  retrieve_from_cache: (key) => {
    console.log("retrieving ", key);
    if (!in_cache.has(key)) {
      console.log("not found");
      return undefined;
    } else {
      // get from tmpDir, parsing the JSON
      console.log("found");
      const retrieved = JSON.parse(fs.readFileSync(path.join(tmpDir, key)));

      return retrieved;
    }
  },
  store_in_cache: (key, value) => {
    console.log("caching ", key);
    // store in tmpDir, serializing the JSON
    fs.writeFileSync(path.join(tmpDir, key), JSON.stringify(value));
    in_cache.add(key);
  },
};

// Either data_url or data_file must be defined, if not display error
if (
  command_options.data_url === undefined &&
  command_options.data_file === undefined
) {
  console.log("--data_url or --data_file must be supplied");
  process.exit(1);
}

import("taxonium_data_handling/importing.js").then((imported) => {
  importing = imported.default;
  console.log("imported importing");
  console.log("importing is ", importing);
});

import("taxonium_data_handling/filtering.js").then((imported) => {
  filtering = imported.default;
  console.log("imported filtering");
});

import("taxonium_data_handling/exporting.js").then((imported) => {
  exporting = imported.default;
  console.log("imported exporting");
});

waitForTheImports = async () => {
  if (importing === undefined || filtering === undefined) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (importing !== undefined && filtering !== undefined) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
};

var processedData = null;
var cached_starting_values = null;

let options;

app.use(cors());
app.use(compression());

app.use(queue({ activeLimit: 500000, queuedLimit: 500000 }));

const logStatusMessage = (status_obj) => {
  console.log("status", status_obj);
  if (process && process.send) {
    process.send(status_obj);
  }
};

app.get("/", function (req, res) {
  res.send("Hello World, Taxonium is here!");
});

app.get("/search", function (req, res) {
  const start_time = Date.now();
  console.log("/search");
  const json = req.query.json;
  const spec = JSON.parse(JSON.parse(json));
  console.log(spec);

  const minYbound =
    req.query.min_y !== undefined ? req.query.min_y : processedData.overallMinY;
  const maxYbound =
    req.query.max_y !== undefined ? req.query.max_y : processedData.overallMaxY;
  const minXbound =
    req.query.min_x !== undefined ? req.query.min_x : processedData.overallMinX;
  const maxXbound =
    req.query.max_x !== undefined ? req.query.max_x : processedData.overallMaxX;

  const forSingleSearch = {
    data: processedData.nodes,
    spec,
    min_y: minYbound,
    max_y: maxYbound,
    min_x: minXbound,
    max_x: maxXbound,
    y_positions: processedData.y_positions,
    mutations: processedData.mutations,
    node_to_mut: processedData.node_to_mut,
    xType: req.query.xType,
    cache_helper: cache_helper,
  };

  const result = filtering.singleSearch(forSingleSearch);
  validateSIDandSend(result, req.query.sid, res);
  console.log(
    "Found " +
      result.data.length +
      " results in " +
      (Date.now() - start_time) +
      "ms",
  );
  console.log("Result type was " + result.type);
});

let path_for_config = command_options.config_json;
let config;

// Check if config passed in a valid URL
const stringIsAValidUrl = (s) => {
  try {
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};

if (stringIsAValidUrl(path_for_config)) {
  console.log("CONFIG_JSON detected as a URL. Downloading config.");
  // Delete any trailing /
  path_for_config = path_for_config.endsWith("/")
    ? path_for_config.slice(0, -1)
    : path_for_config;

  // Download file through wget
  execSync(`wget -c ${path_for_config}`);

  // Extract file name
  const splitURL = path_for_config.split("/");
  const fileName = splitURL[splitURL.length - 1];

  path_for_config = fileName;

  console.log("Config name set to", path_for_config);
}

// check if path exists
if (path_for_config && fs.existsSync(path_for_config)) {
  config = JSON.parse(fs.readFileSync(path_for_config));
} else {
  config = { title: "", source: "", no_file: true };
}

app.get("/config", function (req, res) {
  config.num_nodes = processedData.nodes.length;
  config.initial_x =
    (processedData.overallMinX + processedData.overallMaxX) / 2;
  config.initial_y =
    (processedData.overallMinY + processedData.overallMaxY) / 2;
  config.initial_zoom = -2;
  config.genes = processedData.genes;
  config.mutations = processedData.mutations;
  config = { ...config, ...processedData.overwrite_config };
  config.rootMutations = processedData.rootMutations;
  config.rootId = processedData.rootId;

  validateSIDandSend(config, req.query.sid, res);
});

app.get("/nodes/", function (req, res) {
  const start_time = Date.now();
  let min_y =
    req.query.min_y !== undefined ? req.query.min_y : processedData.overallMinY;
  let max_y =
    req.query.max_y !== undefined ? req.query.max_y : processedData.overallMaxY;
  let min_x =
    req.query.min_x !== undefined ? req.query.min_x : processedData.overallMinX;
  let max_x =
    req.query.max_x !== undefined ? req.query.max_x : processedData.overallMaxX;
  if (min_y < processedData.overallMinY) {
    min_y = processedData.overallMinY;
  }
  if (max_y > processedData.overallMaxY) {
    max_y = processedData.overallMaxY;
  }
  if (min_x < processedData.overallMinX) {
    min_x = processedData.overallMinX;
  }
  if (max_x > processedData.overallMaxX) {
    max_x = processedData.overallMaxX;
  }
  let result;

  if (
    min_y === processedData.overallMinY &&
    max_y === processedData.overallMaxY &&
    min_x === processedData.overallMinX &&
    max_x === processedData.overallMaxX &&
    req.query.xType === "x_dist"
  ) {
    result = cached_starting_values;

    console.log("Using cached values");
  } else {
    result = filtering.getNodes(
      processedData.nodes,
      processedData.y_positions,
      min_y,
      max_y,
      min_x,
      max_x,
      req.query.xType,
    );
  }
  console.log("Ready to send after " + (Date.now() - start_time) + "ms.");

  // This will be sent as json
  validateSIDandSend({ nodes: result }, req.query.sid, res);
  console.log(
    "Request took " +
      (Date.now() - start_time) +
      "ms, and output " +
      result.length +
      " nodes.",
  );
});

function startListening() {
  if (command_options.ssl) {
    options = {
      key: fs.readFileSync(
        "/etc/letsencrypt/live/api.taxonium.org/privkey.pem",
      ),
      ca: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/chain.pem"),
      cert: fs.readFileSync(
        "/etc/letsencrypt/live/api.taxonium.org/fullchain.pem",
      ),
    };
    https.createServer(options, app).listen(command_options.port, "0.0.0.0");
    console.log("SSL on port " + command_options.port);
  } else {
    app.listen(command_options.port, "0.0.0.0");
    console.log("Non SSL on port " + command_options.port);
  }
}

let sid_cache = {};

async function validateSID(sid) {
  /*

  Create a call to https://gpsapi.epicov.org/epi3/gps_api

  with URL encoded version of the following parameters:

  {"cmd":"state/session/validate",
"client_id": "TEST-1234",
"api": {"version":1},
"sid":"RFWFYY...PQZNQQASXUR"}

packaged as req
*/
  const caching_time = 1000 * 60 * 5; // 5 minutes
  if (
    sid_cache[sid] !== undefined &&
    sid_cache[sid].time > Date.now() - caching_time &&
    sid_cache[sid].validity === "ok"
  ) {
    console.log("Using cached validity");
    return "ok";
  }

  const key = process.env.GPS_API_KEY;

  const req_obj = {
    cmd: "state/session/validate",
    client_id: key,
    api: { version: 1 },
    sid: sid,
  };
  const req_raw = JSON.stringify(req_obj);
  const req = encodeURIComponent(req_raw);
  const url = "https://gpsapi.epicov.org/epi3/gps_api?req=" + req;
  console.log(url);
  response = await axios.get(url);
  console.log("got response", response.data);
  validity =
    response.data && response.data.rc && response.data.rc === "ok"
      ? "ok"
      : "invalid";
  console.log("validity", validity);
  sid_cache[sid] = { validity: validity, time: Date.now() };
  return validity;
}

async function validateSIDandSend(to_send, sid, res) {
  if (!config.validate_SID) {
    res.send(to_send);
    return;
  }
  const validity = await validateSID(sid);

  if (validity === "ok") {
    res.send(to_send);
  } else {
    res.send({ error: "Invalid session ID" });
  }
}

app.get("/validate/", async function (req, res) {
  const start_time = new Date();
  const query_sid = req.query.sid;
  const validity = await validateSID(query_sid);
  console.log("Got validity", validity);

  res.send(validity);
  console.log(new Date() - start_time);
});

// "Takes EPI_ISL_12345" input
function get_epi_isl_url(epi_isl) {
  if (epi_isl.length > 4) {
    return (
      "https://www.epicov.org/acknowledgement/" +
      epi_isl.slice(-4, -2) +
      "/" +
      epi_isl.slice(-2) +
      "/" +
      epi_isl +
      ".json"
    );
  }
}

async function getGenBankAuthors(genbank_accession) {
  const genbank_xml_url =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=" +
    genbank_accession +
    "&rettype=gb&retmode=xml";
  const genbank_xml = await axios.get(genbank_xml_url);
  const genbank_xml_json = await xml2js.parseStringPromise(genbank_xml.data);

  let authors =
    genbank_xml_json["GBSet"]["GBSeq"][0]["GBSeq_references"][0][
      "GBReference"
    ][0]["GBReference_authors"][0]["GBAuthor"];
  authors = authors.map((x) => {
    const [last, first] = x.split(",");
    return first + " " + last;
  });
  return authors;

  //['GBSeq_xrefs'][0]['GBXref'])
}

app.get("/node_details/", async (req, res) => {
  const start_time = Date.now();
  const query_id = req.query.id;
  const node = processedData.nodes[query_id];
  const node_mutations = processedData.node_to_mut[query_id].map((mutation) => {
    return processedData.mutations[mutation];
  });

  const detailed_node = { ...node, mutations: node_mutations };
  // If node name starts with EPI_ISL_, then get the URL

  if (
    config.enable_genbank_acknowledgement &&
    detailed_node.meta_genbank_accession
  ) {
    const genbank_accession = detailed_node.meta_genbank_accession;
    let authors;
    try {
      authors = await getGenBankAuthors(genbank_accession);
    } catch (e) {
      console.log("Error getting authors", e);
    }
    if (authors) {
      detailed_node.acknowledgements = { authors: authors.join(", ") };
    }
  }

  if (detailed_node.name.startsWith("EPI_ISL_")) {
    const acknowledgements_url = get_epi_isl_url(detailed_node.name);
    // get the data from the URL
    const response = await axios.get(acknowledgements_url).catch((e) => {
      console.log(e);
    });
    try {
      const data = response.data;
      detailed_node.acknowledgements = data;
    } catch (e) {
      detailed_node.acknowledgements = {
        covv_orig_lab:
          "The GISAID acknowledgements server did not return a valid response",
        covv_orig_lab:
          "The GISAID acknowledgements server did not return a valid response",
        covv_authors:
          "The GISAID acknowledgements server did not return a valid response",
        covv_subm_lab:
          "The GISAID acknowledgements server did not return a valid response",
      };
      console.log(e);
    }
  }
  validateSIDandSend(detailed_node, req.query.sid, res);
  console.log(
    "Request took " + (Date.now() - start_time) + "ms, and output " + node,
  );
});

app.get("/tip_atts", async (req, res) => {
  const start_time = Date.now();
  const node_id = req.query.id;
  const att = req.query.att;
  const atts = filtering.getTipAtts(processedData.nodes, node_id, att);
  validateSIDandSend(atts, req.query.sid, res);
  console.log(
    "Request took " + (Date.now() - start_time) + "ms, and output " + atts,
  );
});

// match /nextstrain_json/12345
app.get("/nextstrain_json/:root_id", async (req, res) => {
  const root_id = parseInt(req.params.root_id);
  const json = await exporting.getNextstrainSubtreeJson(
    root_id,
    processedData.nodes,
    config,
    processedData.mutations,
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; " + "filename=" + root_id + ".nextstrain.json",
  );
  res.send(json);
});

const loadData = async () => {
  await waitForTheImports();
  let supplied_object;
  if (command_options.data_file) {
    local_file = command_options.data_file;
    //  create a stream from the file
    const stream = fs.createReadStream(local_file);

    supplied_object = {
      stream: stream,
      status: "stream_supplied",
      filename: local_file,
    };
  } else {
    url = command_options.data_url;

    supplied_object = { status: "url_supplied", filename: url };
  }

  processedData = await importing.processJsonl(
    supplied_object,
    logStatusMessage,
    ReadableWebToNodeStream.ReadableWebToNodeStream,
  );

  logStatusMessage({
    status: "finalising",
  });

  if (config.no_file) {
    importing.generateConfig(config, processedData);
  }

  processedData.genes = new Set(
    processedData.mutations.map((mutation) => mutation.gene),
  );
  // as array
  processedData.genes = Array.from(processedData.genes);
  console.log("Loaded data");

  result = filtering.getNodes(
    processedData.nodes,
    processedData.y_positions,
    processedData.overallMinY,
    processedData.overallMaxY,
    processedData.overallMinX,
    processedData.overallMaxX,
    "x_dist",
  );

  cached_starting_values = result;
  console.log("Saved cached starting vals");
  // set a timeout to start listening

  setTimeout(() => {
    console.log("Starting to listen");
    startListening();
    logStatusMessage({
      status: "loaded",
    });
  }, 10);
};
loadData();
