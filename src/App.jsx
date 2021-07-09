import "./App.css";
import React, { useEffect, useState, useCallback ,useMemo} from "react";
import Deck from "./Deck";
import SearchPanel from "./components/SearchPanel";
import axios from "axios";
import AboutOverlay from "./components/AboutOverlay";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
//import {FaGithub} from  "react-icons/fa";
import { BsInfoSquare } from "react-icons/bs";


var protobuf = require("protobufjs");
protobuf.parse.defaults.keepCase = true;

const searchColors = [
  [255, 0, 0],
  [183, 0, 255],
  [255, 213, 0],

  [0, 0, 255],
  [0, 255, 255],
];



function App() {

  const [zoomToSearch, setZoomToSearch] = useState({index:null});

  const [searchItems, setSearchItemsBasic] = useState([
    {
      id: 0.123,
      category: "lineage",
      value: "",
      enabled: true,
    },
  ]);




  const setSearchItems = useCallback((x) => {
    setSearchItemsBasic(x);
  }, []);

  const [colourBy, setColourBy] = useState("lineage");
  const setColourByWithCheck = useCallback((x) => {
    setColourBy(x);
  }, []);
  const [nodeData, setNodeData] = useState({
    status: "not_attempted",
    data: { node_data: { ids: [] } },
  });

  const [selectedNode, setSelectedNode] = useState(null);

  const [aboutEnabled, setAboutEnabled] = useState(false);

  useEffect(() => {
    if (nodeData.status === "not_attempted") {
      console.log("starting dl");
      setNodeData({
        status: "loading",
        progress: 0,
        data: { node_data: { ids: [] } },
      });

      protobuf.load("./tree.proto").then(function (root) {
        axios
          .get("/nodelist.pb", {
            responseType: "arraybuffer",
            onDownloadProgress: (progressEvent) => {
              let percentCompleted = Math.floor(
                1 * (progressEvent.loaded / 100000000) * 100
              );
              setNodeData({
                status: "loading",
                progress: percentCompleted,
                data: { node_data: { ids: [] } },
              });
            },
          })
          .then(function (response) {
            return response.data;
          })
          .then(function (buffer) {
            console.log("buffer loaded");
            var NodeList = root.lookupType("AllData");
            window.buffer = buffer;
            window.NodeList = NodeList;
            var message = NodeList.decode(new Uint8Array(buffer));
            var result = NodeList.toObject(message);
            result.node_data.ids = [...Array(result.node_data.x.length).keys()];
            setNodeData({ status: "loaded", data: result });
          });
      });
    }
  }, [nodeData.status]);

const data =  useMemo( ()=>nodeData.status === "loaded"
? nodeData.data
: { node_data: { ids: [] } },[nodeData])



const scatterIds = useMemo(
  () => data.node_data.ids.filter((x) => data.node_data.names[x] !== ""),
  [data]
);

  
  const [search_configs_initial, numSearchResults, totalSeqs] = useMemo(() => {
  
    const configs = searchItems
      .map((item, counter) => {
        let filter_function;
        const lowercase_query = item.value.toLowerCase().trim();
        if (item.category === "mutation") {
          const the_index = data.mutation_mapping.indexOf(item.value);
          filter_function = (x) =>
            data.node_data.mutations[x].mutation &&
            data.node_data.mutations[x].mutation.includes(the_index);
        }

        if (item.category === "name") {
          filter_function = (x) =>
            data.node_data.names[x].toLowerCase().includes(lowercase_query); //TODO precompute lowercase mapping for perf?
        }

        if (item.category === "country") {
          filter_function = (x) =>
            data.country_mapping[data.node_data.countries[x]].toLowerCase() ===
            lowercase_query; //TODO precompute lowercase mapping for perf
        }
        if (item.category === "lineage") {
          filter_function = (x) =>
            data.lineage_mapping[data.node_data.lineages[x]].toLowerCase() ===
            lowercase_query; //TODO precompute lowercase mapping for perf
        }
        const enabled =
          item.value !== null && item.value !== "" && item.enabled;
        return {
          id: "main-search-" + counter,
          enabled: enabled,
          data: item.value !== "" ? scatterIds.filter(filter_function) : [],
          opacity: 0.7,
          getRadius: 7 + counter * 2,
          filled: false,
          stroked: true,
          radiusUnits: "pixels",
          lineWidthUnits: "pixels",
          lineWidthScale: 1,

          getPosition: (d) => {
            return [data.node_data.x[d], data.node_data.y[d]];
          },
          getFillColor: (d) => [0, 0, 0],
          getLineColor: (d) => searchColors[counter % searchColors.length],
        };
      })
    const num_results = configs.map(x=>x.data.length)
    const filtered_configs = configs.filter((item) => item.enabled);
    return [filtered_configs, num_results, scatterIds.length];
  }, [data, searchItems, scatterIds]);
  


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
                interactive SARS-CoV-2 phylogeny{" "}
              </span>
            </h1>
            <div className="inline-block p-4">
              <button
                onClick={() => setAboutEnabled(true)}
                className="mr-10 text-white font-bold hover:underline"
              >
                <BsInfoSquare className="inline-block h-7 w-8" /> About /
                Acknowledgements
              </button>
              {/*<a className="text-white" href="https://github.com/theosanderson/taxodium">
              <FaGithub className="inline-block text-white h-7 w-8" />
  </a>*/}
            </div>
          </div>
        </div>
        <div className="main_content">
          <div className="md:grid md:grid-cols-12 h-full">
            <div className="md:col-span-8 h-3/6 md:h-full w-full">
              <Deck
             
             search_configs_initial={search_configs_initial}
             scatterIds={scatterIds}
              searchColors={searchColors}
                setSelectedNode={setSelectedNode}
                searchItems={searchItems}
                data={data}
                progress={nodeData.progress}
                colourBy={colourBy}
                zoomToSearch={zoomToSearch}
              />
            </div>
            <div className="md:col-span-4 h-full bg-white  border-gray-600   pl-5 shadow-xl">
              <SearchPanel
              setZoomToSearch={setZoomToSearch}
              totalSeqs={totalSeqs}
              numSearchResults = {numSearchResults}
              searchColors={searchColors}
                selectedNode={selectedNode}
                searchItems={searchItems}
                data={data}
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
