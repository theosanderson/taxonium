import encodedModule from "./treeProcessingBytes.js";

const BATCH = 8192;
const RETAINED_SCRATCH_LIMIT = 8 * 1024 * 1024;
let compiledModule;

export function moduleBytes() {
  return Uint8Array.from(atob(encodedModule), (character) =>
    character.charCodeAt(0),
  );
}

// Compilation doubles as feature detection: the binary uses genuine i64 memory
// addresses. Older engines reject it and continue with the JavaScript backend.
export async function createTreeAccelerator() {
  if (typeof WebAssembly === "undefined") return null;
  try {
    compiledModule ??= WebAssembly.compile(moduleBytes());
    return new TreeAccelerator(await compiledModule);
  } catch (error) {
    if (
      error instanceof WebAssembly.CompileError ||
      error instanceof RangeError
    )
      return null;
    throw error;
  }
}

export class TreeAccelerator {
  constructor(module) {
    this.module = module;
    this.instance = null;
    this.parentNodes = null;
    this.lastPeakBytes = 0;
  }

  get retainedBytes() {
    return this.instance?.exports.memory.buffer.byteLength ?? 0;
  }

  dispose() {
    this.instance = null;
    this.parentNodes = null;
  }

  run(operation) {
    try {
      this.instance ??= new WebAssembly.Instance(this.module, {
        tree: {
          parent: (id) => {
            const parent = this.parentNodes?.[id]?.parent_id;
            return typeof parent === "number" ? parent : NaN;
          },
        },
      });
      return operation(this.instance.exports);
    } catch (error) {
      // There is still an intact JS tree if the browser refuses an allocation.
      if (error instanceof RangeError) return undefined;
      throw error;
    } finally {
      this.parentNodes = null;
      this.lastPeakBytes = this.retainedBytes;
      // A large query must not permanently retain its high-water allocation.
      // This is a retention budget, not a maximum tree or operation size.
      if (this.retainedBytes > RETAINED_SCRATCH_LIMIT) this.dispose();
    }
  }

  input(exports) {
    // memory.grow detaches old views. Reacquire before every batch.
    return new Float64Array(
      exports.memory.buffer,
      Number(exports.input()),
      BATCH * 2,
    );
  }

  appendMatches(exports, count, nodes, start, output) {
    const indices = new Uint32Array(
      exports.memory.buffer,
      Number(exports.indices()),
      count,
    );
    for (let i = 0; i < count; i++) output.push(nodes[start + indices[i]]);
  }

  reduceOverPlotting(nodes, precisionX, precisionY, xType) {
    return this.run((exports) => {
      exports.reset(2);
      const output = [];
      for (let start = 0; start < nodes.length; start += BATCH) {
        const count = Math.min(BATCH, nodes.length - start);
        const input = this.input(exports);
        for (let i = 0; i < count; i++) {
          input[i * 2] = nodes[start + i][xType];
          input[i * 2 + 1] = nodes[start + i].y;
        }
        const matched = exports.reduce_points(
          count,
          precisionX / 5,
          precisionY,
        );
        if (matched < 0) return undefined;
        this.appendMatches(exports, matched, nodes, start, output);
      }
      return output;
    });
  }

  addParents(nodes, filtered) {
    return this.run((exports) => {
      exports.reset(1);
      this.parentNodes = nodes;
      for (let start = 0; start < filtered.length; start += BATCH) {
        const count = Math.min(BATCH, filtered.length - start);
        const input = this.input(exports);
        for (let i = 0; i < count; i++) {
          const id = filtered[start + i].node_id;
          if (!Number.isSafeInteger(id) || id < 0 || id >= nodes.length)
            return undefined;
          input[i] = id;
        }
        if (exports.seed_ids(count) < 0) return undefined;
      }
      if (exports.collect_parents(nodes.length) < 0) return undefined;
      const count = Number(exports.selected_count());
      const ids = new Float64Array(
        exports.memory.buffer,
        Number(exports.selected()),
        count,
      );
      const output = new Array(count);
      for (let i = 0; i < count; i++) output[i] = nodes[ids[i]];
      return output;
    });
  }

  numericFilter(nodes, field, method, value) {
    const operation = ["==", ">", "<", ">=", "<="].indexOf(method);
    if (operation < 0) return undefined;
    return this.run((exports) => {
      const output = [];
      for (let start = 0; start < nodes.length; start += BATCH) {
        const count = Math.min(BATCH, nodes.length - start);
        const input = this.input(exports);
        for (let i = 0; i < count; i++) {
          const x = nodes[start + i][field];
          if (operation === 0) {
            input[i] = typeof x === "number" ? x : NaN;
          } else {
            // Preserve JS coercion, including strict equality versus numeric
            // comparisons. Leave objects, symbols and BigInts to JS.
            if (typeof x === "number") input[i] = x;
            else if (
              x === null ||
              typeof x === "string" ||
              typeof x === "undefined" ||
              typeof x === "boolean"
            )
              input[i] = Number(x);
            else return undefined;
          }
        }
        const matched = exports.numeric_filter(count, operation, value);
        this.appendMatches(exports, matched, nodes, start, output);
      }
      return output;
    });
  }

  coordinateRange(nodes, field, fraction) {
    return this.run((exports) => {
      const scan = (kernel) => {
        for (let start = 0; start < nodes.length; start += BATCH) {
          const count = Math.min(BATCH, nodes.length - start);
          const input = this.input(exports);
          for (let i = 0; i < count; i++) {
            const value = nodes[start + i][field];
            input[i] = typeof value === "number" ? value : NaN;
          }
          kernel(count);
        }
      };
      exports.range_begin();
      scan(exports.range_chunk);
      const min = exports.range_min();
      const max = exports.range_max();
      if (min === Infinity) return null;
      if (min === max) return { min, max, quantile: max };
      if (!Number.isFinite(max - min)) return undefined;
      exports.histogram_begin();
      scan(exports.histogram_chunk);
      return { min, max, quantile: exports.quantile(fraction) };
    });
  }
}
