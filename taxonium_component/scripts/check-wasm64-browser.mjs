// Build and exercise the production inline worker in a real browser.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { chromium } from "playwright";
import viteConfig from "../vite.config.js";
import { moduleBytes } from "../../taxonium_data_handling/wasm/treeProcessing.js";

const baseURL = "http://taxonium.test/";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary = await mkdtemp(join(tmpdir(), "taxonium-worker-test-"));
const entry = join(temporary, "entry.js");
let workerModule;
try {
  await writeFile(
    entry,
    `export { default } from ${JSON.stringify(join(root, "src/webworkers/localBackendWorker.js") + "?worker&inline")};\n`,
  );
  await build({
    ...viteConfig,
    configFile: false,
    root,
    logLevel: "error",
    build: {
      ...viteConfig.build,
      outDir: temporary,
      emptyOutDir: false,
      sourcemap: false,
      lib: { entry, formats: ["es"], fileName: () => "worker-check.js" },
    },
  });
  workerModule = await readFile(join(temporary, "worker-check.js"), "utf8");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
const browser = await chromium.launch({
  headless: true,
  ...(process.env.WASM64_CHROMIUM
    ? { executablePath: process.env.WASM64_CHROMIUM }
    : {}),
});
try {
  const results = [];
  for (const enabled of [true, false]) {
    const page = await browser.newPage();
    await page.route(baseURL, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Worker test</title>",
      }),
    );
    await page.route(`${baseURL}worker-check.js`, (route) =>
      route.fulfill({ contentType: "text/javascript", body: workerModule }),
    );
    await page.goto(baseURL);
    const result = await page.evaluate(
      async ({ baseURL, enabled }) => {
        const { default: BackendWorker } = await import(
          `${baseURL}worker-check.js`
        );
        const createURL = URL.createObjectURL.bind(URL);
        // Instrument the actual bundled worker, not a second implementation.
        const prefix = enabled
          ? `const compile = WebAssembly.compile.bind(WebAssembly); WebAssembly.compile = async bytes => { const module = await compile(bytes); postMessage({type: "memory64_probe", enabled: true}); return module; };\n`
          : `WebAssembly.compile = async () => { postMessage({type: "memory64_probe", enabled: false}); throw new WebAssembly.CompileError("Disabled for fallback test"); };\n`;
        URL.createObjectURL = (blob) =>
          createURL(new Blob([prefix, blob], { type: "text/javascript" }));
        const worker = new BackendWorker();
        URL.createObjectURL = createURL;

        const depth = 15;
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
            mutations: [],
          };
        });
        const header = {
          total_nodes: nodes.length,
          mutations: [],
          config: { title: "Synthetic worker test" },
        };
        const bytes = new TextEncoder().encode(
          [header, ...nodes].map((node) => JSON.stringify(node)).join("\n") +
            "\n",
        );
        const scale = 2400 / nodes.length;
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            worker.terminate();
            reject(new Error("Worker timed out"));
          }, 30000);
          const result = {};
          worker.onerror = (event) => {
            clearTimeout(timer);
            worker.terminate();
            reject(new Error(event.message));
          };
          worker.onmessage = ({ data }) => {
            if (data.type === "memory64_probe") result.enabled = data.enabled;
            if (data.type === "query")
              result.ids = data.data.nodes.map((node) => node.node_id);
            if (data.type === "config") result.config = data.data;
            if (result.ids && result.config) {
              clearTimeout(timer);
              worker.terminate();
              resolve(result);
            }
          };
          worker.postMessage({
            type: "upload",
            data: {
              status: "loaded",
              filename: "synthetic.jsonl",
              data: bytes.buffer,
            },
          });
          worker.postMessage({ type: "config" });
          worker.postMessage({
            type: "query",
            bounds: {
              min_y: 0,
              max_y: scale * 2 + 0.000001,
              min_x: 0,
              max_x: depth,
              xType: "x_dist",
            },
          });
        });
      },
      { baseURL, enabled },
    );
    assert.equal(
      result.enabled,
      enabled,
      "Expected the requested backend to execute",
    );
    assert.equal(result.config.num_nodes, 32767);
    assert.deepEqual(
      result.ids,
      [0, 1, 2, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383],
    );
    results.push(result);
    await page.close();
  }
  assert.deepEqual(results[0].config, results[1].config);
  console.log(
    `Chromium ${browser.version()}: actual inline worker passed with Memory64 and forced JavaScript fallback.`,
  );
  if (process.env.WASM64_LARGE_MEMORY_CHECK === "1") {
    const page = await browser.newPage();
    const highAddress = await page.evaluate(async (bytes) => {
      const { instance } = await WebAssembly.instantiate(
        new Uint8Array(bytes),
        { tree: { parent: () => 0 } },
      );
      const memory = instance.exports.memory;
      memory.grow(65537n - BigInt(memory.buffer.byteLength / 65536));
      const high = new Uint8Array(memory.buffer, 2 ** 32, 1);
      high[0] = 123;
      return { bytes: memory.buffer.byteLength, value: high[0] };
    }, Array.from(moduleBytes()));
    assert.equal(highAddress.bytes, 4295032832);
    assert.equal(highAddress.value, 123);
    console.log(
      "Memory64 allocation and byte access above the 4-GiB boundary passed.",
    );
    await page.close();
  }
} finally {
  await browser.close();
}
