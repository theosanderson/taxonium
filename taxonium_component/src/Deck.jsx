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
import ColorSettingModal from "./components/ColorSettingModal";
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
  setAdditionalColorMapping,
  mouseDownIsMinimap,
  setMouseDownIsMinimap,
}) {
  const zoomReset = view.zoomReset;
  const snapshot = useSnapshot(deckRef);
  const [deckSettingsOpen, setDeckSettingsOpen] = useState(false);
  const [colorSettingOpen, setColorSettingOpen] = useState(false);
  const [currentColorSettingKey, setCurrentColorSettingKey] = useState("a");
  const [hoveredKey, setHoveredKey] = useState(null);
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
    [view],
  );
  const [treenomeReferenceInfo, setTreenomeReferenceInfo] = useState(null);

  const mouseDownPos = useRef();

  const onClickOrMouseMove = useCallback(
    (event) => {
      if (event._reactName === "onClick") {
        setMouseDownIsMinimap(false);
      }
      if (event.buttons === 0 && event._reactName === "onPointerMove") {
        return false;
      }
      if (event._reactName === "onPointerDown") {
        mouseDownPos.current = [event.clientX, event.clientY];
      }
      const pan_threshold = 10;
      // if we get a click event and the mouse has moved more than the threshold,
      // then we assume that the user is panning and just return. Use Pythagorean
      // theorem to calculate the distance
      if (
        event._reactName === "onClick" &&
        mouseDownPos.current &&
        Math.sqrt(
          Math.pow(mouseDownPos.current[0] - event.clientX, 2) +
            Math.pow(mouseDownPos.current[1] - event.clientY, 2),
        ) > pan_threshold
      ) {
        return false;
      }

      //console.log("onClickOrMouseMove", event);

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
          specialMinimap: true,
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
    [
      selectedDetails,
      mouseDownIsMinimap,
      viewState,
      onViewStateChange,
      xzoom,
      deckRef,
    ],
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
    [hoverDetails],
  );

  const { layers, layerFilter, keyStuff, triggerSVGdownload } = useLayers({
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
    hoveredKey,
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
        noneColor={colorHook.toRGB("None")}
        setNoneColor={(color) => {
          setAdditionalColorMapping((x) => {
            return { ...x, None: color };
          });
        }}
      />
      <ColorSettingModal
        isOpen={colorSettingOpen}
        setIsOpen={setColorSettingOpen}
        color={colorHook.toRGB(currentColorSettingKey)}
        setColor={(color) => {
          setAdditionalColorMapping((x) => {
            return { ...x, [currentColorSettingKey]: color };
          });
        }}
        title={currentColorSettingKey}
      />
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
        setCurrentColorSettingKey={setCurrentColorSettingKey}
        setColorSettingOpen={setColorSettingOpen}
        hoveredKey={hoveredKey}
        setHoveredKey={setHoveredKey}
      />
      <DeckButtons
        // we want this to intercept all mouse events
        // so that we can prevent the default behavior
        // of the browser
        triggerSVGdownload={triggerSVGdownload}
        deckSize={deckSize}
        zoomReset={zoomReset}
        zoomIncrement={zoomIncrement}
        zoomAxis={zoomAxis}
        setZoomAxis={setZoomAxis}
        snapshot={snapshot}
        loading={data.status === "loading"}
        requestOpenSettings={() => setDeckSettingsOpen(true)}
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
        <View id="main"></View>
      </DeckGL>
    </div>
  );
}

export default Deck;
