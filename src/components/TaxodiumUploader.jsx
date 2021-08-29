import React, { useRef, useCallback } from "react";

function TaxodiumLoader({
  readFile
}) {
  const fileSelector = useRef();

  const supplyTaxodiumData = useCallback(() => {
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
            onChange={supplyTaxodiumData}
          />
       </div>
  );
}

export default TaxodiumLoader;
