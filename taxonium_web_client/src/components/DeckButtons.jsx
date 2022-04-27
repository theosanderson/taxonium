
import {
    BiZoomIn,
    BiZoomOut,
    BiCamera,
    BiMoveVertical,
    BiMoveHorizontal,
  } from "react-icons/bi";
  
  import { TiZoom , TiCog} from "react-icons/ti";
  import { ClipLoader } from "react-spinners";
export const  DeckButtons = ({loading, setZoomAxis, zoomAxis,snapshot,zoomIncrement, requestOpenSettings})=>{
return <div style={{ position: "absolute", right: "0.2em", bottom: "0.2em" }}>
{loading && (
  <div className="mr-4 inline-block">
    <ClipLoader size={24} color="#444444" />
  </div>
)}
<button
  className=" w-12 h-10 bg-gray-100 ml-1 p-1 rounded border-gray-300 text-gray-700  opacity-60  hover:opacity-100 mr-1"
  onClick={() => {
    requestOpenSettings();
  }}
>
  <TiCog className="mx-auto w-5 h-5 inline-block" />
</button>
<button
  className=" w-16 h-10 bg-gray-100 mr-1 p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
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
</button>

<button
  className=" w-12 h-10 bg-gray-100  mr-1 p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
  onClick={() => {
    snapshot();
  }}
>
  <BiCamera className="mx-auto  w-5 h-5 inline-block" />
</button>
<button
  className=" w-12 h-10 bg-gray-100  p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
  onClick={() => {
    zoomIncrement(0.6);
  }}
>
  <BiZoomIn className="mx-auto  w-5 h-5 inline-block" />
</button>
<button
  className=" w-12 h-10 bg-gray-100 ml-1 p-1 rounded border-gray-300 text-gray-700  opacity-60  hover:opacity-100"
  onClick={() => {
    zoomIncrement(-0.6);
  }}
>
  <BiZoomOut className="mx-auto w-5 h-5 inline-block" />
</button>
</div>

}