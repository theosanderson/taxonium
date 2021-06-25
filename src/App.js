import "./App.css";
import React from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
function App() {
  return (
    <Router>
      <div className="h-screen w-screen">
        <div className="bg-gray-700 h-15">
          <h1 className="text-xl p-4 font-bold pb-5 text-white">
            <CgListTree className="inline-block h-8 w-8 pr-2 " />
            Cov2Tree: interactive SARS-CoV2 phylogeny
          </h1>
        </div>
        <div className="main_content">
          <div className="grid grid-cols-12 h-full">
            <div className="col-span-8 h-full w-full">
              <Deck />
            </div>
            <div className="col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
              <SearchPanel />
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
