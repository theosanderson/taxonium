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
import { useMemo, useState, useRef } from "react";
import useBackend from "./hooks/useBackend";
import usePerNodeFunctions from "./hooks/usePerNodeFunctions";
import useConfig from "./hooks/useConfig";
import { useSettings } from "./hooks/useSettings";
import { MdArrowBack, MdArrowUpward } from "react-icons/md";
import { useEffect } from "react";
import { useCallback } from "react";
import getDefaultQuery from "./utils/getDefaultQuery";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { Toaster } from "react-hot-toast";

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
  setTitle,
}) {
  const [backupQuery, setBackupQuery] = useState(default_query);
  const backupUpdateQuery = useCallback((newQuery) => {
    setBackupQuery((oldQuery) => ({ ...oldQuery, ...newQuery }));
  }, []);
  // if query and updateQuery are not provided, use the backupQuery
  if (!query && !updateQuery) {
    query = backupQuery;
    updateQuery = backupUpdateQuery;
  }

  // if no setTitle, set it to a noop
  if (!setTitle) {
    setTitle = () => {};
  }
  // if no setOverlayContent, set it to a noop
  if (!setOverlayContent) {
    setOverlayContent = () => {};
  }

  // if no setAboutEnabled, set it to a noop
  if (!setAboutEnabled) {
    setAboutEnabled = () => {};
  }

  const deckRef = useRef();
  const jbrowseRef = useRef();
  const [mouseDownIsMinimap, setMouseDownIsMinimap] = useState(false);

  const [deckSize, setDeckSize] = useState(null);
  const settings = useSettings({ query, updateQuery });
  const view = useView({
    settings,
    deckSize,
    deckRef,
    jbrowseRef,
    mouseDownIsMinimap,
  });

  const backend = useBackend(
    backendUrl ? backendUrl : query.backend,
    query.sid,
    sourceData
  );
  let hoverDetails = useHoverDetails();
  const gisaidHoverDetails = useNodeDetails("gisaid-hovered", backend);
  if (window.location.toString().includes("epicov.org")) {
    hoverDetails = gisaidHoverDetails;
  }
  const selectedDetails = useNodeDetails("selected", backend);

  const config = useConfig(
    backend,
    view,
    setOverlayContent,
    setTitle,
    query,
    configDict,
    configUrl
  );
  const colorBy = useColorBy(config, query, updateQuery);
  const [additionalColorMapping, setAdditionalColorMapping] = useState({});
  const colorMapping = useMemo(() => {
    const initial = config.colorMapping ? config.colorMapping : {};
    return { ...initial, ...additionalColorMapping };
  }, [config.colorMapping, additionalColorMapping]);
  const colorHook = useColor(config, colorMapping, colorBy.colorByField);

  //TODO: this is always true for now
  config.enable_ns_download = true;

  const xType = query.xType ? query.xType : "x_dist";

  const setxType = useCallback(
    (xType) => {
      updateQuery({ xType });
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

  const perNodeFunctions = usePerNodeFunctions(data, config);

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
    settings,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  };

  const treenomeState = useTreenomeState(data, deckRef, view, settings);

  return (
    <div className="w-full h-full flex">
      <Toaster />
      <ReactTooltip
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
                (settings.treenomeEnabled ? " md:w-3/4" : " md:w-2/3")
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
            ariaHideApp={false} // sadly with or without this the app is not suitable for screen readers
            hoverDetails={hoverDetails}
            selectedDetails={selectedDetails}
            xType={xType}
            settings={settings}
            setDeckSize={setDeckSize}
            deckSize={deckSize}
            isCurrentlyOutsideBounds={isCurrentlyOutsideBounds}
            treenomeState={treenomeState}
            deckRef={deckRef}
            mouseDownIsMinimap={mouseDownIsMinimap}
            setMouseDownIsMinimap={setMouseDownIsMinimap}
            jbrowseRef={jbrowseRef}
            setAdditionalColorMapping={setAdditionalColorMapping}
          />
        </div>

        <div
          className={
            sidebarOpen
              ? "grow min-h-0 h-1/2 md:h-full 2xl:w-1/4 bg-white shadow-xl border-t md:border-0 overflow-y-auto md:overflow-hidden" +
                (settings.treenomeEnabled ? " md:w-1/4" : " md:w-1/3")
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
              settings={settings}
              treenomeState={treenomeState}
              view={view}
              overlayContent={overlayContent}
              setAboutEnabled={setAboutEnabled}
              perNodeFunctions={perNodeFunctions}
              toggleSidebar={toggleSidebar}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Taxonium;
