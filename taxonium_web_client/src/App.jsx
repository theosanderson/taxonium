import "./App.css";
import React, { useState, Suspense, useRef, useEffect } from "react";
import AboutOverlay from "./components/AboutOverlay";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
import { BsInfoSquare } from "react-icons/bs";
import useQueryAsState from "./hooks/useQueryAsState";
import classNames from "classnames";

import { useInputHelper } from "./hooks/useInputHelper";

import { getDefaultSearch } from "./utils/searchUtil";
import InputSupplier from "./components/InputSupplier";
import FirefoxWarning from "./components/FirefoxWarning";
import { Toaster } from "react-hot-toast";
const first_search = getDefaultSearch("aa1");

const Taxonium = React.lazy(() => import("./Taxonium"));

const DEFAULT_BACKEND = window.location.hostname.includes("epicov.org")
  ? "https://tree.epicov.org:8443"
  : window.location.hostname.includes("cov2tree.org")
  ? "https://api.cov2tree.org"
  : process.env.REACT_APP_DEFAULT_BACKEND;

const default_query = {
  srch: JSON.stringify([first_search]),
  enabled: JSON.stringify({ [first_search.key]: true }),
  backend: DEFAULT_BACKEND,
  xType: "x_dist",
  mutationTypesEnabled: JSON.stringify({ aa: true, nt: false }),
};

if (window.location.hostname.includes("mpx.taxonium.org")) {
  default_query.protoUrl = "https://mpx-tree.vercel.app/mpx.jsonl.gz";
  default_query.configUrl = "https://mpx-tree.vercel.app/config.json";
}

if (window.location.hostname.includes("taxonomy.taxonium.org")) {
  default_query.treeUrl =
    "https://cov2tree.nyc3.digitaloceanspaces.com/ncbi/tree.nwk.gz";

  default_query.metaUrl =
    "https://cov2tree.nyc3.digitaloceanspaces.com/ncbi/metadata.tsv.gz";

  default_query.configUrl =
    "https://cov2tree.nyc3.digitaloceanspaces.com/ncbi/config.json";

  default_query.ladderizeTree = "true";
}

function App() {
  const [uploadedData, setUploadedData] = useState(null);

  // check if .epicov.org is in the URL

  const [query, updateQuery] = useQueryAsState(default_query);

  const inputHelper = useInputHelper({
    setUploadedData,
    updateQuery,
    query,
    uploadedData,
  });
  const [title, setTitle] = useState(null);
  const [beingDragged, setBeingDragged] = useState(false);

  const dragTimeout = useRef(null);

  function onDrop(ev) {
    console.log("File(s) dropped");
    setBeingDragged(false);

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === "file") {
          var file = ev.dataTransfer.items[i].getAsFile();
          inputHelper.readFile(file);
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      inputHelper.readFile(ev.dataTransfer.files[0]);
    }
  }

  function onDragOver(ev) {
    if (
      uploadedData &&
      (uploadedData.status === "loaded" || uploadedData.status === "loading")
    ) {
      ev.preventDefault();
      return;
    }
    console.log("File(s) in drop zone");
    setBeingDragged(true);
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
    }

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
  }

  function onDragLeave(ev) {
    //debounce:
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
    }
    dragTimeout.current = setTimeout(() => {
      setBeingDragged(false);
    }, 500);
  }

  const [aboutEnabled, setAboutEnabled] = useState(false);

  const protoUrl = query.protoUrl;
  if (protoUrl && protoUrl.includes(".pb")) {
    const url_parts = window.location.href.split("?", 2);
    if (url_parts[1]) {
      console.log(url_parts, "parts");
      // V1 format
      if (!window.redirecting) {
        window.alert(
          "It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site. "
        );
      }
      window.redirecting = 1;
      // split url into before question mark and after

      window.location.href =
        "https://cov2tree-git-v1-theosanderson.vercel.app/?" + url_parts[1];
    } else {
      if (!window.redirecting) {
        window.alert(
          "It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site. "
        );
      }
      window.redirecting = 1;
      window.location.href =
        "https://cov2tree-git-v1-theosanderson.vercel.app/?protoUrl=" +
        protoUrl;
    }
  }
  const [overlayContent, setOverlayContent] = useState(null);
  // does the window location contain epicov anywhere
  const isGisaid = window.location.toString().includes("epicov.org");
  return (
    <Router>
      <AboutOverlay
        enabled={aboutEnabled}
        setEnabled={setAboutEnabled}
        overlayContent={overlayContent}
      />

      <div
        className="h-screen w-screen flex flex-col overflow-hidden"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <Toaster />
        {beingDragged && (
          <div className="bg-sky-200 p-5 font-bold">Drop file to import</div>
        )}
        <div
          className={classNames(
            "from-gray-500 to-gray-600 bg-gradient-to-bl shadow-md",
            "flex justify-between items-center px-4 flex-shrink-0",
            isGisaid ? "h-11" : "h-16"
          )}
        >
          <h1 className="text-xl text-white flex items-center space-x-2">
            {title ? (
              <>
                {window.screen.width < 600 && (
                  <>
                    {" "}
                    <span className="font-medium pr-2">{title}</span>
                    <span className="flex flex-col text-center">
                      <span className="text-xs">powered by</span>
                      <a
                        href="//taxonium.org"
                        className="underline hover:no-underline text-sm flex items-center"
                        target="_top"
                      >
                        <CgListTree className="h-4 w-4 mr-1 mt-0.5" />
                        <span>Taxonium</span>
                      </a>
                    </span>
                  </>
                )}
                {window.screen.width >= 600 && (
                  <>
                    <span className="font-medium ">{title}</span>
                    <div className="flex flex-row mt-4">
                      <CgListTree className="h- ml-1 w-4 mr-1" />
                      <span className="text-xs ml-1">powered by </span>
                      <a
                        href="//taxonium.org"
                        className="underline hover:no-underline text-xs ml-0.5"
                        target="_top"
                      >
                        <span>Taxonium</span>
                      </a>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <CgListTree className="h-6 w-6" />
                <span className="font-bold">Taxonium</span>
              </>
            )}
          </h1>
          <button
            onClick={() => setAboutEnabled(true)}
            className="text-white font-bold hover:underline flex items-center"
          >
            <BsInfoSquare className="w-6 h-6 opacity-80 mr-2" />
            About
          </button>
        </div>
        <Suspense fallback={<div></div>}>
          {query.backend ||
          (uploadedData &&
            (uploadedData.status === "loaded" ||
              uploadedData.status === "url_supplied")) ? (
            <Taxonium
              uploadedData={uploadedData}
              query={query}
              updateQuery={updateQuery}
              setOverlayContent={setOverlayContent}
              setTitle={setTitle}
            />
          ) : (
            <div className="m-10 space-y-3">
              <p className="text-lg text-gray-700 mb-5 font-bold">
                Welcome to Taxonium, a tool for exploring large trees
              </p>
              <p>
              TREENOME BROWSER DEMO:
      
             Click/drag/zoom on the left-hand side of the screen (on the next page)
             to control the tree, and do the same in the genome browser panel on the upper right to control the genome. Select a genomic region by selecting a coordinate region at the very top of the genome browser. Resizing the web browser will require a page refresh.
        
            </p>
              <InputSupplier inputHelper={inputHelper} />
              <p className="text-md text-gray-700 font-semibold mb-2">
                or{" "}
                <a
                  className="text-blue-500"
                  href="/?backend=https://api.cov2tree.org"
                >
                  load the public SARS-CoV-2 tree
                </a>
                ,{" "}
                <a
                  className="text-blue-500"
                  href="/?treeUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Ftree.nwk.gz&ladderizeTree=true&metaUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Fmetadata.tsv.gz&configUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Fconfig.json"
                >
                  an exploration of the NCBI taxonomy
                </a>
                , or{" "}
                <a
                  className="text-blue-500"
                  href="https://taxonium.readthedocs.io/en/latest/"
                >
                  read more
                </a>{" "}
                about how to use Taxonium
              </p>{" "}
              <FirefoxWarning className="mt-8 text-gray-400" />
            </div>
          )}
        </Suspense>
      </div>
    </Router>
  );
}
export default App;
