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
import { useCallback, useMemo, useState } from "react";
import useBackend from "./hooks/useBackend";
import useConfig from "./hooks/useConfig";
import { useSettings } from "./hooks/useSettings";

function Taxonium({
  uploadedData,
  query,
  updateQuery,
  overlayRef,
  proto,
  setTitle,
}) {
  const [deckSize, setDeckSize] = useState(null);
  const settings = useSettings({query,updateQuery});
  const view = useView({ settings, deckSize });
  const colourMapping = useMemo(() => {
    return {};
  }, []);
  const colorHook = useColor(colourMapping);
  const url_on_fail = process.env.REACT_APP_URL_ON_FAIL
    ? process.env.REACT_APP_URL_ON_FAIL
    : null;
  const backend = useBackend(
    query.backend,
    query.sid,
    url_on_fail,
    uploadedData,
    proto
  );
  const hoverDetails = useHoverDetails();
  const selectedDetails = useNodeDetails("selected", backend);
  const config = useConfig(backend, view, overlayRef, setTitle);
  const colorBy = useColorBy(config, query, updateQuery);
  const xType = query.xType;
  const setxType = (xType) => {
    updateQuery({ xType });
  };
  

  const { data, boundsForQueries } = useGetDynamicData(
    backend,
    colorBy,
    view.viewState,
    config,
    xType
  );

  const search = useSearch({
    data,
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
    <div className="main_content">
      <div className="md:grid md:grid-cols-12 h-full">
        <div className="md:col-span-8 h-3/6 md:h-full w-full">
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
 
          />
        </div>
        <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
          <SearchPanel
            search={search}
            colorBy={colorBy}
            colorHook={colorHook}
            config={config}
            selectedDetails={selectedDetails}
            xType={xType}
            setxType={setxType}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}

export default Taxonium;
