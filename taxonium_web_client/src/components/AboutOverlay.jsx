import React, { useRef, useEffect } from "react";
import Modal from "react-modal";

function AboutOverlay({ enabled, setEnabled, overlayContent }) {
  return (
    <Modal isOpen={enabled} onRequestClose={() => setEnabled(false)}>
      <button
        className="absolute text-lg font-bold top-0 right-0 m-2"
        onClick={() => setEnabled(false)}
      >
        X
      </button>
      <div dangerouslySetInnerHTML={{ __html: overlayContent }} />
      {!overlayContent && (
        <div className="m-5">
          <h2 className="font-bold mb-3">Welcome to Taxonium</h2>
          <p className="mb-1">
            Taxonium is a web application for exploring phylogenetic trees. Find
            out more at our{" "}
            <a
              className="text-blue underline"
              href="https://github.com/theosanderson/taxodium"
            >
              Github repository
            </a>{" "}
            or{" "}
            <a className="text-blue underline" href="https://docs.taxonium.org">
              read the documentation
            </a>
            .
          </p>
          <p className="mb-1 mt-6">
            Taxonium is a{" "}
            <a className="text-blue underline" href="https://genomium.org">
              Genomium
            </a>{" "}
            project.
          </p>

          <p className="mb-1 text-sm mt-6 text-sm text-gray-700">
            <h3 className="font-bold text-md">Citation</h3>
            If you use Taxonium in your research, please cite:
            <br />
            Theo Sanderson (2022){" "}
            <span class="font-semibold">
              Taxonium, a web-based tool for exploring large phylogenetic trees
            </span>{" "}
            <i>eLife</i> 11:e82392.
            <br />
            https://doi.org/10.7554/eLife.82392
          </p>
        </div>
      )}
    </Modal>
  );
}

export default AboutOverlay;
