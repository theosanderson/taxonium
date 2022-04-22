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
import { useMemo, useState, useEffect } from "react";
import useBackend from "./hooks/useBackend";
import useConfig from "./hooks/useConfig";

var protobuf = require("protobufjs");

protobuf.parse.defaults.keepCase = true;

function Taxonium({ uploadedData, query, updateQuery, overlayRef, proto }) {
  const view = useView();
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
  const config = useConfig(backend, view, overlayRef);
  const colorBy = useColorBy(config, query, updateQuery);
  const [xAccessor, setXAccessor] = useState("x");
  const { data, boundsForQueries } = useGetDynamicData(
    backend,
    colorBy,
    view.viewState
  );

  const search = useSearch(
    data,
    boundsForQueries,
    view,
    backend,
    query,
    updateQuery
  );
  const statusMessage = backend.statusMessage ? backend.statusMessage : "";

  //

  return (
    <div className="main_content">
      <div className="md:grid md:grid-cols-12 h-full">
        <div className="md:col-span-8 h-3/6 md:h-full w-full">
          <Deck
            statusMessage={statusMessage}
            data={data}
            search={search}
            view={view}
            colorHook={colorHook}
            colorBy={colorBy}
            config={config}
            hoverDetails={hoverDetails}
            selectedDetails={selectedDetails}
            xAccessor={xAccessor}
          />
        </div>
        <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
          <SearchPanel
            search={search}
            colorBy={colorBy}
            colorHook={colorHook}
            config={config}
            selectedDetails={selectedDetails}
            xAccessor={xAccessor}
            setXAccessor={setXAccessor}
          />
        </div>
      </div>
    </div>
  );
}

export default Taxonium;
