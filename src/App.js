import "./App.css";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import GISAIDLoader from "./components/GISAIDLoader";
import AboutOverlay from "./components/AboutOverlay";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
import { RiFolderUploadLine } from "react-icons/ri";
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
  const [gisaid, setGisaid] = useState(null);
  const setSearchItems = useCallback(
    (x) => {
      console.log(x);
      if (gisaid === null) {
        const subset = x.filter((x) => x.category === "mutation");
        if (subset.length) {
          window.alert("Please import GISAID metadata to use this feature");
          return false;
        }
      }
      setSearchItemsBasic(x);
    },
    [gisaid]
  );
  const [cogMetadata, setCogMetadata] = useState(null);

  const [colourBy, setColourBy] = useState("lineage");
  const setColourByWithCheck = useCallback(
    (x) => {
      if ((x === "country") & (gisaid === null)) {
        // window.alert("Please import GISAID metadata to use this feature");
        // return false;
      }
      setColourBy(x);
    },
    [gisaid]
  );
  const [nodeData, setNodeData] = useState({
    status: "not_attempted",
    data: [],
  });

  const combinedMetadata = useMemo(() => {
    if (cogMetadata === "loading") {
      return "loading";
    }
    return { ...cogMetadata, ...gisaid };
  }, [cogMetadata, gisaid]);

  window.combined = combinedMetadata;
  window.gisaid = gisaid;
  window.cogmetadata = cogMetadata;

  const [gisaidLoaderEnabled, setGisaidLoaderEnabled] = useState(false);
  const [aboutEnabled, setAboutEnabled] = useState(false);
  window.gs = gisaid;


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
        console.log(buffer)
        var NodeList = root.lookupType("NodeList");
        window.buffer= buffer
        window.NodeList = NodeList
      var message = NodeList.decode(new Uint8Array(buffer));
      var result = NodeList.toObject(message);
      window.result = result
    setNodeData({status:'loaded',data:result.nodes.map((x)=>{return {name:null,...x}})})
        });
      });
  

     
    }
    }
  , [nodeData.status]);


  useEffect(() => {
    if (cogMetadata === null) {
      protobuf.load("./tree.proto")
    .then(function(root) {


      fetch('/metadata.pb')
      .then(function(response) {
        if (!response.ok) {
          throw new Error("HTTP error, status = " + response.status);
        }
        return response.arrayBuffer();
      })
      .then(function(buffer) {
        console.log(buffer)
        var MetadataList = root.lookupType("MetadataList");
        window.buffer= buffer
 
      var message = MetadataList.decode(new Uint8Array(buffer));
      var result = MetadataList.toObject(message);
      window.result = result

      const as_dict = Object.fromEntries(
        result.items.map((x) => [
          x.name,
          { ...x },
        ])
      );
      window.dict= as_dict;
      setCogMetadata(as_dict);
   
        });
      });
  

     
    }
    }
  , [cogMetadata]);


 

  return (
    <Router>
      <AboutOverlay enabled={aboutEnabled} setEnabled={setAboutEnabled} />
      <GISAIDLoader
        validNames={
          nodeData.status === "loaded"
            ? new Set(nodeData.data.map((x) => x.name))
            : null
        }
        setGisaid={setGisaid}
        enabled={gisaidLoaderEnabled}
        setGisaidLoaderEnabled={setGisaidLoaderEnabled}
      />
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
                onClick={() => setGisaidLoaderEnabled(true)}
                className="mr-10 text-white font-bold hover:underline"
              >
                <RiFolderUploadLine className="inline-block h-8 w-8" /> Import
                GISAID metadata
              </button>{" "}
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
                metadata={
                  combinedMetadata && combinedMetadata !== "loading"
                    ? combinedMetadata
                    : {}
                }
                nodeData={nodeData.status === "loaded" ? nodeData.data : []}
                colourBy={colourBy}
              />
            </div>
            <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
              <SearchPanel
                searchItems={searchItems}
                gisaidExists={gisaid !== null}
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
