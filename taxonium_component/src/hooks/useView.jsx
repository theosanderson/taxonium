import { useState, useMemo, useCallback } from "react";
import { OrthographicView, OrthographicController } from "@deck.gl/core";

const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const defaultViewState = {
  zoom: -2,
  target: [window.screen.width < 600 ? 500 : 1400, 1000],
  pitch: 0,
  bearing: 0,
  minimap: { zoom: -3, target: [250, 1000] },
  "browser-main": { zoom: -2, target: [0, 1000] },
  "browser-axis": { zoom: -2, target: [0, 1000] },
};

const useView = ({ settings }) => {
  const [viewState, setViewState] = useState(defaultViewState);
  const [mouseXY, setMouseXY] = useState([0, 0]);
  const [zoomAxis, setZoomAxis] = useState("Y");

  const baseViewState = useMemo(() => ({ ...viewState }), [viewState]);

  const controllerProps = useMemo(
    () => ({
      type: OrthographicController,
      scrollZoom: true,
    }),
    [],
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
        }),
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
        }),
      );
    }
    vs.push(
      new OrthographicView({
        id: "main",
        controller: controllerProps,
        width: settings.treenomeEnabled ? "40%" : "100%",
        initialViewState: viewState,
      }),
    );
    if (settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "main-overlay",
          controller: controllerProps,
          width: "100%",
          initialViewState: viewState,
        }),
      );
    }
    return vs;
  }, [controllerProps, viewState, settings]);

  const onViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState);
    return newViewState;
  }, []);

  const zoomIncrement = useCallback((increment) => {
    setViewState((vs) => ({ ...vs, zoom: vs.zoom + increment }));
  }, []);

  const zoomReset = useCallback(() => {
    setViewState(defaultViewState);
  }, []);

  return {
    viewState,
    setViewState,
    onViewStateChange,
    views,
    zoomAxis,
    setZoomAxis,
    modelMatrix: identityMatrix,
    zoomIncrement,
    xzoom: 0,
    mouseXY,
    setMouseXY,
    baseViewState,
    zoomReset,
  };
};

export default useView;
