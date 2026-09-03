import { describe, expect, it } from "vitest";
import {
  generateConfig,
  getInitialViewConfig,
} from "../../../taxonium_data_handling/importing.js";

describe("getInitialViewConfig", () => {
  it("uses the full extent when there are no substantial outliers", () => {
    const nodes = Array.from({ length: 100 }, (_, x_dist) => ({
      x_dist,
      x_time: 2000 + x_dist / 10,
    }));

    const result = getInitialViewConfig(nodes, { minY: 0, maxY: 2400 });

    expect(result.x_ranges.x_dist).toEqual({
      min: 0,
      max: 99,
      robust_max: 99,
    });
    expect(result.x_ranges.x_time).toEqual({
      min: 2000,
      max: 2009.9,
      robust_max: 2009.9,
    });
    expect(result.initial_x).toBe(49.5);
    expect(result.initial_y).toBe(1200);
  });

  it("trims a small group of long-branch outliers", () => {
    const bulk = Array.from({ length: 990 }, (_, index) => ({
      x_dist: (index / 989) * 200,
    }));
    const outliers = Array.from({ length: 10 }, (_, index) => ({
      x_dist: 1000 - index,
    }));

    const range = getInitialViewConfig([...bulk, ...outliers], {
      minY: 0,
      maxY: 2400,
    }).x_ranges.x_dist;

    expect(range.min).toBe(0);
    expect(range.max).toBe(1000);
    expect(range.robust_max).toBeGreaterThan(250);
    expect(range.robust_max).toBeLessThan(270);
  });

  it("keeps the full range when trimming would leave a negligible span", () => {
    const nodes = [
      ...Array.from({ length: 99 }, () => ({ x_dist: 0 })),
      { x_dist: 1000 },
    ];

    expect(
      getInitialViewConfig(nodes, { minY: 4, maxY: 4 }).x_ranges.x_dist,
    ).toEqual({ min: 0, max: 1000, robust_max: 1000 });
  });

  it("ignores non-finite coordinates", () => {
    const nodes = [
      { x_dist: NaN },
      { x_dist: Infinity },
      { x_dist: 2 },
      { x_dist: 4 },
    ];

    expect(
      getInitialViewConfig(nodes, { minY: 0, maxY: 1 }).x_ranges.x_dist,
    ).toEqual({ min: 2, max: 4, robust_max: 4 });
  });

  it("reuses a precomputed view when generating config", () => {
    const initial_view = {
      x_ranges: { x_dist: { min: 0, max: 10, robust_max: 8 } },
      y_range: { min: 0, max: 20 },
      initial_x: 4,
      initial_y: 10,
    };
    const config = {};

    generateConfig(config, {
      nodes: [{ name: "root", node_id: 0, parent_id: 0, x_dist: 100 }],
      mutations: [],
      rootMutations: [],
      rootId: 0,
      initial_view,
    });

    expect(config.x_ranges).toBe(initial_view.x_ranges);
  });
});
