import { useState, useMemo, useCallback, useRef } from "react";
import { OrthographicView, OrthographicController } from "@deck.gl/core";
import type { OrthographicViewProps } from "@deck.gl/core";
import type { Settings } from "../types/settings";
import type { DeckSize } from "../types/common";
import type { SubViewState, ViewState } from "../types/view";
import type { XRange, YRange } from "../types/backend";

interface ViewStateChangeParameters<ViewStateT> {
  viewId: string;
  viewState: ViewStateT;
  interactionState: Record<string, unknown>;
  oldViewState?: ViewStateT;
}

interface StyledViewProps extends OrthographicViewProps {
  borderWidth?: string;
}

const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// Percentages of the deck that each view occupies.
const MINIMAP_WIDTH = 20;
const MINIMAP_HEIGHT = 35;
const MAIN_WIDTH_WITH_TREENOME = 40;

// Proportion of each axis that the fitted tree fills, the rest being blank
// space split between the two edges. x is deliberately roomier than y.
const X_FILL_FRACTION = 0.8;
const Y_FILL_FRACTION = 0.96;

const defaultMinimapViewState: SubViewState = {
  zoom: -3,
  target: [250, 1000],
};

// Zoom level at which a range of `span` world units covers the given
// proportion of `pixels` pixels.
const zoomToFit = (pixels: number, span: number, fill: number) =>
  Math.log2((pixels * fill) / span);

const defaultViewState: ViewState = {
  zoom: [0, -2],
  target: [window.screen.width < 600 ? 500 : 1400, 1000],
  pitch: 0,
  bearing: 0,
  minimap: defaultMinimapViewState,
};

type ViewStateType = ViewState;

interface UseViewProps {
  settings: Settings;
  deckSize: DeckSize | null;
  mouseDownIsMinimap: boolean;
}

const useView = ({ settings, deckSize, mouseDownIsMinimap }: UseViewProps) => {
  const [viewState, setViewState] = useState<ViewStateType>(defaultViewState);
  const [mouseXY, setMouseXY] = useState([0, 0]);
  const [zoomAxis, setZoomAxis] = useState("Y");

  // The minimap always shows the whole tree, so its view state is not the
  // user's to change. It is kept in a ref because onViewStateChange has to
  // reapply it on every interaction without being re-created each time.
  const minimapViewState = useRef<SubViewState>(defaultMinimapViewState);

  // The current view state, readable from callbacks that must not depend on
  // it (a dependency on it would re-create them on every pan and zoom).
  const viewStateRef = useRef<ViewStateType>(viewState);
  viewStateRef.current = viewState;

  // What the tree was last fitted to, so that resetting the zoom goes back to
  // the whole tree rather than to a hardcoded guess.
  const fittedView = useRef<{
    zoom: [number, number];
    target: [number, number];
  } | null>(null);

  const baseViewState = useMemo(() => ({ ...viewState }), [viewState]);

  const controllerProps = useMemo(
    () => ({
      type: OrthographicController,
      scrollZoom: true,
      zoomAxis: "Y",
    }),
    []
  );

  const views = useMemo(() => {
    const vs = [];
    if (settings.minimapEnabled && !settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "minimap",
          x: `${99 - MINIMAP_WIDTH}%`,
          y: "1%",
          width: `${MINIMAP_WIDTH}%`,
          height: `${MINIMAP_HEIGHT}%`,
          borderWidth: "1px",
          controller: controllerProps,
        } as StyledViewProps)
      );
    }
    if (settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "browser-axis",
          controller: false,
          x: `${MAIN_WIDTH_WITH_TREENOME}%`,
          y: "0%",
          width: `${100 - MAIN_WIDTH_WITH_TREENOME}%`,
        } as StyledViewProps),
        new OrthographicView({
          id: "browser-main",
          controller: controllerProps,
          x: `${MAIN_WIDTH_WITH_TREENOME}%`,
          width: `${100 - MAIN_WIDTH_WITH_TREENOME}%`,
        } as StyledViewProps)
      );
    }
    vs.push(
      new OrthographicView({
        id: "main",
        controller: controllerProps,
        width: settings.treenomeEnabled
          ? `${MAIN_WIDTH_WITH_TREENOME}%`
          : "100%",
        initialViewState: viewState,
      } as StyledViewProps)
    );
    if (settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "main-overlay",
          controller: controllerProps,
          width: "100%",
          initialViewState: viewState,
        } as StyledViewProps)
      );
    }
    return vs;
  }, [controllerProps, viewState, settings]);

  const onViewStateChange = useCallback(
    ({ viewState: newViewState, viewId, requestIsFromMinimapPan }: ViewStateChangeParameters<ViewStateType> & { requestIsFromMinimapPan?: boolean }) => {
      if (mouseDownIsMinimap && !requestIsFromMinimapPan) {
        return false;
      }

      newViewState.minimap = minimapViewState.current;
      newViewState["browser-main"] = {
        zoom: [
          -3,
          Array.isArray(newViewState.zoom)
            ? newViewState.zoom[1]
            : (newViewState.zoom as number),
        ],
        target: [0, (newViewState as any).target[1]],
      };
      setViewState(newViewState);

      return newViewState;
    },
    [mouseDownIsMinimap]
  );

  const zoomIncrement = useCallback(
    (increment: number, axis: string | undefined = zoomAxis) => {
        setViewState((vs: ViewStateType) => {
          const newZoom = [...(vs.zoom as [number, number])];
          if (axis === "X") {
            newZoom[0] = newZoom[0] + increment;
          } else if (axis === "Y") {
            newZoom[1] = newZoom[1] + increment;
          } else {
            newZoom[0] = newZoom[0] + increment;
            newZoom[1] = newZoom[1] + increment;
          }
          return { ...vs, zoom: newZoom } as ViewStateType;
        });
    },
    [zoomAxis]
  );

  // Fit the main view and the minimap to the extent of the tree. With
  // onlyIfUnmoved the fit is skipped if the user has panned or zoomed since
  // the last fit.
  const fitToRanges = useCallback(
    (
      xRange: XRange,
      yRange: YRange,
      { onlyIfUnmoved = false }: { onlyIfUnmoved?: boolean } = {}
    ) => {
      if (!deckSize || !deckSize.width || isNaN(deckSize.width)) {
        return;
      }
      const xSpan = xRange.robust_max - xRange.min;
      const ySpan = yRange.max - yRange.min;
      if (!(xSpan > 0) || !(ySpan > 0)) {
        return;
      }

      const current = viewStateRef.current;
      const previous = fittedView.current;
      if (onlyIfUnmoved && previous) {
        const zoom = current.zoom as [number, number];
        const moved =
          zoom[0] !== previous.zoom[0] ||
          zoom[1] !== previous.zoom[1] ||
          current.target[0] !== previous.target[0] ||
          current.target[1] !== previous.target[1];
        if (moved) {
          return;
        }
      }

      const mainWidth = settings.treenomeEnabled
        ? (deckSize.width * MAIN_WIDTH_WITH_TREENOME) / 100
        : deckSize.width;
      const target: [number, number] = [
        (xRange.min + xRange.robust_max) / 2,
        (yRange.min + yRange.max) / 2,
      ];
      fittedView.current = {
        zoom: [
          zoomToFit(mainWidth, xSpan, X_FILL_FRACTION),
          zoomToFit(deckSize.height, ySpan, Y_FILL_FRACTION),
        ],
        target,
      };
      minimapViewState.current = {
        zoom: [
          zoomToFit(
            (deckSize.width * MINIMAP_WIDTH) / 100,
            xSpan,
            X_FILL_FRACTION
          ),
          zoomToFit(
            (deckSize.height * MINIMAP_HEIGHT) / 100,
            ySpan,
            Y_FILL_FRACTION
          ),
        ],
        target,
      };

      // Routed through onViewStateChange so that the views that follow the
      // main one (the minimap, and the treenome browser's rows) are brought
      // along with it.
      onViewStateChange({
        viewId: "main",
        interactionState: {},
        viewState: { ...current, ...fittedView.current },
      });
    },
    [deckSize, settings.treenomeEnabled, onViewStateChange]
  );

  const zoomReset = useCallback(() => {
    setViewState({
      ...defaultViewState,
      ...fittedView.current,
      minimap: minimapViewState.current,
    });
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
    fitToRanges,
    xzoom: 0,
    mouseXY,
    setMouseXY,
    baseViewState,
    zoomReset,
  };
};

export default useView;

export interface View {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  onViewStateChange: any;
  views: any;
  zoomAxis: string;
  setZoomAxis: React.Dispatch<React.SetStateAction<string>>;
  modelMatrix: number[];
  zoomIncrement: (increment: number, axis?: string) => void;
  fitToRanges: (
    xRange: XRange,
    yRange: YRange,
    options?: { onlyIfUnmoved?: boolean }
  ) => void;
  xzoom: number;
  mouseXY: number[];
  setMouseXY: React.Dispatch<React.SetStateAction<number[]>>;
  baseViewState: ViewState;
  zoomReset: () => void;
}
