var express = require("express");
var cors = require("cors");
var compression = require("compression");
var app = express();
var fs = require("fs");
var https = require("https");
var axios = require("axios");
var pako = require("pako");
var importing = import("taxonium_data_handling/importing.js");
var filtering = import("taxonium_data_handling/filtering.js");

let options;
const { program } = require("commander");

program
  .option("--ssl", "use ssl")
  .option("--database_dir <database_dir>", "database directory")
  .option("--port <port>", "port")
  .option("--config_json <config_json>", "config json");

program.parse();

const command_options = program.opts();

app.use(cors());
app.use(compression());

app.get("/", function (req, res) {
  res.send("Hello World, Taxonium is here!");
});

app.get("/search", function (req, res) {
  const start_time = Date.now();
  console.log("/search");
  const json = req.query.json;
  const spec = JSON.parse(JSON.parse(json));
  console.log(spec);
  req.query.min_y =
    req.query.min_y !== undefined ? req.query.min_y : overallMinY();
  req.query.max_y =
    req.query.max_y !== undefined ? req.query.max_y : overallMaxY();

  const result = filtering.singleSearch({
    data,
    spec,
    min_y: req.query.min_y,
    max_y: req.query.max_y,
    y_positions,
    mutations,
    node_to_mut,
  });
  validateSIDandSend(result, req.query.sid, res);
  console.log(
    "Found " +
      result.data.length +
      " results in " +
      (Date.now() - start_time) +
      "ms"
  );
  console.log("Result type was " + result.type);
});

const path_for_config = command_options.config_json;

// check if path exists
let config;
if (path_for_config && fs.existsSync(path_for_config)) {
  config = JSON.parse(fs.readFileSync(path_for_config));
} else {
  config = { title: "", source: "" };
}
let initial_x = 0;
let initial_y = 0;
app.get("/config", function (req, res) {
  config.num_nodes = data.length;
  config.initial_x = initial_x;
  config.initial_y = initial_y;
  config.initial_zoom = -3;
  config.genes = genes;

  validateSIDandSend(config, req.query.sid, res);
});

app.get("/nodes/", function (req, res) {
  const start_time = Date.now();
  const min_x = req.query.min_x;
  const max_x = req.query.max_x;
  let min_y = req.query.min_y !== undefined ? req.query.min_y : overallMinY();
  let max_y = req.query.max_y !== undefined ? req.query.max_y : overallMaxY();
  if (min_y < overallMinY()) {
    min_y = overallMinY();
  }
  if (max_y > overallMaxY()) {
    max_y = overallMaxY();
  }
  let result;

  if (min_y === overallMinY() && max_y === overallMaxY()) {
    //disabled
    result = cached_starting_values;

    console.log("Using cached values");
  } else {
    result = filtering.getNodes(data, y_positions, min_y, max_y, min_x, max_x);

    result = filtering.addMutations(result, mutations, node_to_mut);
  }
  console.log("Ready to send after " + (Date.now() - start_time) + "ms.");
  if (result !== cached_starting_values) {
    // This will be sent as json
    validateSIDandSend({ nodes: result }, req.query.sid, res);
    console.log(
      "Request took " +
        (Date.now() - start_time) +
        "ms, and output " +
        result.length +
        " nodes."
    );
  }
  if (result === cached_starting_values) {
    validateSIDandSend(result, req.query.sid, res);
    console.log(
      "Returning cached results took ",
      Date.now() - start_time + "ms."
    );
  }
});

if (command_options.ssl) {
  options = {
    key: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/privkey.pem"),
    ca: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/chain.pem"),
    cert: fs.readFileSync(
      "/etc/letsencrypt/live/api.taxonium.org/fullchain.pem"
    ),
  };
  https.createServer(options, app).listen(command_options.port);
  console.log("SSL on port " + command_options.port);
} else {
  app.listen(command_options.port, () =>
    console.log(`App is listening on port ${command_options.port}`)
  );
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

app.get("/node_details/", async (req, res) => {
  const start_time = Date.now();
  const query_id = req.query.id;
  const node = data[query_id];
  const node_mutations = node_to_mut[query_id].map((mutation) => {
    return mutations[mutation];
  });

  const detailed_node = { ...node, mutations: node_mutations };
  // If node name starts with EPI_ISL_, then get the URL
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
      console.log(e);
    }
  }
  validateSIDandSend(detailed_node, req.query.sid, res);
  console.log(
    "Request took " + (Date.now() - start_time) + "ms, and output " + node
  );
});
