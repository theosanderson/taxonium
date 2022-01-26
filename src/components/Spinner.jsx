import React from "react";


function Spinner({ isShown, progress }) {
  if (isShown) {
    return (
      <div className="w-full h-full fixed bg-white text-center">
        {" "}
        <div className="loader z-50">Loading...</div>
        <div className="text-black">Loading {progress}%</div>
      </div>
    );
  } else {
    return <></>;
  }
}

export default Spinner;
