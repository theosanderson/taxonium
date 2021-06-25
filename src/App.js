import "./App.css";
import React, { useCallback, useRef } from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
window.lookup = {};
const pako = require("pako");

function App() {
  const fileSelector = useRef();

  const supplyGISAIDdata2 = useCallback(() => {
    console.log("hi");
    const theFile = fileSelector.current.files[0];
    let reader = new FileReader();
    reader.addEventListener("load", function (e) {
      let text = e.target.result;
      console.log("woo");
      window.text = text;
      const lines = text.split("\n");
      lines.shift();
      lines.pop();
      lines.forEach((x) => {
        const entries = x.split("\t");
        window.lookup[entries[0]] = entries[18];
      });
      window.chunk_count += 1;

      if (window.chunk_size * window.chunk_count > window.file.size) {
        return;
      }
      console.log(
        window.chunk_count,
        window.chunk_size * window.chunk_count,
        window.chunk_size * (window.chunk_count + 1) + 2000
      );
      e.target.readAsText(
        window.file.slice(
          window.chunk_size * window.chunk_count,
          window.chunk_size * (window.chunk_count + 1) + 2000
        )
      );

      //console.log(text.byteLength);
      //const result = pako.inflate(text, { to: "string" });
      //const out = result;
      //window.out = out;
      //console.log("dpme", out.length);
    });
    window.file = theFile;
    window.chunk_size = 1000000;
    window.chunk_count = 0;
    reader.readAsText(
      window.file.slice(
        window.chunk_size * window.chunk_count,
        window.chunk_size * window.chunk_count + 2000
      )
    );
  }, [fileSelector]);
  window.fs = fileSelector;
  return (
    <Router>
      <div className="h-screen w-screen">
        <div className="from-gray-500 to-gray-600 bg-gradient-to-bl h-15">
          <h1 className="text-xl p-4 font-bold pb-5 text-white">
            <CgListTree className="inline-block h-8 w-8 pr-2 " />
            Cov2Tree: interactive SARS-CoV2 phylogeny Supply GISAID data:
            <input
              type="file"
              id="files"
              ref={fileSelector}
              onChange={supplyGISAIDdata2}
            />
          </h1>
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
