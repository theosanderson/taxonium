import React, { useRef, useCallback } from "react";

function TaxoniumLoader({
  readFile
}) {
  const fileSelector = useRef();

  const supplyTaxoniumData = useCallback(() => {
    const file = fileSelector.current.files[0];
    if (file) {
      readFile(file)
    }
  
  }, [readFile]);



  return (
    <div>
          <input
            type="file"
            id="files"
            ref={fileSelector}
            onChange={supplyTaxoniumData}
          />
       </div>
  );
}

export default TaxoniumLoader;
