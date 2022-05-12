import "./App.css";
import React, { useState, Suspense, useRef, useEffect } from "react";
import AboutOverlay from "./components/AboutOverlay";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
import { BsInfoSquare } from "react-icons/bs";
import useQueryAsState from "./hooks/useQueryAsState";

import { getDefaultSearch } from "./utils/searchUtil";

const first_search = getDefaultSearch("aa1");

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
        window.alert(
          "It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site. Please retry the upload from there."
        );
        window.location.href =
          "https://cov2tree-git-v1-theosanderson.vercel.app/";
      } else {
        setUploadedData({
          status: "loaded",
          filename: file.name,
          data: reader.result,
        });
      }
    };

    reader.readAsArrayBuffer(file);
  }

  const [query, updateQuery] = useQueryAsState({
    srch: JSON.stringify([first_search]),
    enabled: JSON.stringify({ [first_search.key]: true }),
    backend: process.env.REACT_APP_DEFAULT_BACKEND,
    xType: "x_dist",
    mutationTypesEnabled: JSON.stringify({ aa: true, nt: false }),
  });
  const [title, setTitle] = useState(null);
  const [beingDragged, setBeingDragged] = useState(false);

  const overlayRef = useRef(null);
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
          readFile(file);
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      readFile(ev.dataTransfer.files[0]);
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

  const [uploadedData, setUploadedData] = useState(null);
  const [aboutEnabled, setAboutEnabled] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

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

  useEffect(() => {
    if (protoUrl && !uploadedData) {
      setUploadedData({ status: "url_supplied", filename: protoUrl });
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
        {beingDragged && (
          <div className="bg-sky-200 p-5 font-bold">Drop file to import</div>
        )}
        <div className="from-gray-500 to-gray-600 bg-gradient-to-bl h-15 shadow-md z-20">
          <div className="flex justify-between">
            <h1 className="text-xl p-4  pb-5 text-white ">
              {title ? (
                <>
                  {title}{" "}
                  <span className="text-sm">
                    <CgListTree className="inline-block h-4 w-4 mr-1 " />{" "}
                    powered by{" "}
                    <a href="//taxonium.org" className="underline">
                      Taxonium
                    </a>
                  </span>
                </>
              ) : (
                <>
                  <CgListTree className="inline-block h-8 w-8 pr-2 " />
                  <span className="font-bold">Taxonium</span>
                </>
              )}
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
        <Suspense fallback={<div>Loading..</div>}>
          {query.backend ||
          (uploadedData &&
            (uploadedData.status === "loaded" ||
              uploadedData.status === "url_supplied")) ? (
            <Taxonium
              uploadedData={uploadedData}
              query={query}
              updateQuery={updateQuery}
              overlayRef={overlayRef}
              setTitle={setTitle}
            />
          ) : (
            <div className="m-10">
              <p className="text-lg text-gray-700 mb-5">
                Welcome to Taxonium, a tool for exploring large trees
              </p>
              <div className="grid grid-cols-2  divide-x divide-gray-300">
                <div className="p-5">
                  <h3 className="text-md text-gray-700 font-semibold mb-2">
                    Import a Taxonium JSONL file
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
                    // submit on enter
                    onKeyPress={(event) => {
                      if (event.key === "Enter") {
                        updateQuery({
                          ...query,
                          protoUrl: currentUrl.replace("http://", "https://"),
                        });
                      }
                    }}
                  />
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
                  href="/?backend=https://api.cov2tree.org"
                >
                  load the public SARS-CoV-2 tree
                </a>
                , or the{" "}
                <a
                  className="text-blue-500"
                  href="/?protoUrl=https://cov2tree.nyc3.cdn.digitaloceanspaces.com/latest_public.jsonl.gz"
                >
                  full-download
                </a>{" "}
                (slower to start) version
              </p>{" "}
            </div>
          )}
        </Suspense>
      </div>
    </Router>
  );
}
export default App;
