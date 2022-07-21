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
            Taxonium is a web application for visualizing phylogenetic trees.
            Find out more at our{" "}
            <a
              className="text-blue underline"
              href="https://github.com/theosanderson/taxodium"
            >
              Github repository
            </a> or <a
              className="text-blue underline"
              href="https://docs.taxonium.org"
            >
              read the documentation
            </a>
            .
          </p>
        
        </div>
      )}
    </Modal>
  );
}

export default AboutOverlay;
