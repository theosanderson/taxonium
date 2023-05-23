import "./App.css";
import React, { useState, Suspense, useRef } from "react";

import { Toaster } from "react-hot-toast";
import ReactTooltip from "react-tooltip";
import { getDefaultSearch } from "./utils/searchUtil";
import Taxonium from "./Taxonium";

const first_search = getDefaultSearch(null, "aa1");

const default_query = {
  srch: JSON.stringify([first_search]),
  enabled: JSON.stringify({ [first_search.key]: true }),
  backend: "https://api.cov2tree.org",
  xType: "x_dist",
  mutationTypesEnabled: JSON.stringify({ aa: true, nt: false }),
  treenomeEnabled: false,
};

function TaxoniumWrapper() {
  const [uploadedData, setUploadedData] = useState(null);

  // check if .epicov.org is in the URL

  const [query, setQuery] = useState(default_query);
  const updateQuery = (newQuery) => {
    setQuery({ ...query, ...newQuery });
  };

  

  return (
  
      <div className="w-full h-full flex">
       <Toaster />
        <ReactTooltip />
      <Taxonium
              uploadedData={uploadedData}
              query={query}
              updateQuery={updateQuery}
              setOverlayContent={() => console.log("setOverlayContent")}
              setTitle={ () => console.log("setTitle")}
              overlayContent={null}
              setAboutEnabled={() => console.log("setAboutEnabled")}
            />
      </div>
   
  );
}

export default TaxoniumWrapper;
