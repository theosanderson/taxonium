import "./App.css";
import React, { useEffect, useState, useCallback } from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";

import AboutOverlay from "./components/AboutOverlay";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";

import { BsInfoSquare } from "react-icons/bs";
var protobuf = require("protobufjs");
protobuf.parse.defaults.keepCase = true;
function App() {
  const [searchItems, setSearchItemsBasic] = useState([
    {
      id: 0.123,
      category: "lineage",
      value: "",
      enabled: true,
    },
  ]);

  const setSearchItems = useCallback(
    (x) => {
   
      setSearchItemsBasic(x);
    },
    []
  );


  const [colourBy, setColourBy] = useState("lineage");
  const setColourByWithCheck = useCallback(
    (x) => {
    
      setColourBy(x);
    },
    []
  );
  const [nodeData, setNodeData] = useState({
    status: "not_attempted",
    data: {node_data:{ids:[]}},
  });

 
  const [aboutEnabled, setAboutEnabled] = useState(false);

     useEffect(() => {
    if (nodeData.status === "not_attempted") {
      protobuf.load("./tree.proto")
    .then(function(root) {


      fetch('/nodelist.pb')
      .then(function(response) {
        if (!response.ok) {
          throw new Error("HTTP error, status = " + response.status);
        }
        return response.arrayBuffer();
      })
      .then(function(buffer) {
        console.log("buffer loaded")
        var NodeList = root.lookupType("AllData");
        window.buffer= buffer
        window.NodeList = NodeList
      var message = NodeList.decode(new Uint8Array(buffer));
      var result = NodeList.toObject(message);
      
      result.node_data.ids = [...Array(result.node_data.x.length).keys()]
      console.log("hi")
      console.log(result)
      window.b=result
      setNodeData({status:'loaded',data:result})
        });
      });
  

     
    }
    }
  , [nodeData.status]);



 

  return (
    <Router>
      <AboutOverlay enabled={aboutEnabled} setEnabled={setAboutEnabled} />
      
      <div className="h-screen w-screen">
        <div className="from-gray-500 to-gray-600 bg-gradient-to-bl h-15 shadow-md z-20">
          <div className="flex justify-between">
            <h1 className="text-xl p-4  pb-5 text-white ">
              <CgListTree className="inline-block h-8 w-8 pr-2 " />
              <span className="font-bold">Cov2Tree</span>:{" "}
              <span className="font-light">
                interactive SARS-CoV2 phylogeny{" "}
              </span>
            </h1>
            <div className="inline-block p-4">
          
              <button
                onClick={() => setAboutEnabled(true)}
                className="mr-10 text-white font-bold hover:underline"
              >
                <BsInfoSquare className="inline-block h-7 w-8" /> About this
                site
              </button>
            </div>
          </div>
        </div>
        <div className="main_content">
          <div className="md:grid md:grid-cols-12 h-full">
            <div className="md:col-span-8 h-3/6 md:h-full w-full">
              <Deck
                searchItems={searchItems}
                
                data={nodeData.status === "loaded" ? nodeData.data :  {node_data:{ids:[]}} }
                colourBy={colourBy}
              />
            </div>
            <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
              <SearchPanel
                searchItems={searchItems}
               
                setSearchItems={setSearchItems}
                colourBy={colourBy}
                setColourBy={setColourByWithCheck}
              />
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
