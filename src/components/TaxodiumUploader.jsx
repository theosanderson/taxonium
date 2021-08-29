import React, { useRef, useCallback } from "react";

function TaxodiumLoader({
  setUploadedData
}) {
  const fileSelector = useRef();

  const supplyTaxodiumData = useCallback(() => {
    const file = fileSelector.current.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedData(reader.result);
      };
      reader.readAsArrayBuffer(file);
    }
  
  }, [setUploadedData]);



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
