import React, { useState, Suspense, useRef, useEffect } from "react";
import AboutOverlay from "./components/AboutOverlay";
import TaxoniumBit from "./components/TaxoniumBit";

import { CgListTree } from "react-icons/cg";
import { BsInfoSquare } from "react-icons/bs";
import { FaGithub } from "react-icons/fa";
import useQueryAsState from "./hooks/useQueryAsState";
import classNames from "classnames";
import { useInputHelper } from "./hooks/useInputHelper";

import InputSupplier from "./components/InputSupplier";

import { HiOutlineBookOpen } from "react-icons/hi";

const default_query = {};

default_query.backend = null;
if (window.location.hostname.includes("viridian.taxonium.org")) {
  default_query.backend = "https://viridian-api.cov2tree.org";
}
if (window.location.hostname.includes("cov2tree.org")) {
  default_query.backend = "https://api.cov2tree.org";
}

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

if (window.location.hostname.includes("visualtreeoflife.taxonium.org")) {
  default_query.protoUrl =
    "https://cov2tree.nyc3.digitaloceanspaces.com/wikidata/out.jsonl.gz";
}

function App() {
  useEffect(() => {
    import("taxonium-component");
  }, []);
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
          "It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site. ",
        );
      }
      window.redirecting = 1;
      // split url into before question mark and after

      window.location.href =
        "https://cov2tree-git-v1-theosanderson.vercel.app/?" + url_parts[1];
    } else {
      if (!window.redirecting) {
        window.alert(
          "It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site. ",
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

  const showCase = [
    {
      title: "SARS-CoV-2",
      url: "/?backend=https://api.cov2tree.org",
      desc: "All seven million public sequences of SARS-CoV-2 from the INSDC databases",
    },
    {
      title: "Wikidata visual tree of life",
      url: "/?configUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Fconfig_special2.json&protoUrl=https%3A%2F%2Fcov2tree.nyc3.cdn.digitaloceanspaces.com%2Fncbi%2Fspecial_filtered.jsonl.gz&xType=x_dist",
      desc: "The tree of life, showing species from Wikidata with images. Links to Wikipedia.",
    },
    {
      title: "NCBI Taxonomy (full)",
      url: "https://taxonomy.taxonium.org",
      desc: "Full 2.2M NCBI Taxonomy of species",
    },
    {
      title: "Mpox",
      url: "https://mpx.taxonium.org",
      desc: "Mpox sequences from GenBank",
    },
  ];

  return (
    <>
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
        {beingDragged && (
          <div className="bg-sky-200 p-5 font-bold">Drop file to import</div>
        )}
        <div
          className={classNames(
            "from-gray-500 to-gray-600 bg-gradient-to-bl shadow-md",
            "flex justify-between items-center px-4 flex-shrink-0",
            isGisaid ? "h-11" : "h-16",
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
                      <span className="text-xs">visualised with</span>
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
                      <span className="text-xs ml-1">visualised with </span>
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
              <a
                href="//taxonium.org"
                className="hover:underline"
                target="_top"
              >
                <CgListTree className="h-6 w-6 inline-block mr-2 -mt-1" />
                <span className="font-bold">Taxonium</span>
              </a>
            )}
          </h1>
          <div className="flex ">
            <button
              onClick={() => setAboutEnabled(true)}
              className="text-white font-bold hover:underline flex items-center"
              title="Info"
            >
              <BsInfoSquare className="w-6 h-6 opacity-80 mr-4" />
            </button>
            <a
              href="https://github.com/theosanderson/taxonium"
              className="text-white font-bold hover:underline flex items-center"
              title="Source code"
              target="_top"
            >
              <FaGithub className="w-6 h-6 opacity-80 mr-2 " />
            </a>
          </div>
        </div>
        <Suspense fallback={<div></div>}>
          {query.backend ||
          (uploadedData &&
            (uploadedData.status === "loaded" ||
              uploadedData.status === "url_supplied")) ? (
            <div className="h-[calc(100%-4rem)]">
              <TaxoniumBit
                sourceData={uploadedData}
                query={query}
                updateQuery={updateQuery}
                setOverlayContent={setOverlayContent}
                setTitle={setTitle}
                overlayContent={overlayContent}
                setAboutEnabled={setAboutEnabled}
              />
            </div>
          ) : (
            <div className="m-10 space-y-3">
              <p className="text-lg text-gray-700 mb-5 font-bold">
                Welcome to Taxonium, a tool for exploring large trees
              </p>
              <InputSupplier inputHelper={inputHelper} />
              <div className="flex flex-col space-y-3 pt-6">
                {/* Horizontal separator and text "or load an existing tree:"*/}
                <div className="flex flex-row items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <div className="px-2 text-gray-500 text-sm">
                    or load an existing tree:
                  </div>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                {/* Showcases */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showCase.map((item, i) => (
                    <div key={i} className="border border-gray-300 rounded p-3">
                      <a
                        href={item.url}
                        className="text-gray-800 hover:underline"
                        target="_top"
                      >
                        {item.title}
                      </a>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* documentation link, centered with react-icons*/}
              <div className="flex justify-center pt-5">
                <a
                  href="//docs.taxonium.org"
                  className="text-gray-500 hover:underline"
                  target="_top"
                >
                  <HiOutlineBookOpen className="w-6 h-4 opacity-80 mr-2 inline-block " />
                  Read the Taxonium documentation
                </a>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
}

export default App;
