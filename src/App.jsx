import "./App.css";
import React, { useState, Suspense } from "react";
import AboutOverlay from "./components/AboutOverlay";
import { BrowserRouter as Router } from "react-router-dom";
import { CgListTree } from "react-icons/cg";
//import {FaGithub} from  "react-icons/fa";
import { BsInfoSquare } from "react-icons/bs";
const Taxodium = React.lazy(() => import("./Taxodium"));
function App() {
  const [aboutEnabled, setAboutEnabled] = useState(false);
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
      <div className="inline-block p-4 pr-0">
        <button
          onClick={() => setAboutEnabled(true)}
          className="mr-5 text-white font-bold hover:underline"
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
        <Suspense fallback={<div>Loading...</div>}>
          <Taxodium />
        </Suspense>
      </div>
    </Router>
  );
}
export default App;