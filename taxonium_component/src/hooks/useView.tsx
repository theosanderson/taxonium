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

const MINIMAP_WIDTH = 20;
const MINIMAP_HEIGHT = 35;
const MAIN_WIDTH_WITH_TREENOME = 40;

const X_FILL_FRACTION = 0.8;
const Y_FILL_FRACTION = 0.96;

const defaultMinimapViewState: SubViewState = {
  zoom: -3,
  target: [250, 1000],
};

const zoomToFit = (pixels: number, span: number, fill: number) =>
  Math.log2((pixels * fill) / span);

type FitMode = "force" | "if-unmoved" | "skip";

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

  const minimapViewState = useRef<SubViewState>(defaultMinimapViewState);

  const viewStateRef = useRef<ViewStateType>(viewState);
  viewStateRef.current = viewState;

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
    [],
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
        } as StyledViewProps),
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
        } as StyledViewProps),
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
      } as StyledViewProps),
    );
    if (settings.treenomeEnabled) {
      vs.push(
        new OrthographicView({
          id: "main-overlay",
          controller: controllerProps,
          width: "100%",
          initialViewState: viewState,
        } as StyledViewProps),
      );
    }
    return vs;
  }, [controllerProps, viewState, settings]);

  const withDependentViews = useCallback((newViewState: ViewStateType) => {
    return {
      ...newViewState,
      minimap: minimapViewState.current,
      "browser-main": {
        zoom: [
          -3,
          Array.isArray(newViewState.zoom)
            ? newViewState.zoom[1]
            : (newViewState.zoom as number),
        ],
        target: [0, (newViewState as any).target[1]],
      },
    } as ViewStateType;
  }, []);

  const onViewStateChange = useCallback(
    ({
      viewState: newViewState,
      requestIsFromMinimapPan,
    }: ViewStateChangeParameters<ViewStateType> & {
      requestIsFromMinimapPan?: boolean;
    }) => {
      if (mouseDownIsMinimap && !requestIsFromMinimapPan) {
        return false;
      }

      const nextViewState = withDependentViews(newViewState);
      setViewState(nextViewState);
      return nextViewState;
    },
    [mouseDownIsMinimap, withDependentViews],
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
        return withDependentViews({ ...vs, zoom: newZoom } as ViewStateType);
      });
    },
    [zoomAxis, withDependentViews],
  );

  const fitToRanges = useCallback(
    (
      xRange: XRange,
      yRange: YRange,
      { x = "force", y = "force" }: { x?: FitMode; y?: FitMode } = {},
    ) => {
      if (
        !deckSize ||
        !Number.isFinite(deckSize.width) ||
        !Number.isFinite(deckSize.height) ||
        deckSize.width <= 0 ||
        deckSize.height <= 0
      ) {
        return false;
      }
      const xSpan = xRange.robust_max - xRange.min;
      const ySpan = yRange.max - yRange.min;
      if (
        !Number.isFinite(xSpan) ||
        !Number.isFinite(ySpan) ||
        xSpan <= 0 ||
        ySpan <= 0
      ) {
        return false;
      }

      const current = viewStateRef.current;
      const previous = fittedView.current;
      const currentZoom = Array.isArray(current.zoom)
        ? current.zoom
        : [current.zoom, current.zoom];
      const xMoved =
        previous !== null &&
        (currentZoom[0] !== previous.zoom[0] ||
          current.target[0] !== previous.target[0]);
      const yMoved =
        previous !== null &&
        (currentZoom[1] !== previous.zoom[1] ||
          current.target[1] !== previous.target[1]);

      const mainWidth = settings.treenomeEnabled
        ? (deckSize.width * MAIN_WIDTH_WITH_TREENOME) / 100
        : deckSize.width;
      const fittedTarget: [number, number] = [
        (xRange.min + xRange.robust_max) / 2,
        (yRange.min + yRange.max) / 2,
      ];
      const nextFittedView = {
        zoom: [
          zoomToFit(mainWidth, xSpan, X_FILL_FRACTION),
          zoomToFit(deckSize.height, ySpan, Y_FILL_FRACTION),
        ] as [number, number],
        target: fittedTarget,
      };
      fittedView.current = nextFittedView;
      minimapViewState.current = {
        zoom: [
          zoomToFit(
            (deckSize.width * MINIMAP_WIDTH) / 100,
            xSpan,
            X_FILL_FRACTION,
          ),
          zoomToFit(
            (deckSize.height * MINIMAP_HEIGHT) / 100,
            ySpan,
            Y_FILL_FRACTION,
          ),
        ],
        target: fittedTarget,
      };

      const applyX = x === "force" || (x === "if-unmoved" && !xMoved);
      const applyY = y === "force" || (y === "if-unmoved" && !yMoved);
      if (applyX || applyY) {
        setViewState(
          withDependentViews({
            ...current,
            zoom: [
              applyX ? nextFittedView.zoom[0] : currentZoom[0],
              applyY ? nextFittedView.zoom[1] : currentZoom[1],
            ],
            target: [
              applyX ? nextFittedView.target[0] : current.target[0],
              applyY ? nextFittedView.target[1] : current.target[1],
            ],
          }),
        );
      }
      return true;
    },
    [
      deckSize?.height,
      deckSize?.width,
      settings.treenomeEnabled,
      withDependentViews,
    ],
  );

  const zoomReset = useCallback(() => {
    setViewState(
      withDependentViews({
        ...defaultViewState,
        ...fittedView.current,
      }),
    );
  }, [withDependentViews]);

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
    options?: { x?: FitMode; y?: FitMode },
  ) => boolean;
  xzoom: number;
  mouseXY: number[];
  setMouseXY: React.Dispatch<React.SetStateAction<number[]>>;
  baseViewState: ViewState;
  zoomReset: () => void;
}
