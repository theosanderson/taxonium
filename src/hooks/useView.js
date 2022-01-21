import { useState, useMemo } from "react";
import { OrthographicView, WebMercatorViewport } from "@deck.gl/core";

const useView = () => {
  const [bounds, setBounds] = useState({});
  console.log(bounds);
  const [viewState, setViewState] = useState({
    longitude: 5,
    latitude: 5,
    zoom: [3, 3],
    pitch: 0,
    bearing: 0,
  });

  const views = useMemo(() => {
    return [new OrthographicView({ id: "main", controller: true })];
  }, []);

  const onViewStateChange = ({ viewState, interactionState, oldViewState }) => {
    console.log("zoom:" + viewState.zoom);
    /*
    if (window.zoomX) {
      viewState.zoom[1] = oldViewState.zoom[1];
      viewState.target[1] = oldViewState.target[1];
    } else {
      viewState.zoom[0] = oldViewState.zoom[0];
      viewState.target[0] = oldViewState.target[0];
    }

    */

    const nw = [
      viewState.target[0] - viewState.width / 2 ** (viewState.zoom[0] + 1),
      viewState.target[1] - viewState.height / 2 ** (viewState.zoom[0] + 1),
    ];
    const se = [
      viewState.target[0] + viewState.width / 2 ** (viewState.zoom[0] + 1),
      viewState.target[1] + viewState.height / 2 ** (viewState.zoom[0] + 1),
    ];

    viewState.min_x = nw[0];
    viewState.max_x = se[0];
    viewState.min_y = nw[1];
    viewState.max_y = se[1];

    setViewState(viewState);
  };

  return { viewState, setViewState, onViewStateChange, views };
};

export default useView;
