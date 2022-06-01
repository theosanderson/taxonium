import { useState, useMemo, useCallback } from "react";
import {
  OrthographicView,
  OrthographicController,
  //OrthographicViewport,
} from "@deck.gl/core";

let globalSetZoomAxis = () => {};
class BrowserController extends OrthographicController {
// on construction
constructor(props) {
  super(props);
}
// Default handler for the `wheel` event.
onWheel(event) {
//  console.log('wheelasdf')

  event.preventDefault();

  return true;
}
}

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
    if (event.pointerType === "touch") {
      if (event.type === "pinchmove") {
        if (
          this.scrollZoom &&
          this.scrollZoom.zoomAxis &&
          this.scrollZoom.zoomAxis === "X"
        ) {
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

const useView = ({ settings, deckSize, deckRef }) => {
  const [zoomAxis, setZoomAxis] = useState("Y");
  const [xzoom, setXzoom] = useState(0);
  globalSetZoomAxis = setZoomAxis;


  // TODO target needs to be [0,0]
  const [viewState, setViewState] = useState({
    zoom: 0,
    target: [0, 0],
    pitch: 0,
    bearing: 0,
    minimap: { zoom: -3, target: [250, 1000] },
    "browser-main": {
      zoom: 0,
      target: [0, 0],
      pitch: 0,
      bearing: 0,
    },
  });
  //console.log("useView", viewState);

  const views = useMemo(() => {
    return [
      ...[
        new OrthographicView({
          id: "main",
          x: -600, // TODO don't do this
          controller: {
            type: MyOrthographicController,
            scrollZoom: { smooth: true, zoomAxis: zoomAxis, xzoom: xzoom },
          },
          initialViewState: viewState,
        }),
      ],
      ...(settings.minimapEnabled && !settings.browserEnabled
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
      ...(settings.browserEnabled
        ? [
          new OrthographicView({
            id: "browser-axis",
            controller: false,
            x: "40%",
            y: "0%",
            width: "60%",
          }),
          new OrthographicView({
            id: "browser-main",
            controller: {
              type: BrowserController,
              doubleClickZoom: false,
            },
            x: "40%",
            width: "60%",
          }),
        ] : []),
    
    ];
  }, [viewState, zoomAxis, settings.minimapEnabled, settings.browserEnabled, xzoom]);

  const [mouseXY, setMouseXY] = useState([0, 0]);

  // TODO this is hack
  const modelMatrix = useMemo(() => {
    return [
      (1 / 2 ** (viewState.zoom - xzoom)), 
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
    ({ viewState : newViewState, interactionState, viewId, oldViewState, basicTarget }) => {

      if (!deckSize) {
        setTimeout(() => {
          onViewStateChange({
            newViewState,
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
      const newScaleY = 2 ** newViewState.zoom;
      // eslint-disable-line no-unused-vars
      const oldScaleX = 2 ** xzoom;
      let newScaleX = 2 ** xzoom;

      if (basicTarget) {
        newViewState.target[0] = (newViewState.target[0] / newScaleY) * newScaleX;
      } else {
        if (oldScaleY !== newScaleY) {
          if (zoomAxis === "Y") {
            newViewState.target[0] =
              (oldViewState.target[0] / newScaleY) * oldScaleY;
          } else {
            const difference = newViewState.zoom - oldViewState.zoom;

            setXzoom((old) => old + difference);

            newScaleX = 2 ** (xzoom + difference);

            newViewState.zoom = oldViewState.zoom;
            newViewState.target[0] =
              (oldViewState.target[0] / oldScaleY) * newScaleY;
          }
        }
      }

      newViewState.target = [...newViewState.target];

      newViewState.real_height = deckSize.height / newScaleY;
      newViewState.real_width = deckSize.width / newScaleX;

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

      newViewState["minimap"] = { zoom: -3, target: [250, 1000] };
      
      // Treenome view state
      if (viewId === "main") {
        newViewState["browser-main"] = {
          ...viewState["browser-main"],
          zoom: newViewState.zoom,
          target: [viewState["browser-main"].target[0], newViewState.target[1]],
        }
      }
      else {
        newViewState = viewState;
      }

      setViewState(newViewState);
      return newViewState;
    },
    [zoomAxis, xzoom, deckSize, viewState]
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
      setViewState,
      onViewStateChange,
      views,
      zoomAxis,
      setZoomAxis,
      modelMatrix,
      zoomIncrement,
      xzoom,
      mouseXY,
      setMouseXY
    };
  }, [
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
    setMouseXY
  ]);

  return output;
};

export default useView;
