import { useState, useCallback, useEffect } from "react";
import { BsTrash, BsQuestionCircle } from "react-icons/bs";
import { Button, Select } from "./Basic";
import { BiFile, BiLink } from "react-icons/bi";
import ReactTooltip from "react-tooltip";

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
  useEffect(() => {
    ReactTooltip.rebuild();
  });

  const [tempURL, setTempURL] = useState("");

  const { inputs, setInputs } = inputHelper;

  const addFromTempURL = useCallback(() => {
    if (tempURL) {
      inputHelper.addFromURL(tempURL);
      setTempURL("");
    }
  }, [tempURL, inputHelper]);

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
              {/*}
              <label>
                Is Gzipped{" "}
                <input
                  type="checkbox"
                  checked={input.gzipped}
                  className="border p-1 mr-4"
                  onChange={(e) => {
                    setInputs(
                      inputs.map((input, this_index) => {
                        if (this_index === index) {
                          input.gzipped = e.target.checked;
                        }
                        return input;
                      })
                    );
                  }}
                />
                </label>*/}

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
                  data-tip="Ladderizing will preserve the tree's topology, but sort the nodes according to how many descendants they have"
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
            setTempURL(
              e.target.value
                .replace("http://", "")
                .replace("http://", "https://")
            );
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              addFromTempURL();
            }
          }}
        />{" "}
        <Button onClick={addFromTempURL} className="">
          Add
        </Button>
      </div>
    </div>
  );
};

export default InputSupplier;
