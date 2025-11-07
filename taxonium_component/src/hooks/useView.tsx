import { useState, useMemo, useCallback } from "react";
import { OrthographicView, OrthographicController } from "@deck.gl/core";
import type { OrthographicViewProps } from "@deck.gl/core";
import type { Settings } from "../types/settings";
import type { UnifiedSettings } from "../types/unifiedSettings";
import type { DeckSize } from "../types/common";
import type { ViewState } from "../types/view";

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

const defaultViewState: ViewState = {
  zoom: [0, -2],
  target: [window.screen.width < 600 ? 500 : 1400, 1000],
  pitch: 0,
  bearing: 0,
  minimap: { zoom: -3, target: [250, 1000] }
};

type ViewStateType = ViewState;

interface UseViewProps {
  settings: Settings | UnifiedSettings;
  deckSize: DeckSize | null;
  mouseDownIsMinimap: boolean;
}

const useView = ({ settings, deckSize, mouseDownIsMinimap }: UseViewProps) => {
  const [viewState, setViewState] = useState<ViewStateType>(defaultViewState);
  const [mouseXY, setMouseXY] = useState([0, 0]);
  const [zoomAxis, setZoomAxis] = useState("Y");

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

      newViewState.minimap = { zoom: -3, target: [250, 1000] };
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

export interface View {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  onViewStateChange: any;
  views: any;
  zoomAxis: string;
  setZoomAxis: React.Dispatch<React.SetStateAction<string>>;
  modelMatrix: number[];
  zoomIncrement: (increment: number, axis?: string) => void;
  xzoom: number;
  mouseXY: number[];
  setMouseXY: React.Dispatch<React.SetStateAction<number[]>>;
  baseViewState: ViewState;
  zoomReset: () => void;
}
