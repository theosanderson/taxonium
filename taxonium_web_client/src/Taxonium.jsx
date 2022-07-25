import "./App.css";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import useView from "./hooks/useView";
import useGetDynamicData from "./hooks/useGetDynamicData";
import useColor from "./hooks/useColor";
import useSearch from "./hooks/useSearch";
import useColorBy from "./hooks/useColorBy";
import useNodeDetails from "./hooks/useNodeDetails";
import useHoverDetails from "./hooks/useHoverDetails";
import { useMemo, useState } from "react";
import useBackend from "./hooks/useBackend";
import usePerNodeFunctions from "./hooks/usePerNodeFunctions";
import useConfig from "./hooks/useConfig";
import { useSettings } from "./hooks/useSettings";

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
  overlayContent,
  setAboutEnabled,
}) {
  const [deckSize, setDeckSize] = useState(null);
  const settings = useSettings({ query, updateQuery });
  const view = useView({ settings, deckSize });

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

  const perNodeFunctions = usePerNodeFunctions(data);

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

  //

  return (
    <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
      <div className="h-1/2 md:h-full w-full md:w-2/3 2xl:w-3/4 md:flex-grow">
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
        />
      </div>
      <SearchPanel
        className="flex-grow min-h-0 h-1/2 md:h-full md:w-1/3 2xl:w-1/4 bg-white shadow-xl border-t md:border-0 overflow-y-auto md:overflow-hidden"
        backend={backend}
        search={search}
        colorBy={colorBy}
        colorHook={colorHook}
        config={config}
        selectedDetails={selectedDetails}
        xType={xType}
        setxType={setxType}
        settings={settings}
        overlayContent={overlayContent}
        setAboutEnabled={setAboutEnabled}
      />
    </div>
  );
}

export default Taxonium;
