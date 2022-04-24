import "./App.css";
import React, { useState, Suspense, useRef, useEffect } from "react";
import AboutOverlay from "./components/AboutOverlay";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
//import {FaGithub} from  "react-icons/fa";
import { BsInfoSquare } from "react-icons/bs";
import useQueryAsState from "./hooks/useQueryAsState";

import axios from "axios";
import protobuf from "protobufjs";
import { getDefaultSearch } from "./utils/searchUtil";

const first_search = getDefaultSearch("aa1");

protobuf.parse.defaults.keepCase = true;

const Taxonium = React.lazy(() => import("./Taxonium"));
const TaxoniumUploader = React.lazy(() =>
  import("./components/TaxoniumUploader")
);

function App() {
  function readFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      //setUploadedData(reader.result);

      if (file.name.includes(".pb")) {
        // V1 format
        window.alert("It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site.");
        window.location.href = "https://cov2tree-git-v1-theosanderson.vercel.app/" ;
      }
    
    
      setUploadedData({ status: "loaded",  filename:file.name, data: reader.result });
      
    };

    reader.readAsArrayBuffer(file);
  }

  const [query, updateQuery] = useQueryAsState({
    srch: JSON.stringify([first_search]),
    enabled: JSON.stringify({ [first_search.key]: true }),
    backend: process.env.REACT_APP_DEFAULT_BACKEND
  });
  
  useEffect(() => {
  if(query.colourBy){
     // TODO: remove this, after ClusterTraccker has been updated

    // old style colourBy, fix it
    const new_color= {field: "meta_"+JSON.parse(query.colourBy).variable};
    
    updateQuery({color: JSON.stringify(new_color), colourBy: null});

  }
}, [query, updateQuery]);

useEffect(() => {
  // TODO: remove this, after ClusterTraccker has been updated
if(query.search){

  // old style search, fix it
  /* Old style searches looked like:
  [{"id":0.123,"category":"cluster","value":"California_node_45047","enabled":true,"aa_final":"any","min_tips":1,"aa_gene":"S","search_for_ids":""}]

  New style looks like:
  [{"key":"aa1","type":"meta_Lineage","method":"text_exact","text":"a","gene":"S","position":484,"new_residue":"K","min_tips":0}]

  */
 const map_old_to_new = (old) => {

  const new_search = {
    key: "AA"+old.id,
    type: "meta_"+old.category,
    method: "text_exact",
    text: old.value,
  };
  return new_search;
};


  const new_searches = JSON.parse(query.search).map(map_old_to_new);
  const searches_enabled = Object.fromEntries( new_searches.map(s => [s.key, true]));
  updateQuery({srch: JSON.stringify(new_searches), search: null, enabled: JSON.stringify(searches_enabled)});
}
}, [query, updateQuery]);


  const [beingDragged, setBeingDragged] = useState(false);

  const overlayRef = useRef(null);

  function onDrop(ev) {
    console.log("File(s) dropped");

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === "file") {
          var file = ev.dataTransfer.items[i].getAsFile();
          readFile(file);
          setBeingDragged(false);
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      readFile(ev.dataTransfer.files[0]);
      setBeingDragged(false);
    }
  }

  function onDragOver(ev) {
    console.log("File(s) in drop zone");
    setBeingDragged(true);

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
  }

  function onDragLeave(ev) {
    setBeingDragged(false);
    ev.preventDefault();
  }

  const [uploadedData, setUploadedData] = useState(null);
  const [aboutEnabled, setAboutEnabled] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const protoUrl = query.protoUrl;
  if (protoUrl.includes(".pb")) {
    // V1 format
    window.alert("It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site.");
    // split url into before question mark and after
    const url_parts = protoUrl.split("?", limit = 2);
    window.location.href = "https://cov2tree-git-v1-theosanderson.vercel.app/" + "?protoUrl=" + url_parts[1];
  }

  useEffect(() => {

  if (protoUrl && !uploadedData) {
    axios
      .get(protoUrl, {
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor(
            1 * (progressEvent.loaded / progressEvent.total) * 100
          );
          setUploadedData({
            status: "loading",
            progress: percentCompleted,
            data: { node_data: { ids: [] } },
          });
        },
      })
      .catch((err) => {
        console.log(err);
        window.alert(
          err +
            "\n\nPlease check the URL entered, or your internet connection, and try again."
        );
      })
      .then(function (response) {
        console.log("filename",  protoUrl);
       
          setUploadedData({
            status: "loaded",
            filename: protoUrl,
            data: response.data,
          });
        
        
      });
  }
  }, [protoUrl, uploadedData]);

  return (
    <Router>
      <AboutOverlay
        enabled={aboutEnabled}
        setEnabled={setAboutEnabled}
        overlayRef={overlayRef}
      />

      <div
        className="h-screen w-screen"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {beingDragged && <div>Drop file to import</div>}
        <div className="from-gray-500 to-gray-600 bg-gradient-to-bl h-15 shadow-md z-20">
          <div className="flex justify-between">
            <h1 className="text-xl p-4  pb-5 text-white ">
              <CgListTree className="inline-block h-8 w-8 pr-2 " />
              <span className="font-bold">Taxonium</span>
            </h1>
            <div className="inline-block p-4 pr-0">
              <button
                onClick={() => setAboutEnabled(true)}
                className="mr-5 text-white font-bold hover:underline"
              >
                <BsInfoSquare className="inline-block h-7 w-8" /> About /
                Acknowledgements
              </button>
              {/*<a className="text-white" href="https://github.com/theosanderson/taxonium">
        <FaGithub className="inline-block text-white h-7 w-8" />
</a>*/}
            </div>
          </div>
        </div>
        <Suspense
          fallback={
            <div>Loading... {uploadedData && uploadedData.progress}</div>
          }
        >
          {query.backend ||
          (uploadedData && uploadedData.status === "loaded") ? (
            <Taxonium
              uploadedData={uploadedData}
              query={query}
              updateQuery={updateQuery}
              overlayRef={overlayRef}
            />
          ) : uploadedData && uploadedData.status === "loading" ? (
            <div className="flex justify-center items-center h-screen w-screen">
              <div className="text-center">
                <div className="text-xl">Downloading file...</div>
                <div className="text-gray-500">{uploadedData.progress}%</div>
              </div>
            </div>
          ) : (
            <div className="m-10">
              <p className="text-lg text-gray-700 mb-5">
                Welcome to Taxonium, a tool for exploring large trees
              </p>
              <div className="grid grid-cols-2  divide-x divide-gray-300">
                <div className="p-5">
                  <h3 className="text-md text-gray-700 font-semibold mb-2">
                    Import a Taxonium protobuf file
                  </h3>
                  <TaxoniumUploader
                    readFile={readFile}
                    protoUrl={query.protoUrl}
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-md text-gray-700 font-semibold mb-2">
                    Provide a URL to a Taxonium protobuf file
                  </h3>
                  URL:{" "}
                  <input
                    type="text"
                    className="border-gray-300 p-1 w-60 border"
                    value={currentUrl}
                    onChange={(event) => setCurrentUrl(event.target.value)}
                  ></input>
                  <br />
                  <button
                    className="  bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border  text-gray-700 ml-8 h-8 mt-5"
                    onClick={() =>
                      updateQuery({
                        ...query,
                        protoUrl: currentUrl.replace("http://", "https://"),
                      })
                    }
                  >
                    Load
                  </button>
                </div>
              </div>
              <p className="text-md text-gray-700 font-semibold mb-2">
                or{" "}
                <a
                  className="text-blue-500"
                  href="https://cov2tree-git-v1-theosanderson.vercel.app/?protoUrl=https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/public-latest.all.masked.taxodium.pb.gz"
                >
                  load the public SARS-CoV-2 tree
                </a>
                .
              </p>{" "}
            </div>
          )}
        </Suspense>
      </div>
    </Router>
  );
}
export default App;
