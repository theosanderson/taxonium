import { useState, useCallback } from "react";
import { BsTrash, BsQuestionCircle } from "react-icons/bs";
import { Button, Select } from "./Basic";
import { BiFile, BiLink } from "react-icons/bi";

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const prettyTypes = {
  jsonl: "Taxonium JSONL",
  nwk: "Newick tree",
  nexus: "Nexus tree",
  meta_tsv: "Metadata TSV",
  meta_csv: "Metadata CSV",
  nextstrain: "Nextstrain JSON",
  unknown: "Unknown (please select)",
};
const fileTypes = Object.keys(prettyTypes);

export const InputSupplier = ({ inputHelper, className }) => {
  const [tempURL, setTempURL] = useState("");
  const [useProxy, setUseProxy] = useState(false); // New state for proxy usage

  const { inputs, setInputs } = inputHelper;
  const [addingText, setAddingText] = useState(false);
  const [text, setText] = useState("");

  const addFromTempURL = useCallback(() => {
    let finalURL = tempURL;
    if (useProxy) {
      finalURL = `https://proxy.taxonium.org/proxy?url=${encodeURIComponent(
        tempURL
      )}`;
    }
    if (finalURL) {
      inputHelper.addFromURL(finalURL);
      setTempURL("");
    }
  }, [tempURL, useProxy, inputHelper]); // Include useProxy in the dependency array

  return (
    <div className={className}>
      {inputs.length > 0 && <h2>Input files</h2>}
      {inputs.map((input, index) => {
        return (
          <div key={index} className="p-3 m-3 border  text-sm">
            <div>
              <div className="inline-block">
                {input.supplyType === "file" ? <BiFile /> : <BiLink />}
              </div>
              {input.name}
              {input.size ? (
                <span className="text-xs text-gray-500">
                  ({formatBytes(input.size)})
                </span>
              ) : (
                ""
              )}
            </div>
            <div>
              <Select
                value={input.filetype}
                className="border p-1 mr-4 text-sm"
                onChange={(e) => {
                  setInputs(
                    inputs.map((input, the_index) => {
                      if (the_index === index) {
                        input.filetype = e.target.value;
                      }
                      return input;
                    })
                  );
                }}
              >
                {fileTypes.map((filetype, index) => {
                  return (
                    <option key={index} value={filetype}>
                      {prettyTypes[filetype]}
                    </option>
                  );
                })}
              </Select>

              <Button
                className="inline-block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
                onClick={() => {
                  inputHelper.removeInput(index);
                }}
              >
                <BsTrash className="inline-block mx-1" />
              </Button>
            </div>{" "}
            {input.filetype === "nwk" && (
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={input.ladderize}
                    className="mr-1"
                    onChange={(e) => {
                      setInputs(
                        inputs.map((input, this_index) => {
                          if (this_index === index) {
                            input.ladderize = e.target.checked;
                          }
                          return input;
                        })
                      );
                    }}
                  />{" "}
                  Ladderize tree
                </label>{" "}
                <button
                  style={{ cursor: "default" }}
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content="Ladderizing will preserve the tree's topology, but sort the nodes according to how many descendants they have"
                >
                  <span
                    style={{
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  >
                    <BsQuestionCircle />
                  </span>
                </button>
              </div>
            )}
            {input.filetype.startsWith("meta_") && (
              <div className="text-italic">
                The left-most column in your metadata must be the name of the
                taxon.
              </div>
            )}
          </div>
        );
      })}
      {inputs.length > 0 && inputHelper.validityMessage && (
        <div>
          <div className="text-red-500">{inputHelper.validityMessage}</div>
        </div>
      )}
      {inputs.length > 0 && inputHelper.validity === "valid" && (
        <div className="border-b mb-2">
          <div>
            <Button
              className="text-md p-3 mb-6 font-bold"
              onClick={() => {
                inputHelper.finaliseInputs();
              }}
            >
              Launch Taxonium
            </Button>
          </div>
        </div>
      )}
      <div className="mb-3">
        Select, drag-and-drop, or enter the URL for tree or metadata files
        (jsonl, newick, nextstrain, tsv, etc.):
      </div>
      {!addingText && (
        <>
          <div>
            <input
              className="text-sm mb-3"
              type="file"
              multiple="multiple"
              onChange={(e) => {
                for (const file of e.target.files) {
                  inputHelper.readFile(file);
                }

                // empty this
                e.target.value = "";
              }}
            />
          </div>
          <div>
            <input
              placeholder="https://"
              type="text"
              value={tempURL}
              className="border p-1 mr-1 text-sm "
              onChange={(e) => {
                setTempURL(e.target.value);
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  addFromTempURL();
                }
              }}
            />{" "}
            {tempURL !== "" && (
              <>
                <span className="mr-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={useProxy}
                    className=""
                    onChange={(e) => setUseProxy(e.target.checked)}
                  />{" "}
                  Use Proxy
                </span>
              </>
            )}
            <Button onClick={addFromTempURL} className="">
              Add
            </Button>
          </div>
        </>
      )}
      <div className="mt-3">
        <div className="text-xs text-gray-500">
          {addingText ? (
            <>
              <div>
                <textarea
                  className="border p-1 mr-1 text-sm md:w-1/2 w-full"
                  placeholder="Paste e.g. Newick tree here.."
                  onChange={(e) => {
                    setText(e.target.value);
                  }}
                  value={text}
                />
                <div className="mt-2">
                  <button
                    className="background-gray-100 text-sm p-1 rounded border-gray-300 border  text-gray-700"
                    onClick={() => {
                      inputHelper.addFromText(text);
                      setAddingText(false);
                      setText("");
                    }}
                  >
                    Add
                  </button>{" "}
                  <button
                    className="background-gray-100 text-sm p-1 rounded border-gray-300 border ml-3 text-gray-700"
                    onClick={() => {
                      setAddingText(false);
                      setText("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm">
              ..or use{" "}
              <button
                className="text-gray-700 hover:text-gray-700 hover:underline"
                onClick={() => {
                  setAddingText(true);
                }}
              >
                text entry
              </button>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputSupplier;
