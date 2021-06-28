import React from "react";
import "./Spinner.css";

function Spinner({ isShown }) {
  if (isShown) {
    return (
      <div className="w-full h-full fixed bg-white">
        {" "}
        <div className="loader z-50">Loading...</div>
        <div className="text-black">Loading</div>
      </div>
    );
  } else {
    return <></>;
  }
}

export default Spinner;
