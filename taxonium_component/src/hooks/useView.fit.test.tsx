import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import type { Settings } from "../types/settings";
import type { DeckSize } from "../types/common";
import useView from "./useView";

const act = (React as any).act as (cb: () => void) => void;
const roots: Root[] = [];

function renderView(
  initialSettings: Settings,
  initialSize: DeckSize,
  mouseDownIsMinimap = false,
) {
  let props = {
    settings: initialSettings,
    deckSize: initialSize,
    mouseDownIsMinimap,
  };
  const result = {
    current: undefined as unknown as ReturnType<typeof useView>,
  };
  const Probe = () => {
    result.current = useView(props);
    return null;
  };
  const root = createRoot(document.createElement("div"));
  roots.push(root);
  const render = () => act(() => root.render(React.createElement(Probe)));
  render();
  return {
    result,
    rerender(next: Partial<typeof props>) {
      props = { ...props, ...next };
      render();
    },
  };
}

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
});

const settings = {
  minimapEnabled: true,
  treenomeEnabled: false,
} as Settings;
const deckSize = { width: 1000, height: 500 };
const xRange = { min: 0, max: 2805, robust_max: 800 };
const yRange = { min: 0, max: 2400 };
const zoomOf = (zoom: number | [number, number]) => zoom as [number, number];

describe("fitToRanges", () => {
  it("fits the main view to the robust x range and full y range", () => {
    const { result } = renderView(settings, deckSize);
    act(() => result.current.fitToRanges(xRange, yRange));

    expect(result.current.viewState.target).toEqual([400, 1200]);
    expect(zoomOf(result.current.viewState.zoom)[0]).toBeCloseTo(
      Math.log2((1000 * 0.8) / 800),
      10,
    );
    expect(zoomOf(result.current.viewState.zoom)[1]).toBeCloseTo(
      Math.log2((500 * 0.96) / 2400),
      10,
    );
  });

  it("uses the robust x range for the minimap", () => {
    const { result } = renderView(settings, deckSize);
    act(() => result.current.fitToRanges(xRange, yRange));

    const minimap = result.current.viewState.minimap!;
    expect(minimap.target).toEqual([400, 1200]);
    expect(zoomOf(minimap.zoom)[0]).toBeCloseTo(
      Math.log2((1000 * 0.2 * 0.8) / 800),
      10,
    );
    expect(zoomOf(minimap.zoom)[1]).toBeCloseTo(
      Math.log2((500 * 0.35 * 0.96) / 2400),
      10,
    );
  });

  it("accounts for the treenome browser width", () => {
    const { result } = renderView(
      { ...settings, treenomeEnabled: true },
      deckSize,
    );
    act(() => result.current.fitToRanges(xRange, yRange));

    expect(zoomOf(result.current.viewState.zoom)[0]).toBeCloseTo(
      Math.log2((1000 * 0.4 * 0.8) / 800),
      10,
    );
  });

  it("refits an unmoved x axis while preserving a moved y axis", () => {
    const { result, rerender } = renderView(settings, deckSize);
    act(() => result.current.fitToRanges(xRange, yRange));
    act(() =>
      result.current.setViewState((current) => ({
        ...current,
        target: [current.target[0], 12345],
      })),
    );

    rerender({ deckSize: { width: 500, height: 500 } });
    act(() =>
      result.current.fitToRanges(xRange, yRange, {
        x: "if-unmoved",
        y: "skip",
      }),
    );

    expect(zoomOf(result.current.viewState.zoom)[0]).toBeCloseTo(-1, 10);
    expect(result.current.viewState.target).toEqual([400, 12345]);
  });

  it("preserves y when x is forcibly refitted", () => {
    const { result } = renderView(settings, deckSize);
    act(() => result.current.fitToRanges(xRange, yRange));
    act(() =>
      result.current.setViewState((current) => ({
        ...current,
        zoom: [zoomOf(current.zoom)[0], 7],
        target: [current.target[0], 321],
      })),
    );
    act(() =>
      result.current.fitToRanges(
        { min: 0, max: 100, robust_max: 100 },
        yRange,
        { x: "force", y: "skip" },
      ),
    );

    expect(result.current.viewState.target).toEqual([50, 321]);
    expect(zoomOf(result.current.viewState.zoom)[1]).toBe(7);
  });

  it("updates the reset fit after a moved view is resized", () => {
    const { result, rerender } = renderView(settings, deckSize);
    act(() => result.current.fitToRanges(xRange, yRange));
    act(() =>
      result.current.setViewState((current) => ({
        ...current,
        target: [12345, current.target[1]],
      })),
    );

    rerender({ deckSize: { width: 500, height: 500 } });
    act(() =>
      result.current.fitToRanges(xRange, yRange, {
        x: "if-unmoved",
        y: "skip",
      }),
    );
    expect(result.current.viewState.target[0]).toBe(12345);
    act(() => result.current.zoomReset());

    expect(result.current.viewState.target).toEqual([400, 1200]);
    expect(zoomOf(result.current.viewState.zoom)[0]).toBeCloseTo(-1, 10);
    expect(result.current.viewState["browser-main"]?.target).toEqual([0, 1200]);
  });

  it.each([
    { width: NaN, height: 500 },
    { width: 1000, height: NaN },
    { width: 0, height: 500 },
    { width: 1000, height: 0 },
  ])("rejects an invalid deck size: %o", (invalidSize) => {
    const { result } = renderView(settings, invalidSize);
    const before = result.current.viewState;

    let fitted: boolean | undefined;
    act(() => {
      fitted = result.current.fitToRanges(xRange, yRange);
    });

    expect(fitted).toBe(false);
    expect(result.current.viewState).toBe(before);
  });

  it("rejects degenerate ranges", () => {
    const { result } = renderView(settings, deckSize);
    const before = result.current.viewState;

    act(() => {
      expect(
        result.current.fitToRanges({ min: 5, max: 5, robust_max: 5 }, yRange),
      ).toBe(false);
      expect(result.current.fitToRanges(xRange, { min: 0, max: 0 })).toBe(
        false,
      );
    });

    expect(result.current.viewState).toBe(before);
  });

  it("uses the default reset before fitting", () => {
    const { result } = renderView(settings, deckSize);
    act(() => result.current.zoomReset());

    expect(result.current.viewState.zoom).toEqual([0, -2]);
  });
});
