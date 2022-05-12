import { useMemo, useState } from "react";

function guessIfCompressed(file_object) {
  //return true if gzipped and false if not
  const file_type = file_object.type;
  const file_name = file_object.name.toLowerCase();
  if (file_type === "application/gzip" || file_name.endsWith(".gz")) {
    return true;
  }
  return false;
}

function guessType(file_object) {
  // first strip off any gz from the end of lowercase name and get extension
  const file_name = file_object.name.toLowerCase().replace(".gz", "");
  const file_extension = file_name.split(".").pop();

  const tree_extensions = ["nwk", "newick", "tree", "tre"];
  if (tree_extensions.includes(file_extension)) {
    return "nwk";
  }
  if (file_extension === "jsonl") {
    return "jsonl";
  }
  if (file_extension === "csv") {
    return "meta_csv";
  }
  if (file_extension === "tsv") {
    return "meta_tsv";
  } else {
    window.alert(
      "Alert: unrecognised file type, supported types: jsonl (taxonium), nwk (newick), csv, tsv"
    );
    return "jsonl";
  }
}

export const useInputHelper = ({setUploadedData, updateQuery}) => {
  const [inputs, setInputs] = useState([]);

  function addInput(file_object, data) {
    const gzipped = guessIfCompressed(file_object);
    const filetype = guessType(file_object);
    setInputs([
      ...inputs,
      {
        name: file_object.name,
        data: data,
        mimetype: file_object.type,
        size: file_object.size,
        filetype: filetype,
        gzipped: gzipped,
        supplyType: file_object.supplyType,
        ladderize: true
      },
    ]);
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      //setUploadedData(reader.result);

      if (file.name.includes(".pb")) {
        // V1 format
        window.alert(
          "It looks like you are trying to load a Taxonium V1 proto. We will now redirect you to the V1 site. Please retry the upload from there."
        );
        window.location.href =
          "https://cov2tree-git-v1-theosanderson.vercel.app/";
      } else {
        const result = reader.result;
        file.supplyType = "file";
        addInput(file, result);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  const [validity, validityMessage]= useMemo(() => {
    if (inputs.length === 0) {
        return ["invalid", "No files selected"];
    } 
    // if there is a jsonl file, it must be the only file
    if (inputs.some((input) => input.filetype === "jsonl") && inputs.length > 1) {
        return ["invalid", "If using Taxonium JSONL files, you can only use a single file at present"];
    }
    // can't have more than one metadata file
    if (inputs.filter((input) => input.filetype.startsWith("meta_")).length > 1) {
        return ["invalid", "You can only use a single metadata file"];
    }
    // can't have more than one tree file
    if (inputs.filter((input) => input.filetype === "nwk").length > 1) {
        return ["invalid", "You can only use a single tree file"];
    }
    // must have a tree file or a jsonl
    if (inputs.filter((input) => input.filetype === "jsonl").length === 0 && inputs.filter((input) => input.filetype === "nwk").length === 0) {
        return ["invalid", "You must include a tree, not just metadata"];
    }
    return ["valid", ""];
}, [inputs]);


  function removeInput(index) {
    setInputs(inputs.filter((_, i) => i !== index));
  }

  function addFromURL(url) {
    const file_obj = { name: url, supplyType: "url" };
    addInput(file_obj);
  }

  function finaliseInputs() {
    setInputs([]);

  }

  return {
    inputs,
    setInputs,
    readFile,
    removeInput,
    addInput,
    addFromURL,
    finaliseInputs,
    validity,
    validityMessage
  };
};
