import { useState, useMemo } from "react";
import {
  OrthographicView,
  //OrthographicViewport,
} from "@deck.gl/core";

const useView = () => {
  const [zoomAxis, setZoomAxis] = useState("a");
  const [viewState, setViewState] = useState({
    zoom: 0,
    target: [0,0],
    pitch: 0,
    bearing: 0,
  });


  const views = useMemo(() => {


    return [
      new OrthographicView({
        id: "main",
        controller: {
          inertia: true,
          zoomAxis: zoomAxis,
        },
        initialViewState: viewState,
      }),
    ];
  }, [viewState, zoomAxis]);

  const modelMatrix = useMemo(() => {
    return  [1, 0, 0, 0, 0, 1/2 ** viewState.zoom, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }, [viewState.zoom]);

  const onViewStateChange = ({ viewState, interactionState, oldViewState }) => {
    /*
    if (window.zoomX) {
      viewState.zoom[1] = oldViewState.zoom[1];
      viewState.target[1] = oldViewState.target[1];
    } else {
      viewState.zoom[0] = oldViewState.zoom[0];
      viewState.target[0] = oldViewState.target[0];
    }

    */
   

    //const temp_viewport = new OrthographicViewport(viewS
    const oldScale = 2**oldViewState.zoom;
    const newScale = 2**viewState.zoom;
    if (oldScale !== newScale) {
      viewState.target[0] = oldViewState.target[0] / newScale * oldScale;
    }

   
    viewState.target= [...viewState.target];

    viewState.real_height = viewState.height / newScale;
    viewState.real_width = viewState.width ;

    

   
    viewState.real_target = [...viewState.target];
    viewState.real_target[0] = viewState.real_target[0] *newScale;


    

    console.log(viewState.real_target);
    console.log("W",viewState.real_width);

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

    console.log(
      viewState.min_y,
      viewState.max_y,
      viewState.min_x,
      viewState.max_x
    );
      
    setViewState(viewState);
    return viewState
  };

  return { viewState, setViewState, onViewStateChange, views, zoomAxis, setZoomAxis, modelMatrix };
};

export default useView;
