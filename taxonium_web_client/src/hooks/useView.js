import { useState, useMemo, useCallback } from "react";
import {
  OrthographicView,
  OrthographicController,
  //OrthographicViewport,
} from "@deck.gl/core";
class MyOrthographicController extends OrthographicController {
  // on construction
  constructor(props) {
    console.log("MyOrthographicController.constructor");
    super(props);
  }
  // Default handler for the `wheel` event.
  onWheel(event) {
    if (!this.scrollZoom) {
      return false;
    }
    event.preventDefault();

    const pos = this.getCenter(event);
    if (!this.isPointInBounds(pos, event)) {
      return false;
    }

    const { speed = 0.01, smooth = false, zoomAxis = "Y" } = this.scrollZoom;
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
    console.log("zoomAxis:", zoomAxis);

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
    return true;
  }

  handleEvent(event) {
    // console.log("event:", event);
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

const useView = ({ minimapEnabled, deckSize }) => {
  const [zoomAxis, setZoomAxis] = useState("Y");
  const [xzoom, setXzoom] = useState(0);

  const [viewState, setViewState] = useState({
    zoom: 0,
    target: [0, 0],
    pitch: 0,
    bearing: 0,
  });

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
      ...(minimapEnabled
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
  }, [viewState, zoomAxis, minimapEnabled, xzoom]);

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
      // check oldViewState has a initial_xzoom property or set it to initial_xzoom
      if (viewId === "minimap") {
        return;
      }

      

      //const temp_viewport = new OrthographicViewport(viewS
      const oldScaleY = 2 ** oldViewState.zoom;
      const newScaleY = 2 ** viewState.zoom;
      const oldScaleX = 2 ** xzoom;
      let newScaleX = 2 ** xzoom;

      //console.log("old",oldViewState)

      if(basicTarget){
        console.log("BASIC", viewState.target)
        viewState.target[0] = viewState.target[0] / newScaleY * newScaleX;
      }
      else{
      
      if (oldScaleY !== newScaleY) {
        if (zoomAxis === "Y") {
          viewState.target[0] =
            (oldViewState.target[0] / newScaleY) * oldScaleY;
        } else {
          const difference = viewState.zoom - oldViewState.zoom;

          setXzoom((old) => old + difference);

          newScaleX = 2 ** (xzoom + difference);
          console.log(xzoom, difference, newScaleX);
          viewState.zoom = oldViewState.zoom;
          viewState.target[0] =
            (oldViewState.target[0] / oldScaleY) * newScaleY;
        }
      }
    }

      viewState.target = [...viewState.target];
      console.log("DECKSIZE:", deckSize);
      viewState.real_height = deckSize.height / newScaleY;
      viewState.real_width = deckSize.width / newScaleX;
      console.log("real_height:", viewState.real_height);
      console.log("real_width:", viewState.real_width);

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
      console.log("FINAL VS:", viewState);
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
      xzoom
    };
  }, [
    viewState,

    onViewStateChange,
    views,
    zoomAxis,
    setZoomAxis,
    modelMatrix,
    zoomIncrement,
    xzoom
  ]);

  return output;
};

export default useView;
