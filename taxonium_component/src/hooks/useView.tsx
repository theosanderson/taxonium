// @ts-nocheck
import { useState, useMemo, useCallback } from "react";
import { OrthographicView, OrthographicController } from "@deck.gl/core";

const defaultViewState = {
  zoom: [-2, -2],
  target: [window.screen.width < 600 ? 500 : 1400, 1000],
  pitch: 0,
  bearing: 0,
  minimap: { zoom: [-3, -3], target: [250, 1000] },
  "browser-main": { zoom: [-2, -2], target: [0, 1000] },
  "browser-axis": { zoom: [-2, -2], target: [0, 1000] },
};

const useView = ({ settings, deckSize }) => {
  const [viewState, setViewState] = useState(defaultViewState);
  const [mouseXY, setMouseXY] = useState([0, 0]);

  const controllerProps = useMemo(
    () => ({
      type: OrthographicController,
      zoomAxis: "Y",
      scrollZoom: true,
      smooth: true,
      doubleClickZoom: false,
    }),
    []
  );

  const views = useMemo(() => {
    const vs = [];
    if (settings.minimapEnabled && !settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "minimap",
          x: "79%",
          y: "1%",
          width: "20%",
          height: "35%",
          borderWidth: "1px",
          controller: controllerProps,
        })
      );
    }
    if (settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "browser-axis",
          controller: false,
          x: "40%",
          y: "0%",
          width: "60%",
        }),
        new OrthographicView({
          id: "browser-main",
          controller: controllerProps,
          x: "40%",
          width: "60%",
        })
      );
    }
    vs.push(
      new OrthographicView({
        id: "main",
        controller: controllerProps,
        width: settings.treenomeEnabled ? "40%" : "100%",
        initialViewState: viewState,
      })
    );
    if (settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "main-overlay",
          controller: controllerProps,
          width: "100%",
          initialViewState: viewState,
        })
      );
    }
    return vs;
  }, [controllerProps, viewState, settings]);

  const computeBounds = useCallback(
    (vs) => {
      if (!deckSize) return vs;
      const zoom = Array.isArray(vs.zoom) ? vs.zoom : [vs.zoom, vs.zoom];
      const real_width = deckSize.width / 2 ** zoom[0];
      const real_height = deckSize.height / 2 ** zoom[1];
      vs.real_width = real_width;
      vs.real_height = real_height;
      vs.min_x = vs.target[0] - real_width / 2;
      vs.max_x = vs.target[0] + real_width / 2;
      vs.min_y = vs.target[1] - real_height / 2;
      vs.max_y = vs.target[1] + real_height / 2;
      vs.minimap = { zoom: [-3, -3], target: [250, 1000] };
      return vs;
    },
    [deckSize]
  );

  const onViewStateChange = useCallback(
    ({ viewState: newVS }) => {
      const updated = computeBounds({ ...viewState, ...newVS });
      setViewState(updated);
      return updated;
    },
    [computeBounds, viewState]
  );

  const zoomIncrement = useCallback(
    (increment, axis = "Y") => {
      setViewState((prev) => {
        const zoom = Array.isArray(prev.zoom) ? [...prev.zoom] : [prev.zoom, prev.zoom];
        if (axis === "Y") {
          zoom[1] += increment;
        } else {
          zoom[0] += increment;
        }
        return computeBounds({ ...prev, zoom });
      });
    },
    [computeBounds]
  );

  const zoomReset = useCallback(() => {
    setViewState(computeBounds({ ...defaultViewState }));
  }, [computeBounds]);

  const baseViewState = useMemo(
    () => ({
      ...viewState,
      "browser-main": { zoom: [0, 0], target: [0, 0] },
      "browser-axis": { zoom: [0, 0], target: [0, 0] },
    }),
    [viewState]
  );

  return useMemo(
    () => ({
      viewState,
      setViewState,
      onViewStateChange,
      views,
      zoomAxis: "Y",
      zoomIncrement,
      mouseXY,
      setMouseXY,
      baseViewState,
      zoomReset,
    }),
    [viewState, views, zoomIncrement, mouseXY, baseViewState, zoomReset]
  );
};

export default useView;
