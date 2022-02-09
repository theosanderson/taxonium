var express = require("express");
var cors = require("cors");
var compression = require("compression");
var app = express();
var fs = require("fs")
var https = require("https")
let options
// check for command line arg
const myArgs = process.argv.slice(2);



app.use(cors());
app.use(compression());

app.get("/", function (req, res) {
  res.send("Hello World!");
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
    result = cached_starting_values;

    console.log("Using cached values");
  } else {
    result = filtering.getNodes(data, y_positions, min_y, max_y, min_x, max_x);
  }
  console.log("Ready to send after " + (Date.now() - start_time) + "ms.");
  if (result !== cached_starting_values) {
    // This will be sent as json
    res.send({ nodes: result });
  }
  if (result === cached_starting_values) {
    // This is already a JSON string so
    // we can send it directly
    //res.setHeader("Content-Type", "application/json");
    res.send(result);
  }
  //res.send({ nodes: result });

  console.log(
    "Request took " +
      (Date.now() - start_time) +
      "ms, and output " +
      result.length +
      " nodes."
  );
});

app.listen(8000, () => console.log(`App is listening on port 8000!`));

if (myArgs[0] && myArgs[0]=="ssl"){
  options = {
    key: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/api.taxonium.org/cert.pem")
  };
  https.createServer(options, app).listen(8080);
  console.log("SSL on 8080")

}



const zlib = require("zlib");
const { parse } = require("@jsonlines/core");

const filtering = require("./filtering.js");

// create a duplex stream which parse input as lines of json
const parseStream = parse();

const unzip = zlib.createGunzip();

// read from the file and pipe into the parseStream
fs.createReadStream("./database/database.jsonl.gz")
  .pipe(unzip)
  .pipe(parseStream);

const data = [];

let counter = 0;

let y_positions;
let cached_starting_values;
function overallMinY() {
  return data[0].y;
}

function overallMaxY() {
  return data[data.length - 1].y;
}

function whenReady() {
  const scale_x = 30;
  const scale_y = 45;
  data.forEach((node) => {
    node.x = node.x * scale_x;
    node.y = node.y * scale_y;
  });

  // round x and y to 5 dp
  data.forEach((node) => {
    node.x = Math.round(node.x * 100000) / 100000;
    node.y = Math.round(node.y * 100000) / 100000;
  });
  data.forEach((node) => {
    node.parent_x = data[node.parent_id].x;
    node.parent_y = data[node.parent_id].y;
  });
  y_positions = data.map((node) => node.y);
  // assert that y is sorted
  for (let i = 1; i < y_positions.length; i++) {
    if (y_positions[i] < y_positions[i - 1]) {
      console.log("y is not sorted");
      // throw an error
      throw new Error("y is not sorted");
    }
  }
  cached_starting_values = filtering.getNodes(
    data,
    y_positions,
    overallMinY(),
    overallMaxY(),
    null,
    null
  );

  cached_starting_values = JSON.stringify({ nodes: cached_starting_values });

  console.log("I AM READY");
}

// consume the parsed objects by listening to data event
parseStream.on("data", (value) => {
  data.push(value);
  counter++;
  if (counter % 100000 === 0) {
    console.log(counter);
  }
});

parseStream.on("end", whenReady);
