// Run with Node 24+: node --expose-gc taxonium_data_handling/wasm/benchmark.mjs
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import filtering from "../filtering.js";
import { getInitialViewConfig } from "../importing.js";
import { setAccelerator } from "../acceleration.js";
import { createTreeAccelerator } from "./treeProcessing.js";

const accelerator = await createTreeAccelerator();
assert(
  accelerator,
  "This benchmark requires a runtime with Memory64 (Node 24+).",
);
const report = console.log.bind(console);
console.log = () => {};
const depth = Number(process.argv[2] ?? 22);
assert(Number.isInteger(depth) && depth >= 2 && depth <= 24);
const root = 2 ** (depth - 1);
const nodes = Array.from({ length: 2 ** depth - 1 }, (_, node_id) => {
  const position = node_id + 1;
  const span = position & -position;
  const parent =
    position === root
      ? position
      : position & (span * 2)
        ? position - span
        : position + span;
  return {
    node_id,
    parent_id: parent - 1,
    y: node_id,
    x_dist: depth - 1 - Math.log2(span),
    num_tips: span,
  };
});
const ys = nodes.map((node) => node.y);
const start = Math.floor(nodes.length * 0.6);
const median = (times) =>
  times.toSorted((a, b) => a - b)[Math.floor(times.length / 2)];

function benchmark(name, operation, equivalent = assert.deepEqual) {
  setAccelerator(null);
  const expected = operation(false);
  setAccelerator(accelerator);
  equivalent(operation(true), expected);
  for (let i = 0; i < 2; i++) {
    setAccelerator(null);
    operation(false);
    setAccelerator(accelerator);
    operation(true);
  }
  global.gc?.();
  const timings = [[], []];
  for (let i = 0; i < 9; i++) {
    for (const mode of i % 2 ? [1, 0] : [0, 1]) {
      setAccelerator(mode ? accelerator : null);
      const before = performance.now();
      operation(!!mode);
      timings[mode].push(performance.now() - before);
    }
  }
  report(
    JSON.stringify({
      name,
      nodes: nodes.length,
      js_ms: +median(timings[0]).toFixed(2),
      wasm64_ms: +median(timings[1]).toFixed(2),
      wasm_scratch_bytes: accelerator.lastPeakBytes,
    }),
  );
}

const sameNodes = (actual, expected) => {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < actual.length; i++) assert.equal(actual[i], expected[i]);
};
for (const [name, min, max] of [
  ["narrow viewport", start, start + 2000],
  ["2% viewport", start, start + Math.floor(nodes.length / 50)],
  ["whole tree", 0, nodes.length - 1],
])
  benchmark(
    name,
    () => filtering.getNodes(nodes, ys, min, max, 0, depth, "x_dist"),
    sameNodes,
  );
benchmark(
  "numeric search",
  (wasm) =>
    wasm
      ? accelerator.numericFilter(nodes, "x_dist", ">", depth - 2)
      : nodes.filter((node) => node.x_dist > depth - 2),
  sameNodes,
);
benchmark("coordinate ranges", () =>
  getInitialViewConfig(nodes, { minY: 0, maxY: nodes.length - 1 }),
);
accelerator.dispose();
