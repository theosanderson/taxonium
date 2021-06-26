import "./App.css";
import React, {  useState } from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import GISAIDLoader from "./components/GISAIDLoader"
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
import { RiFolderUploadLine } from "react-icons/ri";

function App() {
  const [gisaid,setGisaid] = useState();
  const [gisaidLoaderEnabled,setGisaidLoaderEnabled] = useState(false);
  window.gs=gisaid
  
  return (
    <Router>
      <GISAIDLoader setGisaid={setGisaid} enabled={gisaidLoaderEnabled} setGisaidLoaderEnabled={setGisaidLoaderEnabled}/>
      <div className="h-screen w-screen">
        <div className="from-gray-500 to-gray-600 bg-gradient-to-bl h-15">
          <div className="flex justify-between">
          <h1 className="text-xl p-4 font-bold pb-5 text-white">
            <CgListTree className="inline-block h-8 w-8 pr-2 " />
            Cov2Tree: interactive SARS-CoV2 phylogeny 
          </h1>
          <button onClick={()=>setGisaidLoaderEnabled(true)} className="mr-10 text-white font-bold hover:underline"><RiFolderUploadLine className="inline-block h-8 w-8" /> Import GISAID metadata</button>
        </div>
        </div>
        <div className="main_content">
          <div className="md:grid md:grid-cols-12 h-full">
            <div className="md:col-span-8 h-full w-full">
              <Deck />
            </div>
            <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
              <SearchPanel />
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
