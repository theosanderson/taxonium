import "./App.css";
import React, { useState, Suspense, useRef } from "react";

import { BrowserRouter as Router } from "react-router-dom";
import TaxoniumWrapper from "./TaxoniumWrapper";

function App() {
  return (
    <Router>
      <div className="w-full h-full flex">
        <TaxoniumWrapper />
      </div>
    </Router>
  );
}

export default App;
