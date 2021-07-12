import React from "react";

function AboutOverlay({ enabled, setEnabled }) {
  return (
    <div className={`w-full ${enabled ? "" : "hidden"}`}>
      <div
        onClick={() => setEnabled(false)}
        className="fixed w-full h-full bg-black opacity-80 z-40"
      >
        </div>
        <div
        onClick={() => setEnabled(false)}
        className="fixed w-full h-full  opacity-100 z-40"
      >
       
      <div className=" relative mx-auto mt-5 p-5 bg-white shadow-md z-100 w-4/5 overflow-y-auto opacity-100 " style={{height:"90vh"}}>
        <button
          className="absolute top-5 right-5 text-xl font-bold"
          onClick={() => setEnabled(false)}
        >
          X
        </button>
        <h1 className="font-bold mb-3 text-xl">About Cov2Tree</h1>
        This tool allows you to explore a phylogenetic tree with hundreds of thousands of SARS-CoV-2 sequences, sequenced by researchers around the world and shared via the GISAID Initiative.
        The interface was made by{" "}
        <a className="text-blue-700 underline" href="http://theo.io/">
          Theo Sanderson
        </a>{" "}
        using a custom-developed open-source library called{" "}
        <a
          href="http://github.com/theosanderson/taxodium"
          className="text-blue-700 underline"
        >
          {" "}
          Taxodium
        </a>
        .<h1 className="font-bold mb-3 text-xl mt-6">The sequences</h1>
        
        <p>
        We gratefully acknowledge all data contributors, i.e. the Authors and their Originating laboratories responsible for obtaining the specimens, and their Submitting laboratories for generating the genetic sequence and metadata and sharing via the GISAID Initiative on which this research is based.
        </p>
        <h1 className="font-bold mb-3 text-xl mt-6">The tree</h1>
        <p>
          The tree shown here is the GISAID Audacity Tree. This tree uses a variation of the sarscov2phylo method developed by Robert Lanfear. The genome sequences were first aligned to the GISAID reference sequence WIV04 (Zheng-li Shi et al 2020). Lineages are assigned using 
{" "}

          <a
            className="text-blue-700 underline"
            href="https://www.pango.network/"
          >
            Pangolin
          </a>
          .
        </p>
        <h1 className="font-bold mb-3 text-xl mt-4">Citations</h1>
        <div className="text-sm">
        <p>
          Lanfear, Rob (2020). A global phylogeny of SARS-CoV-2 sequences from
          GISAID. Zenodo DOI: 10.5281/zenodo.3958883
        </p>
        
        <p>
          Rambaut et al. (2020). A dynamic nomenclature proposal for SARS-CoV-2
          lineages to assist genomic epidemiology.
        </p>
        
        <p>Elbe, S., and Buckland-Merrett, G. (2017) Data, disease and diplomacy: GISAID’s innovative contribution to global health. Global Challenges, 1:33-46. DOI: 10.1002/gch2.1018 PMCID: 31565258</p></div>
        
      </div>
       {" "}
      </div>
    </div>
  );
}

export default AboutOverlay;
