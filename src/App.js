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
      let shards = {};
      fetch("/data/config.json")
        .then((response) => response.json())
        .then((data) => {
          const num_shards = data.num_tree_shards;

          setNodeData({ status: "loading" });
          console.log(num_shards, "shards");
          const shard_indices = Array.from(new Array(num_shards), (x, i) => {
            return i;
          });
          shard_indices.forEach((i) => {
            fetch(`/data/tree_shards/${i}.json`)
              .then((response) => response.json())
              .then((data) => {
                const new_shards = { ...shards, [i]: data };

                const new_shards_length = Object.keys(new_shards).length;

                if (new_shards_length === num_shards) {
                  const list_of_lists = Object.keys(new_shards)
                    .sort()
                    .map((x) => new_shards[x]);
                  const concatted = [].concat(...list_of_lists);
                  setNodeData({ status: "loaded", data: concatted });
                  window.concatted = concatted;
                  console.log("shard complete");
                } else {
                  shards = new_shards;
                }
              });
            return i;
          });
        });
    }
  }, [nodeData.status]);

  useEffect(() => {
    if (cogMetadata === null) {
      console.log("fetch");
      fetch("/data/metadata.json")
        .then((response) => response.json())
        .then((data) => {
          console.log("meta complete");
          const as_dict = Object.fromEntries(
            data.map((x) => [
              x.name,
              { ...x, country: x.name ? x.name.split("/")[0] : null },
            ])
          );
          setCogMetadata(as_dict);
        });
      setCogMetadata("loading");
    }
  }, [cogMetadata]);

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
            <div className="md:col-span-8 h-full w-full">
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
