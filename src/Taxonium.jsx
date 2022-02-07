import "./App.css";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import useView from "./hooks/useView";
import useGetDynamicData from "./hooks/useGetDynamicData";
import useColor from "./hooks/useColor";
import useSearch from "./hooks/useSearch";
import { useRef, useMemo } from "react";

var protobuf = require("protobufjs");

protobuf.parse.defaults.keepCase = true;

function Taxonium({ uploadedData, query, setQuery }) {
  const view = useView();
  const colourMapping = useMemo(() => {
    return {};
  }, []);
  const colorHook = useColor(colourMapping);
  const data = useGetDynamicData(query.backend, view.viewState);
  const search = useSearch(data);

  //

  return (
    <div className="main_content">
      <div className="md:grid md:grid-cols-12 h-full">
        <div className="md:col-span-8 h-3/6 md:h-full w-full">
          <Deck data={data} view={view} colorHook={colorHook} />
        </div>
        <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
          <SearchPanel search={search} />
        </div>
      </div>
    </div>
  );
}

export default Taxonium;
