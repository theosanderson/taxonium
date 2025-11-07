/// app.js
import React, { useState, useCallback, useRef, Suspense, useEffect } from "react";
import DeckGL, { type DeckGLRef } from "@deck.gl/react";
import { View } from "@deck.gl/core";
const DeckView = View as unknown as React.ComponentType<Record<string, unknown>>;
import useLayers from "./hooks/useLayers";
const JBrowsePanel = React.lazy(
  () => import("./components/JBrowsePanel")
);
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
import type { Settings } from "./types/settings";
import type { UnifiedSettings } from "./types/unifiedSettings";
import type { View as ViewType } from "./hooks/useView";
import type { SearchState } from "./types/search";
import type { TreenomeState } from "./types/treenome";
import type { HoverDetailsState, SelectedDetails, NodeSelectHandler, NodeDetailsLoadedHandler } from "./types/ui";
import TreenomeModal from "./components/TreenomeModal";
import FirefoxWarning from "./components/FirefoxWarning";
import { JBrowseErrorBoundary } from "./components/JBrowseErrorBoundary";
import ColorSettingModal from "./components/ColorSettingModal";
import Key from "./components/Key";
import type { StatusMessage, DynamicData, Config } from "./types/backend";
import type { DeckSize, HoverInfo } from "./types/common";
import type { Node, Mutation } from "./types/node";
import type { ColorHook, ColorBy } from "./types/color";

const MemoizedKey = React.memo(Key);


export interface DeckProps {
  data: DynamicData;
  search: SearchState;
  treenomeState: TreenomeState;
  view: ViewType;
  colorHook: ColorHook;
  colorBy: ColorBy;
  hoverDetails: HoverDetailsState;
  config: Config | UnifiedSettings;
  statusMessage: StatusMessage | null;
  xType: string;
  settings: Settings | UnifiedSettings;
  selectedDetails: SelectedDetails;
  setDeckSize: (size: DeckSize) => void;
  deckSize: DeckSize;
  isCurrentlyOutsideBounds: boolean;
  deckRef: React.MutableRefObject<DeckGLRef | null>;
  jbrowseRef: React.RefObject<HTMLSpanElement | null>;
  setAdditionalColorMapping: React.Dispatch<
    React.SetStateAction<Record<string, unknown>>
  >;
  mouseDownIsMinimap: boolean;
  setMouseDownIsMinimap: (val: boolean) => void;
  onNodeSelect?: NodeSelectHandler;
  onNodeDetailsLoaded?: NodeDetailsLoadedHandler;
}

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
  onNodeSelect,
  onNodeDetailsLoaded,
}: DeckProps) {

  const zoomReset = view.zoomReset;
  const snapshot = useSnapshot(deckRef);
  const [deckSettingsOpen, setDeckSettingsOpen] = useState(false);
  const [colorSettingOpen, setColorSettingOpen] = useState(false);
  const [currentColorSettingKey, setCurrentColorSettingKey] = useState("a");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [treenomeSettingsOpen, setTreenomeSettingsOpen] = useState(false);

  const no_data = !data.data || !data.data.nodes || !data.data.nodes.length;

  const {
    viewState,

    onViewStateChange,
    views,
    zoomIncrement,

    zoomAxis,
    setZoomAxis,
  } = view;

  // Treenome state
  const setMouseXY = useCallback(
    (info: { x: number; y: number }) => view.setMouseXY([info.x, info.y]),
    [view]
  );
  const [treenomeReferenceInfo, setTreenomeReferenceInfo] = useState<
    Record<"aa" | "nt", Record<string, string>> | null
  >(null);

  const mouseDownPos = useRef<[number, number] | null>(null);

  // Call onNodeDetailsLoaded when node details change
  useEffect(() => {
    if (onNodeDetailsLoaded) {
      onNodeDetailsLoaded(
        selectedDetails.nodeDetails?.node_id ?? null,
        selectedDetails.nodeDetails
      );
    }
  }, [selectedDetails.nodeDetails, onNodeDetailsLoaded]);

  const onClickOrMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const reactEvent = event as any;
      if (reactEvent._reactName === "onClick") {
        setMouseDownIsMinimap(false);
      }
      if (event.buttons === 0 && reactEvent._reactName === "onPointerMove") {
        return false;
      }
      if (reactEvent._reactName === "onPointerDown") {
        mouseDownPos.current = [event.clientX, event.clientY];
      }
      const pan_threshold = 10;
      // if we get a click event and the mouse has moved more than the threshold,
      // then we assume that the user is panning and just return. Use Pythagorean
      // theorem to calculate the distance
      if (
        reactEvent._reactName === "onClick" &&
        mouseDownPos.current &&
        Math.sqrt(
          Math.pow(mouseDownPos.current[0] - event.clientX, 2) +
            Math.pow(mouseDownPos.current[1] - event.clientY, 2)
        ) > pan_threshold
      ) {
        return false;
      }


      const pickInfo = deckRef.current?.pickObject({
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
        radius: 10,
      });

      if (reactEvent._reactName === "onPointerDown") {
        if (pickInfo && pickInfo.viewport?.id === "minimap") {
          setMouseDownIsMinimap(true);
        } else {
          setMouseDownIsMinimap(false);
        }
      }
      if (
        pickInfo &&
        pickInfo.viewport?.id === "main" &&
        reactEvent._reactName === "onClick"
      ) {
        selectedDetails.getNodeDetails(pickInfo.object.node_id);
        if (onNodeSelect) {
          onNodeSelect(pickInfo.object.node_id);
        }
      }

      if (!pickInfo && reactEvent._reactName === "onClick") {
        selectedDetails.clearNodeDetails();
        if (onNodeSelect) {
          onNodeSelect(null);
        }
      }

      if (
        pickInfo &&
        pickInfo.viewport?.id === "minimap" &&
        mouseDownIsMinimap
      ) {
        onViewStateChange({
          oldViewState: viewState,
          requestIsFromMinimapPan: true,
          viewState: {
            ...viewState,
            target: [pickInfo.coordinate?.[0] ?? 0, pickInfo.coordinate?.[1] ?? 0],
          },
        });
      }
    },
    [selectedDetails, mouseDownIsMinimap, viewState, onViewStateChange, deckRef, onNodeSelect]
  );

  const [hoverInfo, setHoverInfoRaw] = useState<
    HoverInfo<Node | { m?: Mutation }> | null
  >(null);
  const setHoverInfo = useCallback(
    (info: HoverInfo<Node | { m?: Mutation }> | null) => {
      setHoverInfoRaw(info);

      if (info && info.object && "node_id" in info.object) {
        const nodeObj = info.object as Node;
        if (hoverDetails.setNodeDetails) {
          hoverDetails.setNodeDetails(nodeObj);
        } else if (hoverDetails.getNodeDetails) {
          hoverDetails.getNodeDetails(nodeObj.node_id);
        }
      } else {
        hoverDetails.clearNodeDetails();
      }
    },
    [hoverDetails]
  );

  const { layers, layerFilter, keyStuff, triggerSVGdownload } = useLayers({
    data,
    search,
    viewState,
    deckSize,
    colorHook,
    setHoverInfo: setHoverInfo as (info: HoverInfo<Node> | null) => void,
    hoverInfo: hoverInfo as HoverInfo<Node> | null,
    colorBy,
    xType,
    modelMatrix: view.modelMatrix,
    selectedDetails,
    settings,
    isCurrentlyOutsideBounds,
    config,
    treenomeState,
    treenomeReferenceInfo,
    setTreenomeReferenceInfo,
    hoveredKey,
  });

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
        setNoneColor={(color: number[]) => {
          setAdditionalColorMapping((x: any) => {
            return { ...x, None: color };
          });
        }}
      />
      <ColorSettingModal
        isOpen={colorSettingOpen}
        setIsOpen={setColorSettingOpen}
        color={colorHook.toRGB(currentColorSettingKey)}
        setColor={(color: number[]) => {
          setAdditionalColorMapping((x: any) => {
            return { ...x, [currentColorSettingKey]: color };
          });
        }}
        title={currentColorSettingKey}
      />
      <NodeHoverTip
        hoverInfo={hoverInfo as HoverInfo<Node> | null}
        hoverDetails={hoverDetails}
        colorHook={colorHook}
        colorBy={colorBy}
        config={config}
        filterMutations={settings.filterMutations}
        deckSize={deckSize}
      />
      <TreenomeMutationHoverTip
        hoverInfo={hoverInfo as HoverInfo<{ m?: Mutation }> | null}
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
        colorRamps={config.colorRamps}
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
            (treenomeState as any).handleResize();
          }, 50);
        }}
        onAfterRender={(event) => {
          if (isNaN(deckSize.width)) {
            const target = (event as any).target as HTMLElement;
            setDeckSize(target.parentElement!.getBoundingClientRect());
          }
        }}
      >
        <DeckView id="browser-axis">
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
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center h-full">
                      <ClipLoader size={50} color={"#666"} />
                    </div>
                  }
                >
                  <JBrowsePanel
                    treenomeState={treenomeState as any}
                    settings={settings}
                  />
                </Suspense>
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

              setTreenomeSettingsOpen(true);
            }}
            settings={settings}
          />
        </DeckView>
        <DeckView id="main"></DeckView>
      </DeckGL>
    </div>
  );
}

export default Deck;
