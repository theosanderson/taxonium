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
        
      </div>}
    </Modal>
  );
}

export default AboutOverlay;
