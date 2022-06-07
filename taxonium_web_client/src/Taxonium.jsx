import "./App.css";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import BrowserOptionsPanel from "./components/BrowserOptionsPanel";
import useBrowserState from "./hooks/useBrowserState";
import useView from "./hooks/useView";
import useGetDynamicData from "./hooks/useGetDynamicData";
import useColor from "./hooks/useColor";
import useSearch from "./hooks/useSearch";
import useColorBy from "./hooks/useColorBy";
import useNodeDetails from "./hooks/useNodeDetails";
import useHoverDetails from "./hooks/useHoverDetails";
import { useCallback, useMemo, useState, useRef } from "react";
import useBackend from "./hooks/useBackend";
import useConfig from "./hooks/useConfig";
import { useSettings } from "./hooks/useSettings";
import { MdArrowForward, MdArrowBack } from "react-icons/md";

const URL_ON_FAIL = window.location.hostname.includes(".epicov.org")
  ? "https://www.epicov.org/epi3/frontend"
  : process.env.REACT_APP_URL_ON_FAIL;

function Taxonium({
  uploadedData,
  query,
  updateQuery,
  setOverlayContent,
  proto,
  setTitle,
}) {
  const deckRef = useRef();
  const [deckSize, setDeckSize] = useState(null);
  const settings = useSettings({ query, updateQuery });
  const view = useView({ settings, deckSize, deckRef });

  const url_on_fail = URL_ON_FAIL ? URL_ON_FAIL : null;

  const backend = useBackend(
    query.backend,
    query.sid,
    url_on_fail,
    uploadedData,
    proto
  );
  let hoverDetails = useHoverDetails();
  const gisaidHoverDetails = useNodeDetails("gisaid-hovered", backend);
  if (window.location.toString().includes("epicov.org")) {
    hoverDetails = gisaidHoverDetails;
  }
  const selectedDetails = useNodeDetails("selected", backend);
  const config = useConfig(backend, view, setOverlayContent, setTitle, query);
  const colorBy = useColorBy(config, query, updateQuery);
  const colorMapping = useMemo(() => {
    return config.colorMapping ? config.colorMapping : {};
  }, [config.colorMapping]);
  const colorHook = useColor(colorMapping);

  const xType = query.xType;
  const setxType = (xType) => {
    updateQuery({ xType });
  };

  const { data, boundsForQueries, isCurrentlyOutsideBounds } =
    useGetDynamicData(backend, colorBy, view.viewState, config, xType);

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
  });

  // Treenome 
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [updateBrowserBounds, setUpdateBrowserBounds] = useState(false);
  const browserState = useBrowserState(data, deckRef, updateBrowserBounds, setUpdateBrowserBounds, view);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    // const tempView = view.viewState;

    setSidebarOpen(!sidebarOpen);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100); // is there a better way?

  };



  return (
    <div className="flex-grow overflow-hidden flex flex-col md:flex-row" >
      <div className={sidebarOpen ? "h-1/2 md:h-full w-full md:w-2/3 2xl:w-3/4 md:flex-grow"
        : "md:col-span-12 h-3/6 md:h-full w-full"}>
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
          browserState={browserState}
          deckRef={deckRef}
        />
      </div>
      
      <div>
          <button onClick={toggleSidebar}>
                <br />
                { sidebarOpen ? <MdArrowForward className="mx-auto w-5 h-5 sidebar-toggle" /> : <MdArrowBack className="mx-auto w-5 h-5 sidebar-toggle"/> }
              </button>
              { 
                sidebarOpen &&
                <span>
                <SearchPanel
                  className="search-panel flex-grow min-h-0 h-1/2 md:h-full md:w-1/3 2xl:w-1/4 bg-white shadow-xl border-t md:border-0 overflow-y-auto md:overflow-hidden"
                  backend={backend}
                  search={search}
                  colorBy={colorBy}
                  colorHook={colorHook}
                  config={config}
                  selectedDetails={selectedDetails}
                  xType={xType}
                  setxType={setxType}
                  settings={settings}
                />
                </span>
              }
        </div>
    </div>
  );
}

export default Taxonium;
