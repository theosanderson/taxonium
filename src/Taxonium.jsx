import "./App.css";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Deck from "./newDeck";
import SearchPanel from "./components/SearchPanel";
import axios from "axios";
import pako from "pako";
import useView from "./hooks/useView";
import useProcessData from "./hooks/useProcessData";
import useLoadStaticData from "./hooks/useLoadStaticData";

//import {FaGithub} from  "react-icons/fa";

var protobuf = require("protobufjs");

protobuf.parse.defaults.keepCase = true;

function Taxonium({ uploadedData, query, setQuery }) {
  const staticData = useLoadStaticData(query.protoUrl, uploadedData);
  console.log(staticData, "SS");

  const processedData = {};
  const view = useView();

  return (
    <div className="main_content">
      <div className="md:grid md:grid-cols-12 h-full">
        <div className="md:col-span-8 h-3/6 md:h-full w-full">
          <Deck
            processedData={processedData}
            view={view}
            progress={staticData.progress}
            spinnerShown={staticData.status != "loaded"}
          />
        </div>
        <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
          <SearchPanel />
        </div>
      </div>
    </div>
  );
}

export default Taxonium;
