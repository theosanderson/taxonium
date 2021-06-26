import "./App.css";
import React, {  useState } from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import GISAIDLoader from "./components/GISAIDLoader"
import AboutOverlay from "./components/AboutOverlay"
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
import { RiFolderUploadLine } from "react-icons/ri";
import {BsInfoSquare}  from "react-icons/bs";

function App() {
  const [gisaid,setGisaid] = useState();
  const [gisaidLoaderEnabled,setGisaidLoaderEnabled] = useState(false);
  const [aboutEnabled,setAboutEnabled] = useState(false);
  window.gs=gisaid
  
  return (
    <Router>
      <AboutOverlay enabled={aboutEnabled} setEnabled={setAboutEnabled} />
      <GISAIDLoader setGisaid={setGisaid} enabled={gisaidLoaderEnabled} setGisaidLoaderEnabled={setGisaidLoaderEnabled}/>
      <div className="h-screen w-screen">
        <div className="from-gray-500 to-gray-600 bg-gradient-to-bl h-15 shadow-md z-20">
          <div className="flex justify-between">
          <h1 className="text-xl p-4  pb-5 text-white ">
            <CgListTree className="inline-block h-8 w-8 pr-2 " />
            <span className="font-bold">Cov2Tree</span>: <span className="font-light">interactive SARS-CoV2 phylogeny </span>
          </h1>
          <div className="inline-block p-4"><button onClick={()=>setGisaidLoaderEnabled(true)} className="mr-10 text-white font-bold hover:underline"><RiFolderUploadLine className="inline-block h-8 w-8" /> Import GISAID metadata</button>  <button onClick={()=>setAboutEnabled(true)} className="mr-10 text-white font-bold hover:underline"><BsInfoSquare className="inline-block h-7 w-8" /> About this site</button></div>
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
