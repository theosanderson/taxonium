/// app.js
import React, { useState, useCallback, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { View } from "@deck.gl/core";
import useLayers from "./hooks/useLayers";
import JBrowsePanel from "./components/JBrowsePanel";
import { ClipLoader } from "react-spinners";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import useSnapshot from "./hooks/useSnapshot";
import NodeHoverTip from "./components/NodeHoverTip";
import TreenomeMutationHoverTip from "./components/TreenomeMutationHoverTip";
import { DeckButtons } from "./components/DeckButtons";
import DeckSettingsModal from "./components/DeckSettingsModal";
import { TreenomeButtons } from "./components/TreenomeButtons";
import TreenomeModal from "./components/TreenomeModal";
import FirefoxWarning from "./components/FirefoxWarning";
import { JBrowseErrorBoundary } from "./components/JBrowseErrorBoundary";
import Key from "./components/Key";

const MemoizedKey = React.memo(Key);

function Deck({
  data,
  search,
  treenomeState,
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
  deckRef,
  jbrowseRef,
}) {
  const zoomReset = view.zoomReset;
  const snapshot = useSnapshot(deckRef);
  const [deckSettingsOpen, setDeckSettingsOpen] = useState(false);
  const [treenomeSettingsOpen, setTreenomeSettingsOpen] = useState(false);

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

  // Treenome state
  const setMouseXY = useCallback(
    (info) => view.setMouseXY([info.x, info.y]),
    [view]
  );
  const [treenomeReferenceInfo, setTreenomeReferenceInfo] = useState(null);

  const [mouseDownIsMinimap, setMouseDownIsMinimap] = useState(false);

  const mouseDownPos = useRef();

  const onClickOrMouseMove = useCallback(
  (event) => {
    const { offsetCenter } = event;
    const viewport = deckRef.current.deck.viewManager.getViewports()[1];

    if (event.type === "pointerdown" && event.pointerType === "mouse") {
      setMouseDownCoordinate(viewport.unproject(offsetCenter));
      setMouseCoordinate(viewport.unproject(offsetCenter));
      setMouseDownIsMinimap(pickInfo && pickInfo.viewport.id === "minimap");
    } else if (event.type === "pointermove" && event.pointerType === "mouse") {
      if (mouseDownIsMinimap) {
        const mousePos = viewport.unproject(offsetCenter);
        const dx = mousePos[0] - mouseDownCoordinate[0];
        const dy = mousePos[1] - mouseDownCoordinate[1];
        const newTarget = [
          viewState.target[0] - dx / 2 ** (viewState.zoom - xzoom),
          viewState.target[1] + dy / 2 ** (viewState.zoom - xzoom),
        ];
        onViewStateChange({
          oldViewState: viewState,
          viewState: { ...viewState, target: newTarget },
        });
        setMouseCoordinate(mousePos);
      }
    } else if (event.type === "pointerup" && event.pointerType === "mouse") {
      if (mouseDownIsMinimap) {
        setMouseDownCoordinate(null);
        setMouseCoordinate(null);
        setMouseDownIsMinimap(false);
      }
    } else if (!pickInfo && event._reactName === "onClick") {
      selectedDetails.clearNodeDetails();
    }
  },
  [
    selectedDetails,
    mouseDownIsMinimap,
    viewState,
    onViewStateChange,
    xzoom,
    deckRef,
    pickInfo,
  ]
);

  const [hoverInfo, setHoverInfoRaw] = useState(null);
  const setHoverInfo = useCallback(
    (info) => {
      setHoverInfoRaw(info);

      if (info && info.object) {
        if (hoverDetails.setNodeDetails) {
          hoverDetails.setNodeDetails(info.object);
        } else {
          hoverDetails.getNodeDetails(info.object.node_id);
        }
      } else {
        hoverDetails.clearNodeDetails();
      }
    },
    [hoverDetails]
  );

  const { layers, layerFilter, keyStuff } = useLayers({
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
    treenomeState,
    treenomeReferenceInfo,
    setTreenomeReferenceInfo,
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
              <>
                {" "}
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
                <div className="w-60">
                  {" "}
                  <FirefoxWarning className="font-bold text-xs text-gray-700 mt-3" />
                </div>
              </>
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
        onHover={setMouseXY}
        onResize={(size) => {
          setDeckSize(size);
          window.setTimeout(() => {
            treenomeState.handleResize();
          }, 50);
          console.log("resize", size);
        }}
        onAfterRender={(event) => {
          if (isNaN(deckSize.width)) {
            setDeckSize(event.target.parentElement.getBoundingClientRect());
          }
        }}
      >
        <View id="browser-axis">
          <div
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid black",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span ref={jbrowseRef}>
              <JBrowseErrorBoundary>
                <JBrowsePanel
                  treenomeState={treenomeState}
                  settings={settings}
                />
              </JBrowseErrorBoundary>
              <TreenomeModal
                treenomeSettingsOpen={treenomeSettingsOpen}
                setTreenomeSettingsOpen={setTreenomeSettingsOpen}
                settings={settings}
              />
            </span>
          </div>

          <TreenomeButtons
            loading={data.status === "loading"}
            requestOpenSettings={() => {
              console.log("opening");
              console.log(treenomeSettingsOpen);

              setTreenomeSettingsOpen(true);
            }}
            settings={settings}
          />
        </View>
        <View id="main">
          <NodeHoverTip
            hoverInfo={hoverInfo}
            hoverDetails={hoverDetails}
            colorHook={colorHook}
            colorBy={colorBy}
            config={config}
            filterMutations={settings.filterMutations}
            deckSize={deckSize}
          />
          <TreenomeMutationHoverTip
            hoverInfo={hoverInfo}
            hoverDetails={hoverDetails}
            colorHook={colorHook}
            colorBy={colorBy}
            config={config}
            treenomeReferenceInfo={treenomeReferenceInfo}
          />
          <MemoizedKey
            keyStuff={keyStuff}
            colorByField={colorBy.colorByField}
            colorByGene={colorBy.colorByGene}
            colorByPosition={colorBy.colorByPosition}
            config={config}
          />
          <DeckButtons
            zoomReset={zoomReset}
            zoomIncrement={zoomIncrement}
            zoomAxis={zoomAxis}
            setZoomAxis={setZoomAxis}
            snapshot={snapshot}
            loading={data.status === "loading"}
            requestOpenSettings={() => setDeckSettingsOpen(true)}
            settings={settings}
          />
        </View>
      </DeckGL>
    </div>
  );
}

export default Deck;
