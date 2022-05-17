import React, { useRef, useEffect } from "react";
import Modal from "react-modal";

function AboutOverlay({ enabled, setEnabled, overlayContent }) {
  return (
    <Modal isOpen={enabled} onRequestClose={() => setEnabled(false)}>
      <div dangerouslySetInnerHTML={{ __html: overlayContent }} />
      {!overlayContent && <div></div>}
    </Modal>
  );
}

export default AboutOverlay;
