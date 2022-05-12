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
            <div className="m-5">
              <h2 className="font-bold mb-3">Welcome to Taxonium</h2>
              <p className="mb-1">
                Taxonium is a web application for visualizing phylogenetic
                trees. Find out more at our{" "}
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
          </div>
        </div>{" "}
      </div>
    </div>
  );
}

export default AboutOverlay;
