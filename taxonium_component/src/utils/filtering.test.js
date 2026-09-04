import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import filtering from "../../../taxonium_data_handling/filtering.js";

// A balanced tree in Y order, with the root in the middle of the array.
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
      x_time: 2000 + depth - 1 - Math.log2(span),
      num_tips: span,
      mutations: [0],
    };
  });
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("addParents", () => {
  it("returns shared ancestors once in data order for an unordered selection", () => {
    const nodes = balancedTree(7);
    const selected = [nodes[10], nodes[0], nodes[10], nodes[7]];
    const originalOrder = [...selected];
    const result = filtering.addParents(nodes, selected);

    expect(result.map((node) => node.node_id)).toEqual([
      0, 1, 3, 7, 9, 10, 11, 15, 31, 63,
    ]);
    result.forEach((node) => expect(node).toBe(nodes[node.node_id]));
    expect(selected).toEqual(originalOrder);
    expect(nodes.map((node) => node.node_id)).toEqual(
      Array.from({ length: nodes.length }, (_, i) => i),
    );
  });

  it("preserves the complete tree for a dense selection", () => {
    const nodes = balancedTree(7);
    const tips = nodes.filter((node) => node.num_tips === 1).reverse();

    expect(filtering.addParents(nodes, tips)).toEqual(nodes);
  });

  it("handles an empty selection, an empty tree, and a root-only tree", () => {
    expect(filtering.addParents(balancedTree(7), [])).toEqual([]);
    expect(filtering.addParents([], [])).toEqual([]);
    const nodes = balancedTree(1);
    expect(filtering.addParents(nodes, nodes)).toEqual(nodes);
  });

  it("includes a long ancestor chain without recursive traversal", () => {
    const nodes = Array.from({ length: 20000 }, (_, node_id) => ({
      node_id,
      parent_id: Math.min(node_id + 1, 19999),
    }));

    expect(filtering.addParents(nodes, [nodes[0]])).toEqual(nodes);
  });
});

describe("getNodes", () => {
  it.each(["x_dist", "x_time"])(
    "returns a sparse viewport and its ancestors without visiting unrelated nodes (%s)",
    (xType) => {
      const nodes = balancedTree(10);
      const yPositions = nodes.map((node) => node.y);
      // This unrelated tip is outside the viewport and every ancestor path.
      // Reading it would reveal a full-tree scan without relying on timings.
      Object.defineProperty(nodes, 900, {
        get() {
          throw new Error("Visited a node outside the viewport and its ancestors");
        },
      });
      const minX = xType === "x_time" ? 2000 : 0;
      const result = filtering.getNodes(
        nodes, yPositions, 0, 2, minX, minX + 10, xType,
      );

      expect(result.map((node) => node.node_id)).toEqual([
        0, 1, 2, 3, 7, 15, 31, 63, 127, 255, 511,
      ]);
    },
  );

  it("preserves whole-tree queries", () => {
    const nodes = balancedTree(7);
    const result = filtering.getNodes(
      nodes, nodes.map((node) => node.y), 0, 126, 0, 7, "x_dist",
    );

    expect(result).toEqual(nodes);
  });

  it("hydrates mutations without changing the stored nodes", () => {
    const nodes = balancedTree(7);
    const mutation = { mutation_id: 0 };
    const result = filtering.getNodes(
      nodes, nodes.map((node) => node.y), 0, 0.5, 0, 7, "x_dist", true, [mutation],
    );

    expect(result.map((node) => node.node_id)).toEqual([0, 1, 3, 7, 15, 31, 63]);
    result.forEach((node) => {
      expect(node.mutations).toEqual([mutation]);
      expect(node).not.toBe(nodes[node.node_id]);
      expect(nodes[node.node_id].mutations).toEqual([0]);
    });
  });
});
