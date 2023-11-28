import { useMemo, useState, useEffect, useCallback } from "react";

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

  const tree_extensions = [
    "nwk",
    "newick",
    "contree",
    "tree",
    "tre",
    "nh",
    "phy",
    "nw",
    "treefile",
    "rooted",
  ];

  if (tree_extensions.includes(file_extension)) {
    return "nwk";
  }

  if (file_extension === "nexus" || file_extension === "nex") {
    return "nexus";
  }

  if (file_extension === "jsonl") {
    return "jsonl";
  }
  if (file_extension === "csv") {
    return "meta_csv";
  }
  if (file_extension === "tsv") {
    return "meta_tsv";
  }
  if (file_extension === "json") {
    return "nextstrain";
  } else {
    return "unknown";
  }
}

export const useInputHelper = ({
  setUploadedData,
  updateQuery,
  query,
  uploadedData,
}) => {
  const [inputs, setInputs] = useState([]);

  function addInput(file_object, data) {
    if (window.gtag) {
      window.gtag("event", "addInput", {
        event_category: "addInput",
        event_label: file_object.name,
      });
    }
    const gzipped = guessIfCompressed(file_object);
    const filetype = guessType(file_object);
    setInputs((inputs) => [
      ...inputs,
      {
        name: file_object.name,
        data: data,
        mimetype: file_object.type,
        size: file_object.size,
        filetype: filetype,
        gzipped: gzipped,
        supplyType: file_object.supplyType,
        ladderize: true,
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

  const [validity, validityMessage] = useMemo(() => {
    if (inputs.length === 0) {
      return ["invalid", "No files selected"];
    }

    // if there is a jsonl file, it must be the only file
    if (
      inputs.some((input) => input.filetype === "jsonl") &&
      inputs.length > 1
    ) {
      return [
        "invalid",
        "If using Taxonium JSONL files, you can only use a single file at present",
      ];
    }
    // can't have more than one metadata file
    if (
      inputs.filter((input) => input.filetype.startsWith("meta_")).length > 1
    ) {
      return ["invalid", "You can only use a single metadata file"];
    }
    // can't have more than one tree file
    if (
      inputs.filter(
        (input) => input.filetype === "nwk" || input.filetype === "nexus"
      ).length > 1
    ) {
      return ["invalid", "You can only use a single tree file"];
    }
    if (inputs.some((input) => input.filetype === "unknown")) {
      return ["invalid", "Please select the type of each file"];
    }
    // must have a tree file or a jsonl
    if (
      inputs.filter((input) => input.filetype === "jsonl").length === 0 &&
      inputs.filter(
        (input) => input.filetype === "nwk" || input.filetype === "nexus"
      ).length === 0 &&
      inputs.filter((input) => input.filetype === "nextstrain").length === 0
    ) {
      return [
        "invalid",
        "You must also add a tree file to go with your metadata",
      ];
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

  function addFromText(text) {
    const file_obj = { name: "text.nwk", supplyType: "file" };
    file_obj.filetype = "nwk";
    file_obj.data = text;
    addInput(file_obj, text);
  }

  const finaliseInputs = useCallback(() => {
    // if everything is a URL:
    if (inputs.every((input) => input.supplyType === "url")) {
      // if the input is a taxonium file
      if (inputs[0].filetype === "jsonl") {
        updateQuery({ protoUrl: inputs[0].name });
      } else {
        const meta_file = inputs.find((input) =>
          input.filetype.startsWith("meta_")
        );
        const tree_file = inputs.find(
          (input) =>
            input.filetype === "nwk" ||
            input.filetype === "nextstrain" ||
            input.filetype === "nexus"
        );
        const newQuery = {
          treeUrl: tree_file.name,
          ladderizeTree: tree_file.ladderize === true,
          treeType: tree_file.filetype,
        };
        if (meta_file) {
          newQuery.metaUrl = meta_file.name;
          newQuery.metaType = meta_file.filetype;
        }
        updateQuery(newQuery);
      }
    } else {
      if (inputs[0].filetype === "jsonl") {
        setUploadedData({
          status: "loaded",
          filename: inputs[0].name,
          data: inputs[0].data,
          filetype: inputs[0].filetype,
        });
        return;
      }

      const upload_obj = {};
      // if there is some metadata find it
      const meta_file = inputs.find((input) =>
        input.filetype.startsWith("meta_")
      );
      if (meta_file) {
        upload_obj.metadata = {
          filename: meta_file.name,
          data: meta_file.data,
          status: meta_file.supplyType === "url" ? "url_supplied" : "loaded",
          filetype: meta_file.filetype,
        };
      }

      // if there is a tree file find it
      const tree_file = inputs.find(
        (input) =>
          input.filetype === "nwk" ||
          input.filetype === "nextstrain" ||
          input.filetype === "nexus"
      );

      upload_obj.filename = tree_file.name;
      upload_obj.data = tree_file.data;
      upload_obj.status =
        tree_file.supplyType === "url" ? "url_supplied" : "loaded";
      upload_obj.filetype = tree_file.filetype;
      upload_obj.ladderize = tree_file.ladderize;
      setUploadedData(upload_obj);
    }
  }, [inputs, updateQuery, setUploadedData]);

  useEffect(() => {
    // if there is a single file and it is a jsonl file, then finalise
    if (inputs.length === 1 && inputs[0].filetype === "jsonl") {
      finaliseInputs();
    }
  }, [inputs, finaliseInputs]);

  useEffect(() => {
    if (query.protoUrl && !uploadedData) {
      setUploadedData({
        status: "url_supplied",
        filename: query.protoUrl,
        filetype: "jsonl",
      });
    }
    if (query.treeUrl && !uploadedData) {
      console.log("tree url set");
      const extra = {};
      if (query.metaUrl) {
        extra.metadata = {
          filename: query.metaUrl,
          filetype: query.metaType
            ? query.metaType
            : query.metaUrl.includes("csv")
            ? "meta_csv"
            : "meta_tsv",
          status: "url_supplied",
          taxonColumn: query.taxonColumn,
        };
      }
      setUploadedData({
        status: "url_supplied",
        filename: query.treeUrl,
        ladderize: query.ladderizeTree === "true",
        filetype: query.treeType ? query.treeType : "nwk",
        ...extra,
      });
    }
  }, [query, setUploadedData, uploadedData]);

  return {
    inputs,
    setInputs,
    readFile,
    removeInput,
    addInput,
    addFromURL,
    addFromText,
    finaliseInputs,
    validity,
    validityMessage,
  };
};
