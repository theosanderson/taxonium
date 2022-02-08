var express = require("express");
var cors = require("cors");
var compression = require("compression");
var app = express();
app.use(cors());
app.use(compression());

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.get("/nodes/", function (req, res) {
  const start_time = Date.now();
  // get min_x, max_x, min_y, max_y from URL
  const min_x = req.query.min_x;
  const max_x = req.query.max_x;
  const min_y = req.query.min_y;
  const max_y = req.query.max_y;

  const filtered =
    min_y !== undefined ? filtering.filter(data, min_y, max_y) : data;

  const precision = min_y !== undefined ? 1000.0 / (max_y - min_y) : 4;
  const reduced_leaves = filtering.reduceOverPlotting(filtered, precision);
  const reduced = filtering.addParents(data, reduced_leaves);
  console.log("precision:", precision);
  res.send({ nodes: reduced });
  console.log(
    "Request took " +
      (Date.now() - start_time) +
      "ms, and output " +
      reduced.length +
      " nodes."
  );
});

app.listen(3000, () => console.log(`App is listening on port 3000!`));

const fs = require("fs");
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

function whenReady() {
  const scale_x = 20;
  const scale_y = 45;
  data.forEach((node) => {
    node.x = node.x * scale_x;
    node.y = node.y * scale_y;
  });
  data.forEach((node) => {
    node.parent_x = data[node.parent_id].x;
    node.parent_y = data[node.parent_id].y;
  });
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
