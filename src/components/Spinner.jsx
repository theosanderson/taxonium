import React from "react";
import "./Spinner.css"

function Spinner({isShown}) {
    if(isShown){

    

  return (
      <div class="w-full h-full fixed bg-white"> <div class="loader z-50">Loading...</div></div>
   
  )
    }
    else{
        return <></>
    }
}

export default Spinner;
