import { describe, it, expect } from "vitest";
import { isOutsideBounds } from "./useGetDynamicData";

describe("isOutsideBounds", () => {
  it("handles zero min_x correctly", () => {
    const vs = { min_x: 0, max_x: 5, min_y: 0, max_y: 5 } as Record<string, number>;
    const dynamicData = {
      lastBounds: { min_x: 10, max_x: 20, min_y: -10, max_y: 20 },
    } as any;
    expect(isOutsideBounds(vs, dynamicData)).toBe(true);
  });
});
