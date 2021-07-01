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
            COG-UK
          </a>{" "}
          . The tree-specific pipeline was written by Rachel Colquhoun et al.
        </p>
        <p>
          For this version of the site we have pruned the tree to remove any GISAID nodes from this COG-UK public tree.
        </p>
        
        <h1 className="font-bold mb-5 text-xl mt-10">Similar tools</h1>
        <p>
          You can also explore large phylogenies using{" "}
          <a className="text-blue-700 underline" href="https://pando.tools">
            Pando
          </a>, <a className="text-blue-700 underline" href="https://microreact.org/">
            Microreact
          </a>
          , and sampled phylogenies on{" "}
          <a className="text-blue-700 underline" href="https://nextstrain.org/">
            NextStrain
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default AboutOverlay;
