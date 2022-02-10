/// app.js
import React, { useState, useCallback, useRef } from "react";
import DeckGL from "@deck.gl/react";
import useLayers from "./hooks/useLayers";
import { ClipLoader } from "react-spinners";

import Spinner from "./components/Spinner";
import {
  BiZoomIn,
  BiZoomOut,
  BiCamera,
  BiMoveVertical,
  BiMoveHorizontal,
} from "react-icons/bi";
import useSnapshot from "./hooks/useSnapshot";
import NodeHoverTip from "./components/NodeHoverTip";

function Deck({
  data,
  search,
  progress,
  spinnerShown,
  view,
  colorHook,
  colorBy,
  hoverDetails,
}) {
  const deckRef = useRef();
  const snapshot = useSnapshot(deckRef);
  const no_data = !data.data || !data.data.nodes || !data.data.nodes.length;

  const {
    viewState,

    onViewStateChange,
    views,
    zoomIncrement,
    onAfterRender,
    zoomAxis,
    setZoomAxis,
  } = view;

  const onClickOrMouseMove = useCallback((ev) => {
    // console.log("onClickOrMouseMove", ev);
  }, []);
  const [hoverInfo, setHoverInfoRaw] = useState(null);
  const setHoverInfo = useCallback(
    (info) => {
      setHoverInfoRaw(info);

      if (info && info.object) {
        hoverDetails.getNodeDetails(info.object.node_id);
      } else {
        hoverDetails.clearNodeDetails();
      }
    },
    [hoverDetails]
  );

  const { layers, layerFilter } = useLayers(
    data,
    search,
    viewState,
    colorHook,
    setHoverInfo,
    colorBy
  );
  // console.log("deck refresh");

  return (
    <div
      className="w-full h-full relative"
      onClick={onClickOrMouseMove}
      onPointerMove={onClickOrMouseMove}
      onPointerDown={onClickOrMouseMove}
    >
      {no_data && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <ClipLoader size={150} color={"#aaaaaa"} loading={true} />
        </div>
      )}{" "}
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
        <NodeHoverTip
          hoverInfo={hoverInfo}
          hoverDetails={hoverDetails}
          colorHook={colorHook}
          colorBy={colorBy}
        />
        <div style={{ position: "absolute", right: "0.2em", bottom: "0.2em" }}>
          {data.status === "loading" && (
            <div className="mr-4 inline-block">
              <ClipLoader size={24} color="#444444" />
            </div>
          )}

          <button
            className=" w-12 h-10 bg-gray-100  mr-1 p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
            onClick={() => {
              setZoomAxis(zoomAxis === "X" ? "Y" : "X");
            }}
          >
            {zoomAxis === "Y" ? (
              <BiMoveVertical
                className="mx-auto  w-5 h-5 "
                title="Switch to horizontal zoom"
              />
            ) : (
              <BiMoveHorizontal
                className="mx-auto  w-5 h-5 "
                title="Switch to vertical zoom"
              />
            )}
          </button>
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
