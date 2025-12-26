import {
  BiZoomIn,
  BiZoomOut,
  BiCamera,
  BiMoveVertical,
  BiMoveHorizontal,
} from "react-icons/bi";
import { CgListTree } from "react-icons/cg";

import { TiZoom, TiCog } from "react-icons/ti";

import { MdOutlineZoomOutMap } from "react-icons/md";
import { ClipLoader } from "react-spinners";
import TaxButton from "./TaxButton";
import SnapshotButton from "./SnapshotButton";
import type { DeckSize } from "../types/common";
import type { Settings } from "../types/settings";

interface DeckButtonsProps {
  loading: boolean;
  setZoomAxis: (axis: string) => void;
  zoomAxis: string;
  snapshot: () => void;
  zoomIncrement: (delta: number, axis: string) => void;
  requestOpenSettings: () => void;
  zoomReset: () => void;
  settings: Settings;
  deckSize: DeckSize;
  triggerSVGdownload: () => void;
}

export const DeckButtons = ({
  loading,
  setZoomAxis,
  zoomAxis,
  snapshot,
  zoomIncrement,
  requestOpenSettings,
  zoomReset,
  settings,
  deckSize,
  triggerSVGdownload,
}: DeckButtonsProps) => {
  return (
    <div
      style={{
        position: "absolute",
        right: "0em",
        bottom: "0em",
        zIndex: 2,
        pointerEvents: "none",
      }}
      className="flex flex-col items-end"
    >
      <div
        className="flex justify-end "
        style={{
          marginBottom: "0em",
          marginRight: "0em",
        }}
      >
        {loading && (
          <div className="mr-4 mt-auto inline-block">
            <ClipLoader size={24} color="#444444" />
          </div>
        )}
        <div
          className="text-gray-800  mr-4 mt-auto mb-1 bg-white
      opacity-50 px-1 hover:opacity-100 rounded hidden min-[475px]:inline-block
      "
          style={{
            fontSize: ".7em",
            pointerEvents: "auto",
            boxShadow: "0px -3px 4px  4px rgba(255, 255, 255, 1)",
          }}
        >
          <a
            href="https://taxonium.org"
            target="_blank"
            className="no-underline hover:underline"
          >
            <CgListTree className="inline-block mr-1 w-3 h-3 inline-block" />
            Taxonium
          </a>
        </div>
        <TaxButton
          onClick={() => {
            requestOpenSettings();
          }}
          title="Settings"
        >
          <TiCog className="mx-auto w-5 h-5 inline-block" />
        </TaxButton>
        {/*<TaxButton
        onClick={() => {
          setZoomAxis(zoomAxis === "X" ? "Y" : "X");
        }}
        title={
          zoomAxis === "X"
            ? "Switch to vertical zoom"
            : "Switch to horizontal zoom (you can also hold Ctrl key)"
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
        </TaxButton>*/}
        <TaxButton
          onClick={() => {
            zoomReset();
          }}
          title="Reset zoom"
        >
          <MdOutlineZoomOutMap className="mx-auto  w-5 h-5 inline-block " />
        </TaxButton>
        <SnapshotButton
          svgFunction={triggerSVGdownload}
          pixelFunction={snapshot}
          deckSize={deckSize}
        />

        <div className="">
          <div>
            <TaxButton
              onClick={() => {
                zoomIncrement(0.6, "Y");
              }}
              title="Zoom in vertically"
            >
              <BiZoomIn className="mx-auto  w-5 h-5 inline-block" />
              <BiMoveVertical className="mx-auto  w-3 h-3 inline-block" />
            </TaxButton>
            <TaxButton
              onClick={() => {
                zoomIncrement(-0.6, "Y");
              }}
              title="Zoom out vertically"
            >
              <BiZoomOut className="mx-auto w-5 h-5 inline-block" />
              <BiMoveVertical className="mx-auto  w-3 h-3 inline-block" />
            </TaxButton>
          </div>
          <div>
            <TaxButton
              onClick={() => {
                zoomIncrement(0.6, "X");
              }}
              title="Zoom in horizontally"
            >
              <BiZoomIn className="mx-auto  w-5 h-5 inline-block" />
              <BiMoveHorizontal className="mx-auto  w-3 h-3 inline-block" />
            </TaxButton>
            <TaxButton
              onClick={() => {
                zoomIncrement(-0.6, "X");
              }}
              title="Zoom out horizontally"
            >
              <BiZoomOut className="mx-auto w-5 h-5 inline-block" />
              <BiMoveHorizontal className="mx-auto  w-3 h-3 inline-block" />
            </TaxButton>
          </div>
        </div>
      </div>
    </div>
  );
};
