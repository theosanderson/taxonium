import React from "react";

function AboutOverlay({ enabled, setEnabled }) {
  return (
    <div className={`w-full ${enabled ? "" : "hidden"}`}>
      <div
        onClick={() => setEnabled(false)}
        className="fixed w-full h-full bg-black opacity-80 z-40"
      >
        {" "}
      </div>
      <div className="fixed m-10 p-5 bg-white shadow-md z-50 w-4/5 ">
        <button
          className="absolute top-5 right-5 text-xl font-bold"
          onClick={() => setEnabled(false)}
        >
          X
        </button>
        <h1 className="font-bold mb-5 text-xl">About Cov2Tree</h1>
        This website allows you to explore phylogenetic trees for hundreds of
        thousands of SARS-Cov-2 sequences, sequenced by researchers around the
        world. The interface was made by Theo Sanderson and is{" "}
        <a
          href="http://github.com/theosanderson/vbigtree"
          className="text-blue-700 underline"
        >
          {" "}
          open source
        </a>
        .<h1 className="font-bold mb-5 text-xl mt-10">COG-UK</h1>
        <p>
          The tree we display here is the public downloadable tree produced by{" "}
          <a
            className="text-blue-700 underline"
            href="https://www.cogconsortium.uk/tools-analysis/public-data-analysis-2/"
          >
            COG UK
          </a>{" "}
          . The tree-specific pipeline was written by Rachel Colquhoun et al.
        </p>
        <p>
          This tree includes COG-UK data, and also background sequences from
          contributors around the world, collated on the GISAID database.
        </p>
        <h1 className="font-bold mb-5 text-xl mt-10">GISAID</h1>
        <p>
          We gratefully acknowledge all data contributors, i.e. the Authors and
          their Originating laboratories responsible for obtaining the
          specimens, and their Submitting laboratories for generating the
          genetic sequence and metadata and sharing via the GISAID Initiative1
          on which this research is based.
        </p>
        <p>
          1. Elbe, S., and Buckland-Merrett, G. (2017) Data, disease and
          diplomacy: GISAID’s innovative contribution to global health. Global
          Challenges, 1:33-46. DOI: 10.1002/gch2.1018 PMCID: 31565258
        </p>
      </div>
    </div>
  );
}

export default AboutOverlay;
