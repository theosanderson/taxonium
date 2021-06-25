import "./App.css";
import React from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import { BrowserRouter as Router } from "react-router-dom";

function App() {
  return (
    <div className="h-screen w-screen">
      <Router>
        <div className="grid grid-cols-12 h-full">
          <div className="col-span-8 h-full w-full">
            <Deck />
          </div>
          <div className="col-span-4 h-full bg-gray-200">
            <SearchPanel />
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
