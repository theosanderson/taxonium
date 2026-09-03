import { useState, useMemo, useCallback, useRef } from "react";
import { OrthographicView, OrthographicController } from "@deck.gl/core";
import type { OrthographicViewProps } from "@deck.gl/core";
import type { Settings } from "../types/settings";
import type { DeckSize } from "../types/common";
import type { SubViewState, ViewState } from "../types/view";

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

// Fractions of the deck that each view occupies. These must match the
// OrthographicView definitions below.
const MINIMAP_WIDTH_FRACTION = 0.2;
const MINIMAP_HEIGHT_FRACTION = 0.35;
const MAIN_WIDTH_FRACTION_WITH_TREENOME = 0.4;

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
    xZoom: number;
    xTarget: number;
    yZoom: number | null;
    yTarget: number | null;
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
          x: "79%",
          y: "1%",
          width: "20%",
          height: "35%",
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
          x: "40%",
          y: "0%",
          width: "60%",
        } as StyledViewProps),
        new OrthographicView({
          id: "browser-main",
          controller: controllerProps,
          x: "40%",
          width: "60%",
        } as StyledViewProps)
      );
    }
    vs.push(
      new OrthographicView({
        id: "main",
        controller: controllerProps,
        width: settings.treenomeEnabled ? "40%" : "100%",
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

  // Fit the view (main and minimap) to the extent of the tree. Neither axis
  // has a fixed scale -- x is branch length in whatever units the tree was
  // built with, and y is spread over a range that depends on how many nodes
  // there are -- so the only way to know how far to zoom out is to be told
  // the range the data covers.
  //
  // With onlyIfUnmoved the fit is abandoned if the view is no longer where
  // the last fit left it, i.e. if the user has panned or zoomed themselves.
  const fitToRanges = useCallback(
    (
      xRange: { min: number; robust_max: number },
      yRange?: { min: number; max: number },
      { onlyIfUnmoved = false }: { onlyIfUnmoved?: boolean } = {}
    ) => {
      if (!deckSize || !deckSize.width || isNaN(deckSize.width)) {
        return;
      }
      const xSpan = xRange.robust_max - xRange.min;
      if (!(xSpan > 0)) {
        return;
      }
      const xCentre = (xRange.min + xRange.robust_max) / 2;
      const mainWidth = settings.treenomeEnabled
        ? deckSize.width * MAIN_WIDTH_FRACTION_WITH_TREENOME
        : deckSize.width;
      const xZoom = zoomToFit(mainWidth, xSpan, X_FILL_FRACTION);

      // The y extent is optional: a backend may report the x extent alone.
      const yFit =
        yRange && yRange.max > yRange.min
          ? {
              span: yRange.max - yRange.min,
              centre: (yRange.min + yRange.max) / 2,
              zoom: zoomToFit(
                deckSize.height,
                yRange.max - yRange.min,
                Y_FILL_FRACTION
              ),
            }
          : null;

      const minimap: SubViewState = yFit
        ? {
            zoom: [
              zoomToFit(
                deckSize.width * MINIMAP_WIDTH_FRACTION,
                xSpan,
                X_FILL_FRACTION
              ),
              zoomToFit(
                deckSize.height * MINIMAP_HEIGHT_FRACTION,
                yFit.span,
                Y_FILL_FRACTION
              ),
            ] as [number, number],
            target: [xCentre, yFit.centre] as [number, number],
          }
        : minimapViewState.current;

      const previous = fittedView.current;
      const current = viewStateRef.current;
      if (onlyIfUnmoved && previous) {
        const currentZoom = current.zoom as [number, number];
        const moved =
          currentZoom[0] !== previous.xZoom ||
          current.target[0] !== previous.xTarget ||
          (previous.yZoom !== null && currentZoom[1] !== previous.yZoom) ||
          (previous.yTarget !== null && current.target[1] !== previous.yTarget);
        if (moved) {
          return;
        }
      }

      fittedView.current = {
        xZoom,
        xTarget: xCentre,
        yZoom: yFit ? yFit.zoom : null,
        yTarget: yFit ? yFit.centre : null,
      };
      minimapViewState.current = minimap;

      // Routed through onViewStateChange so that the views that follow the
      // main one (the minimap, and the treenome browser's rows) are brought
      // along with it.
      onViewStateChange({
        viewId: "main",
        interactionState: {},
        oldViewState: current,
        viewState: {
          ...current,
          zoom: [
            xZoom,
            yFit ? yFit.zoom : (current.zoom as [number, number])[1],
          ] as [number, number],
          target: [xCentre, yFit ? yFit.centre : current.target[1]] as [
            number,
            number
          ],
        },
      });
    },
    [deckSize, settings.treenomeEnabled, onViewStateChange]
  );

  const zoomReset = useCallback(() => {
    const reset: ViewStateType = {
      ...defaultViewState,
      minimap: minimapViewState.current,
    };
    if (fittedView.current) {
      reset.zoom = [
        fittedView.current.xZoom,
        fittedView.current.yZoom ??
          (defaultViewState.zoom as [number, number])[1],
      ];
      reset.target = [
        fittedView.current.xTarget,
        fittedView.current.yTarget ?? defaultViewState.target[1],
      ] as [number, number];
    }
    setViewState(reset);
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
    xRange: { min: number; robust_max: number },
    yRange?: { min: number; max: number },
    options?: { onlyIfUnmoved?: boolean }
  ) => void;
  xzoom: number;
  mouseXY: number[];
  setMouseXY: React.Dispatch<React.SetStateAction<number[]>>;
  baseViewState: ViewState;
  zoomReset: () => void;
}
