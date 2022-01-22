import { useState, useMemo } from "react";
import {
  OrthographicView,
  OrthographicController,
  //OrthographicViewport,
} from "@deck.gl/core";

const useView = () => {
  const [viewState, setViewState] = useState({
    zoom: [5, -10],
    target: [5, 5],
    pitch: 0,
    bearing: 0,
  });

  const views = useMemo(() => {
    return [
      new OrthographicView({
        id: "main",
        controller: {
          inertia: true,
          zoomAxis: "Y",
        },
        initialViewState: viewState,
      }),
    ];
  }, [viewState]);

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

    viewState.real_height = viewState.height / 2 ** viewState.zoom[1];
    viewState.real_width = viewState.width / 2 ** viewState.zoom[0];

    viewState.fixed_target = [...viewState.target];

    if (viewState.zoom[1] > viewState.zoom[0]) {
      viewState.fixed_target[1] =
        viewState.target[1] / 2 ** (viewState.zoom[1] - viewState.zoom[0]);
    } else {
      viewState.fixed_target[0] =
        viewState.target[0] / 2 ** (viewState.zoom[0] - viewState.zoom[1]);
    }
    console.log(viewState.fixed_target);

    const nw = [
      viewState.fixed_target[0] - viewState.real_width / 2,
      viewState.fixed_target[1] - viewState.real_height / 2,
    ];
    const se = [
      viewState.fixed_target[0] + viewState.real_width / 2,
      viewState.fixed_target[1] + viewState.real_height / 2,
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
  };

  return { viewState, setViewState, onViewStateChange, views };
};

export default useView;
