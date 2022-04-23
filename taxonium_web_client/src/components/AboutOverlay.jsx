import React from "react";

function AboutOverlay({ enabled, setEnabled, overlayRef }) {
  return (
    <div className={`w-full ${enabled ? "" : "hidden"}`}>
      <div
        onClick={() => setEnabled(false)}
        className="fixed w-full h-full bg-black opacity-80 z-40"
      ></div>
      <div
        onClick={() => setEnabled(false)}
        className="fixed w-full h-full  opacity-100 z-40"
      >
        <div
          className=" relative mx-auto mt-5 p-5 bg-white shadow-md z-100 w-4/5 overflow-y-auto opacity-100 "
          style={{ height: "90vh" }}
        >
          <button
            className="absolute top-5 right-5 text-xl font-bold"
            onClick={() => setEnabled(false)}
          >
            X
          </button>
           
          <div ref={overlayRef}>
            
          </div>
            
        </div>{" "}
      </div>
    </div>
  );
}

export default AboutOverlay;
