import "./App.css";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Deck from "./newDeck";
import SearchPanel from "./components/SearchPanel";
import axios from "axios";
import pako from "pako";
import useView from "./hooks/useView";
import useProcessData from "./hooks/useProcessData";
import useLoadStaticData from "./hooks/useLoadStaticData";
import useGetDynamicData from "./hooks/useGetDynamicData";
import useColor from "./hooks/useColor";
//import {FaGithub} from  "react-icons/fa";

var protobuf = require("protobufjs");

protobuf.parse.defaults.keepCase = true;

function Taxonium({ uploadedData, query, setQuery }) {
  // The useProcessData hook takes the raw data and processes it into a format ready to make into layers. This should be replaceable with something that actually makes queries to a server in the dynamic ver.

  const view = useView();
  const colourMapping = {}
  const colorHook = useColor(colourMapping);
  const data = useGetDynamicData(query.backend, view.viewState);
  
    // 

  return (
    <div className="main_content">
      <div className="md:grid md:grid-cols-12 h-full">
        <div className="md:col-span-8 h-3/6 md:h-full w-full">
          <Deck data={data} view={view} colorHook={colorHook} />
        </div>
        <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
          <SearchPanel />
        </div>
      </div>
    </div>
  );
}

export default Taxonium;
