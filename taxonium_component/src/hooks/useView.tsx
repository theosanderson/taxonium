import { useState, useMemo, useCallback, useEffect } from "react";
import { OrthographicView, OrthographicController } from "@deck.gl/core";
import type { OrthographicViewProps } from "@deck.gl/core";
import type { Settings } from "../types/settings";
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

// Helper function to calculate dynamic minimap zoom
const calculateMinimapZoom = (deckSize: DeckSize | null): number => {
  if (!deckSize) {
    console.log('MINIMAP_ZOOM: No deck size available, using fallback -4');
    return -4; // Fallback for when deck size isn't available yet
  }
  
  const minimapHeight = deckSize.height * 0.32;
  const treeHeight = 2000; // Reasonable default for most trees
  const dynamicZoom = Math.log2(minimapHeight / treeHeight);
  
  // Ensure we have valid zoom values (between -6 and -2 is reasonable for minimap)
  const clampedZoom = Math.max(-6, Math.min(dynamicZoom, -2));
  
  console.log('MINIMAP_ZOOM: Calculation', {
    deckSize,
    minimapHeight,
    treeHeight,
    dynamicZoom,
    clampedZoom,
    finalZoom: isFinite(clampedZoom) ? clampedZoom : -4
  });
  
  return isFinite(clampedZoom) ? clampedZoom : -4;
};

const getDefaultViewState = (deckSize: DeckSize | null): ViewState => {
  return {
    zoom: [0, -2],
    target: [window.screen.width < 600 ? 500 : 1400, 1000],
    pitch: 0,
    bearing: 0,
    minimap: { zoom: calculateMinimapZoom(deckSize), target: [250, 1000] }
  };
};

type ViewStateType = ViewState;

interface UseViewProps {
  settings: Settings;
  deckSize: DeckSize | null;
  mouseDownIsMinimap: boolean;
}

const useView = ({ settings, deckSize, mouseDownIsMinimap }: UseViewProps) => {
  const [viewState, setViewState] = useState<ViewStateType>(() => getDefaultViewState(deckSize));
  const [mouseXY, setMouseXY] = useState([0, 0]);
  const [zoomAxis, setZoomAxis] = useState("Y");

  // Update minimap zoom when deckSize changes to ensure consistency
  useEffect(() => {
    if (deckSize && !isNaN(deckSize.width) && !isNaN(deckSize.height) && 
        settings.minimapEnabled && viewState.minimap) {
      const newZoom = calculateMinimapZoom(deckSize);
      // Only update if the zoom has actually changed to prevent unnecessary re-renders
      if (Math.abs(newZoom - viewState.minimap.zoom) > 0.001) {
        setViewState(prev => ({
          ...prev,
          minimap: {
            ...prev.minimap,
            zoom: newZoom
          }
        }));
      }
    }
  }, [deckSize?.width, deckSize?.height, settings.minimapEnabled]);

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
      // Use viewState.minimap to ensure consistency with the current state
      const minimapViewState = viewState.minimap || {
        zoom: calculateMinimapZoom(deckSize),
        target: [250, 1000]
      };
      
      vs.push(
        new OrthographicView({
          id: "minimap",
          x: "79%",
          y: "1%",
          width: "20%",
          height: "35%",
          borderWidth: "1px",
          controller: controllerProps,
          initialViewState: minimapViewState,
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
  }, [controllerProps, viewState, settings, deckSize]);

  const onViewStateChange = useCallback(
    ({ viewState: newViewState, viewId, requestIsFromMinimapPan }: ViewStateChangeParameters<ViewStateType> & { requestIsFromMinimapPan?: boolean }) => {
      if (mouseDownIsMinimap && !requestIsFromMinimapPan) {
        return false;
      }

      // Always ensure minimap has consistent zoom based on deck size
      // This handles the case where clicking updates the view state
      const minimapZoom = calculateMinimapZoom(deckSize);
      newViewState.minimap = { 
        zoom: minimapZoom,
        target: viewState.minimap?.target || [250, 1000]
      };
      
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
    [mouseDownIsMinimap, deckSize, viewState.minimap?.target]
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
    setViewState(getDefaultViewState(deckSize));
  }, [deckSize]);

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
