import React, {useRef, useCallback} from "react";

function GISAIDLoader({setGisaid,enabled,setGisaidLoaderEnabled}) {

    

    const fileSelector = useRef();
    const bar = useRef();


    const supplyGISAIDdata = useCallback(() => {
        let lookup = {}
    
      const theFile = fileSelector.current.files[0];
      let reader = new FileReader();
      reader.addEventListener("load", function (e) {
        let text = e.target.result;
        window.text = text;
        const lines = text.split("\n");
        lines.shift();
        lines.pop();
        lines.forEach((x) => {
          const entries = x.split("\t");
          lookup[entries[0]] = entries[18];
        });
        chunk_count += 1;


        const prop = 100*chunk_count*chunk_size/theFile.size
        bar.current.style.width=""+prop+"%"
  
        if (chunk_size * chunk_count > theFile.size) {
          setGisaid(lookup)
          setGisaidLoaderEnabled(false)
          return;
        }
    
        e.target.readAsText(
            theFile.slice(
            chunk_size * chunk_count,
            chunk_size * (chunk_count + 1) + 2000
          )
        );
  
        //console.log(text.byteLength);
        //const result = pako.inflate(text, { to: "string" });
        //const out = result;
        //window.out = out;
        //console.log("dpme", out.length);
      });
      const chunk_size = 1000000;
      let  chunk_count = 0;
      reader.readAsText(
        theFile.slice(
          chunk_size * chunk_count,
          chunk_size * chunk_count + 2000
        )
      );
    }, [fileSelector, setGisaidLoaderEnabled, setGisaid]);


  return (<div className={`${enabled ? "" : "hidden"}`}>
    <div className="fixed w-full h-full bg-black opacity-80 z-40"> </div>
    <div className="fixed m-10 p-5 bg-white shadow-md z-50">
        <button className="absolute top-5 right-5 text-xl font-bold" onClick={()=> setGisaidLoaderEnabled(false)}>X</button>
      <h1 className="font-bold mb-5 text-xl">Import GISAID metadata</h1>
      <p>
          The GISAID database licence does not allow us to redistribute of metadata on sequences contained within it. Therefore, to add GISAID metadata to this visualisation, you will need to download it and then add it yourself. The metadata file will remain on your computer: it will not be uploaded to any server.
      </p>
      <p className="mb-5 mt-10">Step 1: If you have not already, <a className="text-blue-800 underline" href="https://www.gisaid.org/registration/register/">Register for a GISAID account</a> and wait for approval.</p>
      <p className="mb-5">Step 2: Once approved, sign in and go to EpiCov -&gt; Downloads -&gt; Genomic epidemiology -&gt; metadata </p>
      <p className="mb-5">Step 3: Unzip the metadata_yyyy_mm_dd.tsv.gz file</p>
      <p className="mb-5">Step 4: Select the unzipped metadata.tsv file:  <input
              type="file"
              id="files"
              ref={fileSelector}
              onChange={supplyGISAIDdata}
            /></p>

            <div className="mx-auto h-7 w-4/5 bg-gray-200 mt-5">

            <div className=" h-7 bg-green-700 w-0 inline-block" ref={bar}></div>
            </div>
      
    </div></div>
  );
}

export default GISAIDLoader;
