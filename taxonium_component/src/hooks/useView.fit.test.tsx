import { describe, it, expect } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import useView from "./useView";

const act = (React as any).act as (cb: () => void) => void;

// Minimal renderHook: @testing-library/react is not a dependency here.
function renderHook<T>(hook: () => T) {
  const result = { current: undefined as unknown as T };
  const Probe = () => {
    result.current = hook();
    return null;
  };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(Probe));
  });
  return { result };
}

const settings = { minimapEnabled: true, treenomeEnabled: false } as any;
const deckSize = { width: 1000, height: 500 };

const setup = (s = settings, size = deckSize) =>
  renderHook(() =>
    useView({ settings: s, deckSize: size, mouseDownIsMinimap: false })
  );

// Every view state this hook produces has a zoom per axis.
const zoomOf = (vs: { zoom: number | [number, number] }) =>
  vs.zoom as [number, number];

const xRange = { min: 0, max: 2805, robust_max: 800 };
const yRange = { min: 0, max: 2400 };

describe("fitToRanges", () => {
  it("centres on the robust range and zooms to fill 80% of the width", () => {
    const { result } = setup();
    act(() => {
      result.current.fitToRanges(xRange, yRange);
    });
    const vs = result.current.viewState;
    expect(vs.target[0]).toBe(400);
    expect(vs.target[1]).toBe(1200);
    expect(zoomOf(vs)[0]).toBeCloseTo(Math.log2((1000 * 0.8) / 800), 10);
    expect(zoomOf(vs)[1]).toBeCloseTo(Math.log2((500 * 0.96) / 2400), 10);
  });

  it("fits the minimap to the same extents", () => {
    const { result } = setup();
    act(() => {
      result.current.fitToRanges(xRange, yRange);
    });
    const mm = result.current.viewState.minimap!;
    expect(mm.target).toEqual([400, 1200]);
    expect(zoomOf(mm)[0]).toBeCloseTo(Math.log2((1000 * 0.2 * 0.8) / 800), 10);
    expect(zoomOf(mm)[1]).toBeCloseTo(
      Math.log2((500 * 0.35 * 0.96) / 2400),
      10
    );
  });

  it("uses 40% of the width when the treenome browser is open", () => {
    const { result } = setup({ ...settings, treenomeEnabled: true });
    act(() => {
      result.current.fitToRanges(xRange, yRange);
    });
    expect(zoomOf(result.current.viewState)[0]).toBeCloseTo(
      Math.log2((1000 * 0.4 * 0.8) / 800),
      10
    );
  });

  it("refits when unmoved but not after the user pans", () => {
    const { result } = setup();
    act(() => {
      result.current.fitToRanges(xRange, yRange);
    });
    act(() => {
      result.current.fitToRanges(
        { min: 0, max: 100, robust_max: 100 },
        yRange,
        { onlyIfUnmoved: true }
      );
    });
    expect(result.current.viewState.target[0]).toBe(50);

    act(() => {
      result.current.setViewState((vs: any) => ({
        ...vs,
        target: [12345, vs.target[1]],
      }));
    });
    act(() => {
      result.current.fitToRanges({ min: 0, max: 10, robust_max: 10 }, yRange, {
        onlyIfUnmoved: true,
      });
    });
    expect(result.current.viewState.target[0]).toBe(12345);
  });

  // A tree whose nodes all share an x or a y position has nothing to fit to,
  // so the view is left alone rather than zoomed to an infinite scale.
  it("does nothing for a degenerate range or an unknown deck size", () => {
    const { result } = setup();
    const before = result.current.viewState;
    act(() => {
      result.current.fitToRanges({ min: 5, max: 5, robust_max: 5 }, yRange);
      result.current.fitToRanges(xRange, { min: 0, max: 0 });
    });
    expect(result.current.viewState).toBe(before);

    const nan = setup(settings, { width: NaN, height: NaN });
    const nanBefore = nan.result.current.viewState;
    act(() => {
      nan.result.current.fitToRanges(xRange, yRange);
    });
    expect(nan.result.current.viewState).toBe(nanBefore);
  });

  it("resets the zoom to the fitted view, or the default before a fit", () => {
    const { result } = setup();
    act(() => {
      result.current.zoomReset();
    });
    expect(result.current.viewState.zoom).toEqual([0, -2]);

    act(() => {
      result.current.fitToRanges(xRange, yRange);
    });
    const fitted = result.current.viewState;
    act(() => {
      result.current.setViewState((vs: any) => ({ ...vs, target: [9, 9] }));
    });
    act(() => {
      result.current.zoomReset();
    });
    expect(result.current.viewState.target).toEqual(fitted.target);
    expect(result.current.viewState.zoom).toEqual(fitted.zoom);
    expect(result.current.viewState.minimap).toEqual(fitted.minimap);
  });
});
