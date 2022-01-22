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

//import {FaGithub} from  "react-icons/fa";

var protobuf = require("protobufjs");

protobuf.parse.defaults.keepCase = true;

function Taxonium({ uploadedData, query, setQuery }) {
  // The useProcessData hook takes the raw data and processes it into a format ready to make into layers. This should be replaceable with something that actually makes queries to a server in the dynamic ver.

  const view = useView();
  const data = useGetDynamicData(query.backend, view.viewState);
  const fakeData = view.viewState.fixed_target
    ? {
        data: [
          {
            x: view.viewState.fixed_target[0],
            y: view.viewState.fixed_target[1],
          },
          {
            x: view.viewState.min_x,
            y: view.viewState.min_y,
          },
          {
            x: view.viewState.max_x,
            y: view.viewState.max_y,
          },
          {
            x: view.viewState.fixed_target[0],
            y: view.viewState.min_y,
          },
          {
            x: view.viewState.max_x,
            y: view.viewState.fixed_target[1],
          },
        ],
      }
    : { data: [] };
  const stitched = useMemo(() => {
    return {
      data: [...fakeData.data, ...data.data],
    };
  }, [data.data, fakeData.data]);

  return (
    <div className="main_content">
      <div className="md:grid md:grid-cols-12 h-full">
        <div className="md:col-span-8 h-3/6 md:h-full w-full">
          <Deck data={stitched} view={view} />
        </div>
        <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
          <SearchPanel />
        </div>
      </div>
    </div>
  );
}

export default Taxonium;
