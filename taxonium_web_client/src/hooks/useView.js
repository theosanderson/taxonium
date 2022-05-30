import { useState, useMemo, useCallback } from "react";
import {
  OrthographicView,
  OrthographicController,
  //OrthographicViewport,
} from "@deck.gl/core";

let globalSetZoomAxis = () => {};
class MyOrthographicController extends OrthographicController {
  // on construction
  constructor(props) {
    super(props);
  }
  // Default handler for the `wheel` event.
  onWheel(event) {
    const controlKey =
      event.srcEvent.ctrlKey || event.srcEvent.metaKey || event.srcEvent.altKey;

    if (!this.scrollZoom) {
      return false;
    }
    event.preventDefault();

    const pos = this.getCenter(event);
    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    let { speed = 0.01, smooth = false, zoomAxis = "Y" } = this.scrollZoom;
    if (controlKey) {
      zoomAxis = "X";
      globalSetZoomAxis(zoomAxis);
    }
    const { delta } = event;

    // Map wheel delta to relative scale
    let scale = 2 / (1 + Math.exp(-Math.abs(delta * speed)));
    if (delta < 0 && scale !== 0) {
      scale = 1 / scale;
    }

    const newControllerState = this.controllerState.zoom({ pos, scale });

    let transitionDuration = smooth ? 250 : 1;
    if (zoomAxis === "X") {
      transitionDuration = 0;
    }

    this.updateViewport(
      newControllerState,
      {
        ...this._getTransitionProps({ around: pos }),
        transitionDuration: transitionDuration,
      },
      {
        isZooming: zoomAxis === "Y",
        isPanning: true,
      }
    );

    if (controlKey) {
      zoomAxis = "Y";
      globalSetZoomAxis(zoomAxis);
    }
    return true;
  }

  handleEvent(event) {
    //console.log(event)
    if (event.pointerType === "touch") {
      if(event.type === "pinchmove") {
        if (this.scrollZoom && this.scrollZoom.zoomAxis && this.scrollZoom.zoomAxis === "X") {
          return false;
        
       
        }
    }
  }
    if (event.type === "wheel") {
      const { ControllerState } = this;
      this.controllerState = new ControllerState({
        makeViewport: this.makeViewport,
        ...this.controllerStateProps,
        ...this._state,
      });

      return this.onWheel(event);
    } else {
      super.handleEvent(event);
    }
  }
}

const useView = ({ settings, deckSize }) => {
  const [zoomAxis, setZoomAxis] = useState("Y");
  const [xzoom, setXzoom] = useState(0);
  globalSetZoomAxis = setZoomAxis;

  const [viewState, setViewState] = useState({
    zoom: -2,
    target: [700, 1000],
    pitch: 0,
    bearing: 0,
    minimap: { zoom: -3, target: [250, 1000] },
  });
  //console.log("useView", viewState);

  const views = useMemo(() => {
    return [
      ...[
        new OrthographicView({
          id: "main",
          controller: {
            type: MyOrthographicController,
            scrollZoom: { smooth: true, zoomAxis: zoomAxis, xzoom: xzoom },
          },
          initialViewState: viewState,
        }),
      ],
      ...(settings.minimapEnabled
        ? [
            new OrthographicView({
              id: "minimap",
              x: "79%",
              y: "1%",
              width: "20%",
              height: "35%",
              borderWidth: "1px",
              controller: true,
              // clear: true,
            }),
          ]
        : []),
    ];
  }, [viewState, zoomAxis, settings.minimapEnabled, xzoom]);

  const modelMatrix = useMemo(() => {
    return [
      1 / 2 ** (viewState.zoom - xzoom),
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    ];
  }, [viewState.zoom, xzoom]);

  const onViewStateChange = useCallback(
    ({ viewState, interactionState, viewId, oldViewState, basicTarget }) => {
      if (!deckSize) {
        setTimeout(() => {
          onViewStateChange({
            viewState,
            interactionState,
            viewId,
            oldViewState,
            basicTarget,
          });
        }, 100);
        return;
      }
      // check oldViewState has a initial_xzoom property or set it to initial_xzoom
      if (viewId === "minimap") {
        return;
      }

      //const temp_viewport = new OrthographicViewport(viewS
      const oldScaleY = 2 ** oldViewState.zoom;
      const newScaleY = 2 ** viewState.zoom;
      // eslint-disable-line no-unused-vars
      const oldScaleX = 2 ** xzoom;
      let newScaleX = 2 ** xzoom;

      if (basicTarget) {
        viewState.target[0] = (viewState.target[0] / newScaleY) * newScaleX;
      } else {
        if (oldScaleY !== newScaleY) {
          if (zoomAxis === "Y") {
            viewState.target[0] =
              (oldViewState.target[0] / newScaleY) * oldScaleY;
          } else {
            const difference = viewState.zoom - oldViewState.zoom;

            setXzoom((old) => old + difference);

            newScaleX = 2 ** (xzoom + difference);

            viewState.zoom = oldViewState.zoom;
            viewState.target[0] =
              (oldViewState.target[0] / oldScaleY) * newScaleY;
          }
        }
      }

      viewState.target = [...viewState.target];

      viewState.real_height = deckSize.height / newScaleY;
      viewState.real_width = deckSize.width / newScaleX;

      viewState.real_target = [...viewState.target];
      viewState.real_target[0] =
        (viewState.real_target[0] * newScaleY) / newScaleX;

      const nw = [
        viewState.real_target[0] - viewState.real_width / 2,
        viewState.real_target[1] - viewState.real_height / 2,
      ];
      const se = [
        viewState.real_target[0] + viewState.real_width / 2,
        viewState.real_target[1] + viewState.real_height / 2,
      ];

      viewState.min_x = nw[0];
      viewState.max_x = se[0];
      viewState.min_y = nw[1];
      viewState.max_y = se[1];

      viewState["minimap"] = { zoom: -3, target: [250, 1000] };

      setViewState(viewState);
      return viewState;
    },
    [zoomAxis, xzoom, deckSize]
  );

  const zoomIncrement = useCallback(
    (increment) => {
      const newViewState = { ...viewState };
      newViewState.zoom += increment;

      onViewStateChange({
        viewState: newViewState,
        interactionState: "isZooming",
        oldViewState: viewState,
      });
    },
    [viewState, onViewStateChange]
  );

  const output = useMemo(() => {
    return {
      viewState,

      onViewStateChange,
      views,
      zoomAxis,
      setZoomAxis,
      modelMatrix,
      zoomIncrement,
      xzoom,
    };
  }, [
    viewState,

    onViewStateChange,
    views,
    zoomAxis,
    setZoomAxis,
    modelMatrix,
    zoomIncrement,
    xzoom,
  ]);

  return output;
};

export default useView;
