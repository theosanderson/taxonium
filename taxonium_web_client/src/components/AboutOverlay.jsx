import React, { useRef, useEffect } from "react";
import Modal from "react-modal";

const settingsModalStyle = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    //width: '50%',
    backgroundColor: "#fafafa",
  },
};

function AboutOverlay({ enabled, setEnabled, overlayContent }) {

  return (
    <Modal
      isOpen={enabled}
      style={settingsModalStyle}
      onRequestClose={() => setEnabled(false)}
    >
      <div dangerouslySetInnerHTML={{ __html: overlayContent }} />
       {!overlayContent && 
        <div>
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
            </a>
            .
          </p>
          <p>Taxonium was created by Theo Sanderson.</p>
        </div>
      </div>}
    </Modal>
  );
}

export default AboutOverlay;
