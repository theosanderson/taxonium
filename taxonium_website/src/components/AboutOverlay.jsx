import React, { useRef, useEffect } from "react";
import Modal from "react-modal";

const modalStyle = {
  content: {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fafafa",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "700px",
    maxHeight: "80vh",
    minWidth: "400px",
    minHeight: "400px",
    fontSize: "13px",
  },
  overlay: {
    backgroundColor: "rgba(100, 100, 100, 0.3)",
    zIndex: 1000,
  },
};

function AboutOverlay({ enabled, setEnabled, overlayContent }) {
  return (
    <Modal
      isOpen={enabled}
      onRequestClose={() => setEnabled(false)}
      style={modalStyle}
    >
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

          <p className="mb-1  mt-6 text-gray-700">
            <h3 className="font-bold">Citation</h3>
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
