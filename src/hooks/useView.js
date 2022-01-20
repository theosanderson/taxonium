import { useState } from "react";

const useView = () => {
  const [viewState, setViewState] = useState({
    zoom: 4.7,
    target: [6, 13],
  });

  return { viewState, setViewState };
};

export default useView;
