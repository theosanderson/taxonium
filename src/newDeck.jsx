/// app.js
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import DeckGL from "@deck.gl/react";
import useLayers from "./hooks/useLayers";
import useProcessData from "./hooks/useProcessData";

import Spinner from "./components/Spinner";
import { BiZoomIn, BiZoomOut, BiCamera } from "react-icons/bi";
import useSnapshot from "./hooks/useSnapshot";

function Deck({ data, progress, spinnerShown, view }) {
  const deckRef = useRef();
  const snapshot = useSnapshot(deckRef);
  const {
    viewState,
    setViewState,
    onViewStateChange,
    views,
    zoomIncrement,
    onAfterRender,
  } = view;

  const onClickOrMouseMove = useCallback((ev) => {
    // console.log("onClickOrMouseMove", ev);
  }, []);

  const { layers, layerFilter } = useLayers(data);

  return (
    <div
      className="w-full h-full relative"
      onClick={onClickOrMouseMove}
      onPointerMove={onClickOrMouseMove}
      onPointerDown={onClickOrMouseMove}
    >
      {" "}
      <DeckGL
        pickingRadius={10}
        onAfterRender={onAfterRender}
        ref={deckRef}
        views={views}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layerFilter={layerFilter}
        layers={layers}
      >
        <div style={{ position: "absolute", right: "0.2em", bottom: "0.2em" }}>
          <button
            className=" w-12 h-10 bg-gray-100  mr-1 p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
            onClick={() => {
              snapshot();
            }}
          >
            <BiCamera className="mx-auto  w-5 h-5 " />
          </button>
          <button
            className=" w-12 h-10 bg-gray-100  p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
            onClick={() => {
              zoomIncrement(0.6);
            }}
          >
            <BiZoomIn className="mx-auto  w-5 h-5 " />
          </button>
          <button
            className=" w-12 h-10 bg-gray-100 ml-1 p-1 rounded border-gray-300 text-gray-700  opacity-60  hover:opacity-100"
            onClick={() => {
              zoomIncrement(-0.6);
            }}
          >
            <BiZoomOut className="mx-auto w-5 h-5 " />
          </button>
        </div>
      </DeckGL>
      {spinnerShown && <Spinner isShown={true} progress={progress} />}
    </div>
  );
}

export default Deck;
