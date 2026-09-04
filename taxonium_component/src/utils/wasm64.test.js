import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import filtering from "../../../taxonium_data_handling/filtering.js";
import { getInitialViewConfig } from "../../../taxonium_data_handling/importing.js";
import { setAccelerator } from "../../../taxonium_data_handling/acceleration.js";
import {
  createTreeAccelerator,
  moduleBytes,
} from "../../../taxonium_data_handling/wasm/treeProcessing.js";

function balancedTree(depth) {
  const root = 2 ** (depth - 1);
  return Array.from({ length: 2 ** depth - 1 }, (_, node_id) => {
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
      mutations: [0],
    };
  });
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  setAccelerator(null);
  vi.restoreAllMocks();
});

describe("JavaScript fallback", () => {
  it("keeps queries working when no accelerator is installed", () => {
    const nodes = balancedTree(3);
    expect(filtering.addParents(nodes, [nodes[0]])).toEqual([
      nodes[0],
      nodes[1],
      nodes[3],
    ]);
  });

  it("keeps queries working when acceleration declines an operation", () => {
    const nodes = balancedTree(3);
    setAccelerator({
      addParents: () => undefined,
      reduceOverPlotting: () => undefined,
    });
    expect(
      filtering.getNodes(
        nodes,
        nodes.map((n) => n.y),
        0,
        6,
        0,
        3,
        "x_dist",
      ),
    ).toEqual(nodes);
  });

  it("returns no accelerator on a runtime without Memory64", async () => {
    vi.resetModules();
    vi.spyOn(WebAssembly, "compile").mockRejectedValueOnce(
      new WebAssembly.CompileError("Memory64 disabled"),
    );
    const fresh = await import(
      "../../../taxonium_data_handling/wasm/treeProcessing.js"
    );
    expect(await fresh.createTreeAccelerator()).toBeNull();
  });
});

// Node 24+ runs these tests. Older Node releases still exercise the fallback.
describe.skipIf(!WebAssembly.validate(moduleBytes()))(
  "Memory64 tree processing",
  () => {
    let accelerator;
    beforeAll(async () => {
      accelerator = await createTreeAccelerator();
    });
    beforeEach(() => {
      accelerator.dispose();
    });

    function compare(operation) {
      setAccelerator(null);
      const expected = operation();
      setAccelerator(accelerator);
      const actual = operation();
      expect(actual).toEqual(expected);
      return actual;
    }

    it("uses i64 pointers and Memory64 growth", () => {
      accelerator.run((exports) => {
        expect(typeof exports.input()).toBe("bigint");
        expect(typeof exports.memory.grow(0n)).toBe("bigint");
      });
    });

    it("preserves duplicates across batches and refreshes views after memory growth", () => {
      const nodes = Array.from({ length: 40000 }, (_, node_id) => ({
        node_id,
        x_dist: node_id % 113,
        y: node_id % 331,
      }));
      const result = compare(() =>
        filtering.reduceOverPlotting(nodes, 5, 1, "x_dist"),
      );
      expect(result).toHaveLength(113 * 331);
      result.forEach((node) => expect(node).toBe(nodes[node.node_id]));
    });

    it.each([0, 1, Infinity, NaN, -3.7])(
      "matches JS rounding and numeric object keys at precision %s",
      (precision) => {
        const values = [
          -Infinity,
          -2.5,
          -0.5000000000000001,
          -0.5,
          -0,
          0,
          0.49999999999999994,
          0.5,
          1.5,
          2 ** 53,
          Infinity,
          NaN,
        ];
        const nodes = [...values, ...values].map((x_dist, node_id) => ({
          node_id,
          x_dist,
          y: node_id % values.length,
        }));
        compare(() =>
          filtering.reduceOverPlotting(
            nodes,
            precision * 5,
            precision,
            "x_dist",
          ),
        );
      },
    );

    it("collects shared ancestors and sorts numerically without visiting unrelated nodes", () => {
      const nodes = balancedTree(10);
      Object.defineProperty(nodes, 900, {
        get() {
          throw new Error("Visited an unrelated node");
        },
      });
      setAccelerator(accelerator);
      expect(
        filtering
          .addParents(nodes, [nodes[10], nodes[0], nodes[10]])
          .map((n) => n.node_id),
      ).toEqual([0, 1, 3, 7, 9, 10, 11, 15, 31, 63, 127, 255, 511]);
    });

    it("preserves dense selections, empty inputs, and root-only trees", () => {
      const nodes = balancedTree(10);
      compare(() =>
        filtering.addParents(
          nodes,
          nodes.filter((n) => n.num_tips === 1).reverse(),
        ),
      );
      compare(() => filtering.addParents(nodes, []));
      compare(() => filtering.addParents([], []));
      const root = balancedTree(1);
      compare(() => filtering.addParents(root, root));
    });

    it("handles long ancestor paths and multiple batches of initial IDs", () => {
      const nodes = Array.from({ length: 20000 }, (_, node_id) => ({
        node_id,
        parent_id: Math.min(node_id + 1, 19999),
      }));
      compare(() => filtering.addParents(nodes, [nodes[0]]));
      compare(() => filtering.addParents(nodes, [...nodes].reverse()));
    });

    it("preserves complete viewport queries and mutation hydration", () => {
      const nodes = balancedTree(12);
      const ys = nodes.map((node) => node.y);
      compare(() =>
        filtering.getNodes(nodes, ys, 100, 200, 0, 12, "x_dist", true, [
          { mutation_id: 0 },
        ]),
      );
      expect(nodes[100].mutations).toEqual([0]);
      compare(() =>
        filtering.getNodes(nodes, ys, 0, nodes.length - 1, 0, 12, "x_dist"),
      );
    });

    it.each(["==", ">", "<", ">=", "<="])(
      "preserves numeric search coercion for %s",
      (number_method) => {
        const nodes = [
          -Infinity,
          -1,
          0,
          1,
          5,
          "5",
          "",
          null,
          undefined,
          NaN,
          Infinity,
          true,
          false,
          "abc",
        ].map((score, node_id) => ({ score, node_id }));
        const result = compare(() =>
          filtering.singleSearch({
            data: nodes,
            spec: {
              type: "score",
              method: "number",
              number: "5",
              number_method,
            },
            mutations: [],
            node_to_mut: {},
          }),
        );
        expect(result.type).toBe("complete");
      },
    );

    it("declines non-numeric node IDs and preserves unusual search values through fallback", () => {
      expect(
        accelerator.addParents(
          [{ node_id: "0", parent_id: "0" }],
          [{ node_id: "0" }],
        ),
      ).toBeUndefined();
      expect(
        accelerator.numericFilter(
          [{ value: 9007199254740993n }],
          "value",
          ">",
          9007199254740992,
        ),
      ).toBeUndefined();
    });

    it("does not truncate node IDs to 32 bits", () => {
      const tip = 2 ** 32 + 1;
      const root = tip + 6;
      // Array-like sparse data proves ID width without allocating billions of nodes.
      const nodes = {
        length: root + 1,
        [tip]: { node_id: tip, parent_id: root },
        [root]: { node_id: root, parent_id: root },
      };
      expect(accelerator.addParents(nodes, [nodes[tip]])).toEqual([
        nodes[tip],
        nodes[root],
      ]);
    });

    it("falls back if the runtime refuses to allocate an instance", () => {
      vi.spyOn(WebAssembly, "Instance").mockImplementation(function () {
        throw new RangeError("Allocation refused");
      });
      const nodes = balancedTree(3);
      setAccelerator(accelerator);
      expect(filtering.addParents(nodes, [nodes[0]])).toEqual([
        nodes[0],
        nodes[1],
        nodes[3],
      ]);
    });

    it("preserves robust coordinate ranges, outliers, constants, and missing values", () => {
      const datasets = [
        Array.from({ length: 10000 }, (_, i) => ({
          x_dist: i < 9900 ? i / 99 : 1000,
          x_time: 2000 + i / 1000,
        })),
        [{ x_dist: 2 }, { x_dist: 2 }],
        [{ x_dist: -0 }, { x_dist: -0 }],
        [{ x_dist: NaN }, { x_dist: Infinity }, { x_dist: -2 }, { x_dist: 4 }],
        [{ x_dist: "2" }, { x_dist: null }],
        [{ x_dist: -Number.MAX_VALUE }, { x_dist: Number.MAX_VALUE }],
        [],
      ];
      for (const nodes of datasets)
        compare(() => getInitialViewConfig(nodes, { minY: 0, maxY: 2400 }));
    });

    it("releases large scratch allocations and supports later small queries", () => {
      const nodes = Array.from({ length: 150000 }, (_, node_id) => ({
        node_id,
        x_dist: node_id,
        y: node_id,
      }));
      expect(
        accelerator.reduceOverPlotting(nodes, 5, 1, "x_dist"),
      ).toHaveLength(nodes.length);
      expect(accelerator.lastPeakBytes).toBeGreaterThan(8 * 1024 * 1024);
      expect(accelerator.retainedBytes).toBe(0);
      expect(
        accelerator.reduceOverPlotting(nodes.slice(0, 2), 5, 1, "x_dist"),
      ).toHaveLength(2);
      expect(accelerator.retainedBytes).toBeLessThan(8 * 1024 * 1024);
      accelerator.dispose();
      expect(accelerator.retainedBytes).toBe(0);
    });
  },
);
