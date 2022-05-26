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

import useSnapshot from "./hooks/useSnapshot";
import NodeHoverTip from "./components/NodeHoverTip";
import { DeckButtons } from "./components/DeckButtons";
import DeckSettingsModal from "./components/DeckSettingsModal";
import FirefoxWarning from "./components/FirefoxWarning";

function Deck({
  data,
  search,

  view,
  colorHook,
  colorBy,
  hoverDetails,
  config,
  statusMessage,
  xType,
  settings,
  selectedDetails,
  setDeckSize,
  deckSize,
  isCurrentlyOutsideBounds,
}) {
  const deckRef = useRef();
  const snapshot = useSnapshot(deckRef);
  const [deckSettingsOpen, setDeckSettingsOpen] = useState(false);

  //console.log("DATA is ", data);
  const no_data = !data.data || !data.data.nodes || !data.data.nodes.length;

  const {
    viewState,

    onViewStateChange,
    views,
    zoomIncrement,

    zoomAxis,
    setZoomAxis,
    xzoom,
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
              pickInfo.coordinate[0] / 2 ** (viewState.zoom - xzoom),
              pickInfo.coordinate[1],
            ],
          },
        });
      }
    },
    [selectedDetails, mouseDownIsMinimap, viewState, onViewStateChange, xzoom]
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
    hoverInfo,
    colorBy,
    xType,
    modelMatrix: view.modelMatrix,
    selectedDetails,
    xzoom,
    settings,
    isCurrentlyOutsideBounds,
    config,
  });
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
          <div className="text-center w-60 h-60">
            {statusMessage && statusMessage.percentage ? (
             <> <CircularProgressbarWithChildren
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
             <div className="w-60"> <FirefoxWarning className="font-medium text-gray-700 mt-3" />
             </div></>
            ) : (
              <div className="text-center text-gray-700  text-lg wt font-medium">
                <div>{statusMessage && statusMessage.message}</div>
                <div className="mt-5">
                  <ClipLoader size={100} color={"#666"} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}{" "}
      <DeckSettingsModal
        deckSettingsOpen={deckSettingsOpen}
        setDeckSettingsOpen={setDeckSettingsOpen}
        settings={settings}
      />
      <DeckGL
        pickingRadius={10}
        //getCursor={() => hoverInfo && hoverInfo.object ? "default" : "pointer"}
        ref={deckRef}
        views={views}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layerFilter={layerFilter}
        layers={layers}
        onResize={(size) => {
          setDeckSize(size);
          console.log("resize", size);
        }}
        onAfterRender={(event) => {
          if (isNaN(deckSize.width)) {
            setDeckSize(event.target.parentElement.getBoundingClientRect());
          }
        }}
      >
        <NodeHoverTip
          hoverInfo={hoverInfo}
          hoverDetails={hoverDetails}
          colorHook={colorHook}
          colorBy={colorBy}
          config={config}
          filterMutations={settings.filterMutations}
          deckSize={deckSize}
        />
        <DeckButtons
          zoomIncrement={zoomIncrement}
          zoomAxis={zoomAxis}
          setZoomAxis={setZoomAxis}
          snapshot={snapshot}
          loading={data.status === "loading"}
          requestOpenSettings={() => setDeckSettingsOpen(true)}
        />
      </DeckGL>
    </div>
  );
}

export default Deck;
