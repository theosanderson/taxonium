import {
  BiZoomIn,
  BiZoomOut,
  BiCamera,
  BiMoveVertical,
  BiMoveHorizontal,
} from "react-icons/bi";

import { TiZoom, TiCog } from "react-icons/ti";
import { ClipLoader } from "react-spinners";

const TaxButton = ({ children, onClick }) => {
  return (
    <button
      className=" w-12 h-10 bg-gray-100 ml-1 p-1 rounded border-gray-300 text-gray-700  opacity-70  hover:opacity-100 mr-1 z-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const DeckButtons = ({
  loading,
  setZoomAxis,
  zoomAxis,
  snapshot,
  zoomIncrement,
  requestOpenSettings,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        right: "0.2em",
        bottom: "0.2em",
        zIndex: 10,
      }}
    >
      {loading && (
        <div className="mr-4 inline-block">
          <ClipLoader size={24} color="#444444" />
        </div>
      )}
      <TaxButton
        onClick={() => {
          requestOpenSettings();
        }}
      >
        <TiCog className="mx-auto w-5 h-5 inline-block" />
      </TaxButton>
      <TaxButton
        onClick={() => {
          setZoomAxis(zoomAxis === "X" ? "Y" : "X");
        }}
        title={
          zoomAxis === "X"
            ? "Switch to vertical zoom"
            : "Switch to horizontal zoom"
        }
      >
        <TiZoom className="mx-auto  w-5 h-5 inline-block m-0" />
        {zoomAxis === "Y" ? (
          <BiMoveVertical className="mx-auto  w-5 h-5 inline-block m-0" />
        ) : (
          <>
            <BiMoveHorizontal className="mx-auto  w-5 h-5 inline-block m-0" />
          </>
        )}
      </TaxButton>

      <TaxButton
        onClick={() => {
          snapshot();
        }}
      >
        <BiCamera className="mx-auto  w-5 h-5 inline-block" />
      </TaxButton>
      <TaxButton
        onClick={() => {
          zoomIncrement(0.6);
        }}
      >
        <BiZoomIn className="mx-auto  w-5 h-5 inline-block" />
      </TaxButton>
      <TaxButton
        onClick={() => {
          zoomIncrement(-0.6);
        }}
      >
        <BiZoomOut className="mx-auto w-5 h-5 inline-block" />
      </TaxButton>
    </div>
  );
};
