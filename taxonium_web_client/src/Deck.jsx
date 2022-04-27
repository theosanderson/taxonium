/// app.js
import React, { useState, useCallback, useRef } from "react";
import DeckGL from "@deck.gl/react";
import useLayers from "./hooks/useLayers";
import { ClipLoader } from "react-spinners";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import {
  BiZoomIn,
  BiZoomOut,
  BiCamera,
  BiMoveVertical,
  BiMoveHorizontal,
} from "react-icons/bi";

import {TiZoom} from "react-icons/ti";
import useSnapshot from "./hooks/useSnapshot";
import NodeHoverTip from "./components/NodeHoverTip";

function Deck({
  data,
  search,

  view,
  colorHook,
  colorBy,
  hoverDetails,
  selectedDetails,
  config,
  statusMessage,
  xAccessor,
}) {
  const deckRef = useRef();
  const snapshot = useSnapshot(deckRef);
  //console.log("DATA is ", data);
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

  const [mouseDownIsMinimap, setMouseDownIsMinimap] = useState(false);

  const onClickOrMouseMove = useCallback(
    (event) => {
      if (event.buttons === 0 && event._reactName === "onPointerMove") {
        return false;
      }

      const pickInfo = deckRef.current.pickObject({
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
        radius: 10,
      });

      if (event._reactName === "onPointerDown") {
        if (pickInfo && pickInfo.viewport.id === "minimap") {
          setMouseDownIsMinimap(true);
        } else {
          setMouseDownIsMinimap(false);
        }
      }
      if (
        pickInfo &&
        pickInfo.viewport.id === "main" &&
        event._reactName === "onClick"
      ) {
        selectedDetails.getNodeDetails(pickInfo.object.node_id);
      }

      if (!pickInfo && event._reactName === "onClick") {
        selectedDetails.clearNodeDetails();
      }

      if (
        pickInfo &&
        pickInfo.viewport.id === "minimap" &&
        mouseDownIsMinimap
      ) {
        onViewStateChange({
          oldViewState: viewState,
          viewState: {
            ...viewState,
            target: [
              pickInfo.coordinate[0] / 2 ** viewState.zoom,
              pickInfo.coordinate[1],
            ],
          },
        });
      }
    },
    [selectedDetails, mouseDownIsMinimap, viewState, onViewStateChange]
  );

  const [hoverInfo, setHoverInfoRaw] = useState(null);
  const setHoverInfo = useCallback(
    (info) => {
      setHoverInfoRaw(info);

      if (info && info.object) {
        hoverDetails.setNodeDetails(info.object);
      } else {
        hoverDetails.clearNodeDetails();
      }
    },
    [hoverDetails]
  );

  const { layers, layerFilter } = useLayers({
    data,
    search,
    viewState,
    colorHook,
    setHoverInfo,
    colorBy,
    xAccessor,
    modelMatrix: view.modelMatrix
  }
    
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
          <div className="text-center">
            {statusMessage && statusMessage.percentage ? (
              <CircularProgressbarWithChildren
                value={statusMessage.percentage}
                strokeWidth={2}
                styles={buildStyles({
                  // Rotation of path and trail, in number of turns (0-1)
                  //rotation: 0.25,

                  // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
                  //  strokeLinecap: 'butt',

                  // Text size
                  textSize: "8px",

                  // How long animation takes to go from one percentage to another, in seconds
                  //pathTransitionDuration: 0.5,

                  // Can specify path transition in more detail, or remove it entirely
                  // pathTransition: 'none',

                  // Colors
                  pathColor: `#666`,
                  textColor: "#666",
                  trailColor: "#d6d6d6",
                })}
              >
                {/* Put any JSX content in here that you'd like. It'll be vertically and horizonally centered. */}

                <div className="text-center text-gray-700  text-lg wt font-medium">
                  {statusMessage && statusMessage.message}
                </div>
              </CircularProgressbarWithChildren>
            ) : (
              <ClipLoader size={100} color={"#666"} />
            )}
          </div>
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
          config={config}
        />
        <div style={{ position: "absolute", right: "0.2em", bottom: "0.2em" }}>
          {data.status === "loading" && (
            <div className="mr-4 inline-block">
              <ClipLoader size={24} color="#444444" />
            </div>
          )}

           <button
            className=" w-16 h-10 bg-gray-100 mr-1 p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
            onClick={() => {
              setZoomAxis(zoomAxis === "X" ? "Y" : "X");
            }}
            title = {zoomAxis === "X" ? "Switch to Y-axis zoom" : "Switch to X-axis zoom"}
          ><TiZoom className = "mx-auto  w-5 h-5 inline-block m-0"  />
            {zoomAxis === "Y" ? (
              <BiMoveVertical
                className="mx-auto  w-5 h-5 inline-block m-0"
               
              />
            ) : (<>
              
                <BiMoveHorizontal
                className="mx-auto  w-5 h-5 inline-block m-0"
              
            /></>
              
            )}
            </button>

          <button
            className=" w-12 h-10 bg-gray-100  mr-1 p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
            onClick={() => {
              snapshot();
            }}
          >
            <BiCamera className="mx-auto  w-5 h-5 inline-block" />
          </button>
          <button
            className=" w-12 h-10 bg-gray-100  p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
            onClick={() => {
              zoomIncrement(0.6);
            }}
          >
            <BiZoomIn className="mx-auto  w-5 h-5 inline-block" />
          </button>
          <button
            className=" w-12 h-10 bg-gray-100 ml-1 p-1 rounded border-gray-300 text-gray-700  opacity-60  hover:opacity-100"
            onClick={() => {
              zoomIncrement(-0.6);
            }}
          >
            <BiZoomOut className="mx-auto w-5 h-5 inline-block" />
          </button>
        </div>
      </DeckGL>
    </div>
  );
}

export default Deck;
