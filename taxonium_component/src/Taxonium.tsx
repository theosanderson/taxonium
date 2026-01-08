import React, { useMemo, useState, useRef } from "react";
import "./App.css";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import useTreenomeState from "./hooks/useTreenomeState";
import useView from "./hooks/useView";
import useGetDynamicData from "./hooks/useGetDynamicData";
import useColor from "./hooks/useColor";
import useSearch from "./hooks/useSearch";
import useColorBy from "./hooks/useColorBy";
import useNodeDetails from "./hooks/useNodeDetails";
import useHoverDetails from "./hooks/useHoverDetails";
import type { DeckGLRef } from "@deck.gl/react";
import useBackend from "./hooks/useBackend";
import usePerNodeFunctions from "./hooks/usePerNodeFunctions";
import type { DynamicDataWithLookup } from "./types/backend";
import useConfig from "./hooks/useConfig";
import { MdArrowBack, MdArrowUpward } from "react-icons/md";
import { useEffect } from "react";
import type { TreenomeState } from "./types/treenome";
import { useCallback } from "react";
import getDefaultQuery from "./utils/getDefaultQuery";
import type { Query } from "./types/query";
import type { NodeSelectHandler, NodeDetailsLoadedHandler } from "./types/ui";
import { Tooltip as ReactTooltip } from "react-tooltip";
const ReactTooltipAny: any = ReactTooltip;
import { Toaster } from "react-hot-toast";
import type { DeckSize } from "./types/common";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

interface SourceData {
  status: string;
  filename: string;
  filetype: string;
  data?: string;
  [key: string]: unknown;
}

interface TaxoniumProps {
  sourceData?: SourceData;
  backendUrl?: string;
  configDict?: Record<string, unknown>;
  configUrl?: string;
  query?: Query;
  updateQuery?: (q: Partial<Query>) => void;
  overlayContent?: React.ReactNode;
  setAboutEnabled?: (val: boolean) => void;
  setOverlayContent?: (content: React.ReactNode) => void;
  onSetTitle?: (title: string) => void;
  onNodeSelect?: NodeSelectHandler;
  onNodeDetailsLoaded?: NodeDetailsLoadedHandler;
  sidePanelHiddenByDefault?: boolean;
  usherProtobuf?: string;
  referenceGBFF?: string;
  referenceFasta?: string;
  metadataUrl?: string;
}

const default_query = getDefaultQuery();

function Taxonium({
  sourceData,

  backendUrl,

  configDict,
  configUrl,
  query,

  updateQuery,
  overlayContent,
  setAboutEnabled,
  setOverlayContent,
  onSetTitle,
  onNodeSelect,
  onNodeDetailsLoaded,
  sidePanelHiddenByDefault,
  usherProtobuf,
  referenceGBFF,
  referenceFasta,
  metadataUrl,
}: TaxoniumProps) {
  const [backupQuery, setBackupQuery] = useState(default_query);
  const backupUpdateQuery = useCallback((newQuery: Partial<Query>) => {
    setBackupQuery((oldQuery) => ({ ...oldQuery, ...newQuery }));
  }, []);
  // if query and updateQuery are not provided, use the backupQuery
  if (!query) {
    query = backupQuery;
  }
  if (!updateQuery) {
    updateQuery = backupUpdateQuery;
  }

  // if no onSetTitle, set it to a noop
  if (!onSetTitle) {
    onSetTitle = () => {};
  }
  // if no setOverlayContent, set it to a noop
  if (!setOverlayContent) {
    setOverlayContent = () => {};
  }

  // if no setAboutEnabled, set it to a noop
  if (!setAboutEnabled) {
    setAboutEnabled = () => {};
  }

  const deckRef = useRef<DeckGLRef | null>(null);
  const jbrowseRef = useRef<any>(null);
  const [mouseDownIsMinimap, setMouseDownIsMinimap] = useState(false);

  const [deckSize, setDeckSize] = useState<DeckSize>({
    width: NaN,
    height: NaN,
  });

  const backend = useBackend(
    backendUrl ? backendUrl : query.backend,
    query.sid,
    sourceData ?? null
  );
  if (!backend) {
    return (
      <div className="p-4 bg-red-50 text-red-800">
        Failed to initialise backend.
      </div>
    );
  }

  // Unified config hook (loads config + settings merged into one)
  const config = useConfig({
    backend,
    query,
    updateQuery,
    configDict: configDict ?? {},
    configUrl,
    setOverlayContent,
    onSetTitle,
  });

  // Create view using config (which includes all settings properties)
  const view = useView({
    settings: config,
    deckSize,
    mouseDownIsMinimap,
  });

  // Handle initial view state from config
  useEffect(() => {
    if (config.initial_x !== undefined || config.initial_y !== undefined) {
      const viewState = {
        ...view.viewState,
        target: [
          config.initial_x !== undefined ? config.initial_x : 2000,
          config.initial_y !== undefined ? config.initial_y : 1000,
        ] as [number, number],
      };
      const oldViewState = { ...view.viewState };
      view.onViewStateChange({
        viewId: "main",
        viewState,
        oldViewState,
        interactionState: { isZooming: true },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.initial_x, config.initial_y]);

  let hoverDetails = useHoverDetails();
  const gisaidHoverDetails = useNodeDetails("gisaid-hovered", backend);
  if (window.location.toString().includes("epicov.org")) {
    hoverDetails = gisaidHoverDetails;
  }
  const selectedDetails = useNodeDetails("selected", backend);
  const colorBy = useColorBy(config, query, updateQuery);
  const [additionalColorMapping, setAdditionalColorMapping] = useState({});
  const colorMapping = useMemo(() => {
    const initial = (config as any).colorMapping
      ? (config as any).colorMapping
      : {};
    return { ...initial, ...additionalColorMapping };
  }, [(config as any).colorMapping, additionalColorMapping]);
  const colorHook = useColor(config, colorMapping, colorBy.colorByField);

  //TODO: this is always true for now
  (config as any).enable_ns_download = true;

  const xType = query.xType ? query.xType : "x_dist";

  const setxType = useCallback(
    (xType: string) => {
      updateQuery!({ xType });
    },
    [updateQuery]
  );

  const { data, boundsForQueries, isCurrentlyOutsideBounds } =
    useGetDynamicData(
      backend,
      colorBy,
      view.viewState,
      config,
      xType,
      deckSize
    );

  const perNodeFunctions = usePerNodeFunctions(
    data as unknown as DynamicDataWithLookup,
    config
  );

  useEffect(() => {
    // If there is no distance data, default to time
    // This can happen with e.g. nextstrain json
    if (data.base_data && data.base_data.nodes) {
      const n = data.base_data.nodes[0];
      if (!n.hasOwnProperty("x_dist")) {
        setxType("x_time");
      } else if (!n.hasOwnProperty("x_time")) {
        setxType("x_dist");
      }
    }
  }, [data.base_data, setxType]);

  const search = useSearch({
    data,
    config,
    boundsForQueries,
    view,
    backend,
    query,
    updateQuery,
    deckSize,
    xType,
    settings: config,
  });

  const [sidebarOpen, setSidebarOpen] = useState(!sidePanelHiddenByDefault);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  };

  const buildPlaceSequencesUrl = () => {
    const params = new URLSearchParams();
    params.append('mode', 'no_genbank');

    if (usherProtobuf) {
      params.append('startingTreeUrl', usherProtobuf);
    }
    if (referenceGBFF) {
      params.append('refGbffUrl', referenceGBFF);
    }
    if (referenceFasta) {
      params.append('refFastaUrl', referenceFasta);
    }
    
    if (metadataUrl) {
      params.append('metadataUrl', metadataUrl);
    }

    return `/build?${params.toString()}`;
  };

  const showPlaceSequencesButton = usherProtobuf && referenceGBFF && referenceFasta;

  const treenomeState = useTreenomeState(data, deckRef, view, config);

  return (
    <GlobalErrorBoundary>
      <div
        className="w-full h-full flex taxonium"
        style={{ width: "100%", height: "100%" }}
      >
        <div id="taxonium-root" />
        <Toaster />
        <ReactTooltipAny
          id="global-tooltip"
          delayHide={400}
          className="infoTooltip"
          place="top"
          backgroundColor="#e5e7eb"
          textColor="#000"
          effect="solid"
        />
        <div className="grow overflow-hidden flex flex-col md:flex-row">
          <div
            className={
              sidebarOpen
                ? "h-1/2 md:h-full w-full 2xl:w-3/4 md:grow" +
                  (config.treenomeEnabled ? " md:w-3/4" : " md:w-2/3")
                : "md:col-span-12 h-5/6 md:h-full w-full"
            }
          >
            <Deck
              statusMessage={backend.statusMessage}
              data={data}
              search={search}
              view={view}
              colorHook={colorHook}
              colorBy={colorBy}
              config={config}
              hoverDetails={hoverDetails}
              selectedDetails={selectedDetails}
              xType={xType}
              settings={config}
              setDeckSize={setDeckSize}
              deckSize={deckSize}
              isCurrentlyOutsideBounds={isCurrentlyOutsideBounds}
              treenomeState={treenomeState as unknown as TreenomeState}
              deckRef={deckRef}
              mouseDownIsMinimap={mouseDownIsMinimap}
              setMouseDownIsMinimap={setMouseDownIsMinimap}
              jbrowseRef={jbrowseRef}
              setAdditionalColorMapping={setAdditionalColorMapping}
              onNodeSelect={onNodeSelect}
              onNodeDetailsLoaded={onNodeDetailsLoaded}
            />
          </div>

          <div
            className={
              sidebarOpen
                ? "grow min-h-0 h-1/2 md:h-full 2xl:w-1/4 bg-white shadow-xl border-t md:border-0 overflow-y-auto md:overflow-hidden" +
                  (config.treenomeEnabled ? " md:w-1/4" : " md:w-1/3")
                : "bg-white shadow-xl"
            }
          >
            {!sidebarOpen && (
              <button onClick={toggleSidebar}>
                <br />
                {window.innerWidth > 768 ? (
                  <MdArrowBack className="mx-auto w-5 h-5 sidebar-toggle" />
                ) : (
                  <MdArrowUpward className="mx-auto w-5 h-5 sidebar-toggle" />
                )}
              </button>
            )}

            {sidebarOpen && (
              <SearchPanel
                className="grow min-h-0 h-full bg-white shadow-xl border-t md:border-0 overflow-y-auto md:overflow-hidden"
                backend={backend}
                search={search}
                colorBy={colorBy}
                colorHook={colorHook}
                config={config}
                selectedDetails={selectedDetails}
                xType={xType}
                setxType={setxType}
                settings={config}
                treenomeState={treenomeState as unknown as TreenomeState}
                view={view}
                overlayContent={overlayContent}
                setAboutEnabled={setAboutEnabled}
                perNodeFunctions={perNodeFunctions}
                toggleSidebar={toggleSidebar}
                placeSequencesUrl={showPlaceSequencesButton ? buildPlaceSequencesUrl() : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </GlobalErrorBoundary>
  );
}

export default React.memo(Taxonium);
