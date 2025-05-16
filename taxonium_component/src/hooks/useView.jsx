import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  OrthographicView,
  OrthographicController,
} from "@deck.gl/core";

let globalSetZoomAxis = () => {};
const defaultViewState = {
  zoom: -2,
  target: [window.screen.width < 600 ? 500 : 1400, 1000],
  pitch: 0,
  bearing: 0,
  minimap: { zoom: -3, target: [250, 1000] },
  "browser-main": { zoom: -2, target: [0, 1000] },
  "browser-axis": { zoom: -2, target: [0, 1000] },
};

const useView = ({
  settings,
  deckSize,
  deckRef,
  jbrowseRef,
  mouseDownIsMinimap,
}) => {
  const [zoomAxis, setZoomAxis] = useState("Y");
  const [xzoom, setXzoom] = useState(window.screen.width < 600 ? -1 : 0);
  const [viewState, setViewState] = useState(defaultViewState);
  const [mouseXY, setMouseXY] = useState([0, 0]);

  // expose setter
  globalSetZoomAxis = setZoomAxis;

  // side-effect for treenomeEnabled toggling xzoom
  useEffect(() => {
    setXzoom(
      window.screen.width < 600 ? -1 : settings.treenomeEnabled ? -1 : 0
    );
  }, [settings.treenomeEnabled]);

  // --- Refs to hold latest values for callbacks ---
  const zoomAxisRef = useRef(zoomAxis);
  const xzoomRef = useRef(xzoom);
  const viewStateRef = useRef(viewState);
  const mouseXYRef = useRef(mouseXY);
  const deckSizeRef = useRef(deckSize);

  useEffect(() => { zoomAxisRef.current = zoomAxis; }, [zoomAxis]);
  useEffect(() => { xzoomRef.current = xzoom; }, [xzoom]);
  useEffect(() => { viewStateRef.current = viewState; }, [viewState]);
  useEffect(() => { mouseXYRef.current = mouseXY; }, [mouseXY]);
  useEffect(() => { deckSizeRef.current = deckSize; }, [deckSize]);

  // baseViewState memo
  const baseViewState = useMemo(() => ({
    ...viewState,
    "browser-main": { zoom: 0, target: [0, 0] },
    "browser-axis": { zoom: 0, target: [0, 0] },
  }), [viewState]);

  // controllerProps memo
  const controllerProps = useMemo(
    () => ({ type: OrthographicController, zoomAxis,
      scrollZoom: true, smooth: true, doubleClickZoom: false,
     }),
    [zoomAxis]
  );

  // views memo
  const views = useMemo(() => {
    const vs = [];
    if (settings.minimapEnabled && !settings.treenomeEnabled) {
      vs.push(new OrthographicView({
        id: "minimap",
        x: "79%",
        y: "1%",
        width: "20%",
        height: "35%",
        borderWidth: "1px",
        controller: controllerProps,
      }));
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

  // modelMatrix memo
  const modelMatrix = useMemo(() => [
    1 / 2 ** (viewState.zoom - xzoom), 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ], [viewState.zoom, xzoom]);

  // onViewStateChange using refs
  const onViewStateChange = useCallback(({
    viewState: newViewState,
    interactionState,
    viewId,
    oldViewState,
    basicTarget,
    overrideZoomAxis,
    specialMinimap,
  }) => {
    const dz = deckSizeRef.current;
    if (!dz) return;

    const localZoomAxis = overrideZoomAxis || zoomAxisRef.current;
    if (viewId === "minimap") return;

    const oldScaleY = 2 ** oldViewState.zoom;
    const newScaleY = 2 ** newViewState.zoom;
    if (mouseDownIsMinimap && !specialMinimap && oldScaleY === newScaleY) {
      return;
    }

    let newScaleX = 2 ** xzoomRef.current;
    if (basicTarget) {
      newViewState.target[0] =
        (newViewState.target[0] / newScaleY) * newScaleX;
    } else if (oldScaleY !== newScaleY) {
      if (localZoomAxis === "Y") {
        newViewState.target[0] =
          (oldViewState.target[0] / newScaleY) * oldScaleY;
      } else {
        const diff = newViewState.zoom - oldViewState.zoom;
        setXzoom((old) => old + diff);
        newScaleX = 2 ** (xzoomRef.current + diff);
        newViewState.zoom = oldViewState.zoom;
        newViewState.target[0] =
          (oldViewState.target[0] / oldScaleY) * newScaleY;
      }
    }

    newViewState.target = [...newViewState.target];
    newViewState.real_height = dz.height / newScaleY;
    newViewState.real_width = dz.width / newScaleX;
    newViewState.real_target = [...newViewState.target];
    newViewState.real_target[0] =
      (newViewState.real_target[0] * newScaleY) / newScaleX;

    const nw = [
      newViewState.real_target[0] - newViewState.real_width / 2,
      newViewState.real_target[1] - newViewState.real_height / 2,
    ];
    const se = [
      newViewState.real_target[0] + newViewState.real_width / 2,
      newViewState.real_target[1] + newViewState.real_height / 2,
    ];
    newViewState.min_x = nw[0];
    newViewState.max_x = se[0];
    newViewState.min_y = nw[1];
    newViewState.max_y = se[1];
    newViewState.minimap = { zoom: -3, target: [250, 1000] };

    if (jbrowseRef.current) {
      const yBound = jbrowseRef.current.children[0].children[0].clientHeight;
      const xBound = jbrowseRef.current.children[0].children[0]
        .offsetParent.offsetParent.offsetLeft;
      const [mx, my] = mouseXYRef.current;
      if ((mx > xBound && my < yBound) || mx < 0 || my < 0) {
        if (!basicTarget && viewId) return;
      }
    }

    if (viewId === "main" || viewId === "main-overlay" || !viewId) {
      newViewState["browser-main"] = {
        ...viewStateRef.current["browser-main"],
        zoom: newViewState.zoom,
        target: [
          viewStateRef.current["browser-main"].target[0],
          newViewState.target[1]
        ],
      };
    }

    setViewState(newViewState);
    return newViewState;
  }, [jbrowseRef, mouseDownIsMinimap]);

  const zoomIncrement = useCallback((increment, overrideZoomAxis) => {
    const newVS = { ...viewStateRef.current };
    newVS.zoom += increment;
    onViewStateChange({
      viewState: newVS,
      interactionState: "isZooming",
      oldViewState: viewStateRef.current,
      overrideZoomAxis,
    });
  }, [onViewStateChange]);

  const zoomReset = useCallback(() => {
    const newVS = { ...defaultViewState };
    setXzoom(0);
    setViewState(newVS);
    onViewStateChange({
      viewState: newVS,
      interactionState: "isZooming",
      oldViewState: newVS,
    });
  }, [onViewStateChange]);

  return useMemo(() => ({
    viewState,
    setViewState,
    onViewStateChange,
    views,
    zoomAxis,
    setZoomAxis,
    modelMatrix,
    zoomIncrement,
    xzoom,
    mouseXY,
    setMouseXY,
    baseViewState,
    zoomReset,
  }), [
    viewState,
    onViewStateChange,
    views,
    zoomAxis,
    modelMatrix,
    zoomIncrement,
    xzoom,
    mouseXY,
    baseViewState,
    zoomReset,
  ]);
};

export default useView;
