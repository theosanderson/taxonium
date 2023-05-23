import "./App.css";
import React, { useState, Suspense, useRef } from "react";

import TaxoniumWrapper from "./TaxoniumWrapper";

function App() {
  return (
    <>
      <div className="w-full h-full flex">
        <TaxoniumWrapper />
      </div>
    </>
  );
}

export default App;
