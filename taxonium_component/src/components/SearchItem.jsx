import React, { useEffect } from "react";
import DebounceInput from "./DebounceInput";
import { Select } from "./Basic";
import { getDefaultSearch } from "../utils/searchUtil";
const number_methods = [">", "<", ">=", "<=", "=="];

// title case
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

const bool_methods = ["and", "or", "not"];
const SearchItem = ({ singleSearchSpec, setThisSearchSpec, config }) => {
  const types = config.search_types ? config.search_types : [];

  const all_amino_acids = "ACDEFGHIKLMNPQRSTVWY".split("");
  const mut_aa_options = ["any"].concat(all_amino_acids).concat(["*"]);
  const gen_aa_options = all_amino_acids.concat(["*"]);

  useEffect(() => {
    if (
      singleSearchSpec.type === "genotype" &&
      (!singleSearchSpec.new_residue ||
        !gen_aa_options.includes(singleSearchSpec.new_residue))
    ) {
      setThisSearchSpec({
        ...singleSearchSpec,
        new_residue: "A",
        position: 0,
        gene: config.genes[0],
      });
    }
  }, [singleSearchSpec.type, singleSearchSpec.new_residue]);

  useEffect(() => {
    if (
      singleSearchSpec.type === "mutation" &&
      (!singleSearchSpec.new_residue ||
        !mut_aa_options.includes(singleSearchSpec.new_residue) ||
        (config.genes && !config.genes.includes(singleSearchSpec.gene)))
    ) {
      setThisSearchSpec({
        ...singleSearchSpec,
        new_residue: "any",
        position: 0,
        gene: config.genes[0],
      });
    }
  }, [singleSearchSpec.type, singleSearchSpec.new_residue]);

  // if method is number and number is not set and number_method is not set, set number_method to "="
  useEffect(() => {
    if (
      singleSearchSpec.method === "number" &&
      !singleSearchSpec.number &&
      !singleSearchSpec.number_method
    ) {
      setThisSearchSpec({
        ...singleSearchSpec,
        number_method: "==",
        number: 0,
      });
    }
  }, [
    singleSearchSpec.method,
    singleSearchSpec.number,
    singleSearchSpec.number_method,
  ]);

  const text_types = ["text_exact", "text_match"];

  const specific_configurations = Object.fromEntries(
    types.map((type) => {
      const obj = {
        method: type.type,
      };
      if (type.controls) {
        obj.controls = type.controls;
      }

      return [type.name, obj];
    })
  );

  const setTypeTo = (type) => {
    setThisSearchSpec({
      ...singleSearchSpec,
      type: type,
      ...specific_configurations[type],
    });
  };

  const is_text = text_types.includes(singleSearchSpec.method);

  const is_multi_text = singleSearchSpec.method === "text_per_line";

  /* if this spec type is boolean and it lacks subspecs, add an empty value */
  if (singleSearchSpec.type === "boolean" && !singleSearchSpec.subspecs) {
    singleSearchSpec.subspecs = [];
  }
  /* if this spec type is boolean and it lacks a boolean method, set it to and*/
  if (singleSearchSpec.type === "boolean" && !singleSearchSpec.boolean_method) {
    singleSearchSpec.boolean_method = "and";
  }

  return (
    <>
      <Select
        className="inline-block w-42  border py-1 px-1 text-grey-darkest text-sm mr-1"
        value={singleSearchSpec.type}
        onChange={(e) => setTypeTo(e.target.value)}
      >
        {types.map((type) => (
          <option key={type.name} value={type.name}>
            {type.label}
          </option>
        ))}
      </Select>
      {is_text && (
        <DebounceInput
          className="inline-block w-40 border py-1 px-1 text-grey-darkest text-sm"
          value={singleSearchSpec.text}
          onChange={(e) =>
            setThisSearchSpec({
              ...singleSearchSpec,
              text: e.target.value,
            })
          }
        />
      )}
      {is_multi_text && (
        <DebounceInput
          element="textarea"
          className="block w-56 h-32 border py-1 px-1 text-grey-darkest text-sm"
          value={singleSearchSpec.text}
          onChange={(e) =>
            setThisSearchSpec({
              ...singleSearchSpec,
              text: e.target.value,
            })
          }
        />
      )}
      {(is_text || is_multi_text) && singleSearchSpec.controls && (
        <>
          <label
            title="Exact match"
            className="inline-block text-xs text-gray-400 pl-2 pr-3"
          >
            <input
              type="checkbox"
              title="Exact match"
              checked={
                singleSearchSpec.method === "text_exact" || is_multi_text
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: "text_exact",
                  });
                } else {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: "text_match",
                  });
                }
              }}
            />{" "}
            x{" "}
          </label>
          <label
            title="Multi-line"
            className="inline-block text-xs text-gray-400"
          >
            <input
              type="checkbox"
              title="Multi-line"
              checked={is_multi_text}
              onChange={(e) => {
                if (e.target.checked) {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: "text_per_line",
                  });
                } else {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: "text_match",
                  });
                }
              }}
            />{" "}
            m{" "}
          </label>
        </>
      )}

      {(singleSearchSpec.type === "mutation" ||
        singleSearchSpec.type === "genotype") && (
        <div className="pl-11 pt-2 text-gray-700">
          {singleSearchSpec.type === "genotype" && (
            <div className="text-sm -mt-1">
              (N.B. genotype searches are slow, where possible use{" "}
              <i>mutation</i> searches instead)
            </div>
          )}

          <div className="mt-2">
            <label className="text-sm mr-2 ">Gene: </label>
            <Select
              value={singleSearchSpec.gene}
              onChange={(e) =>
                setThisSearchSpec({ ...singleSearchSpec, gene: e.target.value })
              }
              className="inline-block w-40 border py-1 px-1 text-grey-darkest text-sm h-8"
            >
              {config.genes &&
                config.genes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </Select>
          </div>
          <div className="pt-2">
            <label className="text-sm">
              {toTitleCase(singleSearchSpec.type)} at residue{" "}
            </label>
            <DebounceInput
              type="number"
              value={singleSearchSpec.position}
              onChange={(e) =>
                setThisSearchSpec({
                  ...singleSearchSpec,
                  position: e.target.value,
                })
              }
              className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
            />
            <label className="text-sm">
              &nbsp;{singleSearchSpec.type === "mutation" ? <>to</> : <>of</>}
              &nbsp;
            </label>
            <Select
              value={singleSearchSpec.new_residue}
              onChange={(e) => {
                setThisSearchSpec({
                  ...singleSearchSpec,
                  new_residue: e.target.value,
                });
              }}
              className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
            >
              {(singleSearchSpec.type === "mutation"
                ? mut_aa_options
                : gen_aa_options
              ).map((aa) => (
                <option key={aa} value={aa}>
                  {aa}
                </option>
              ))}
            </Select>
            <br />
          </div>
        </div>
      )}
      {(singleSearchSpec.type === "revertant" ||
        singleSearchSpec.type === "mutation") && (
        <div>
          <div className="pl-11 pt-3 text-gray-700">
            <label className="text-sm">with at least&nbsp; </label>
            <DebounceInput
              type="number"
              value={singleSearchSpec.min_tips}
              onChange={(e) =>
                setThisSearchSpec({
                  ...singleSearchSpec,
                  min_tips: e.target.value,
                })
              }
              className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
            />{" "}
            <label className="text-sm">descendants</label>
          </div>
        </div>
      )}
      {singleSearchSpec.type === "boolean" && (
        <>
          <Select
            value={singleSearchSpec.boolean_method}
            onChange={(e) =>
              setThisSearchSpec({
                ...singleSearchSpec,
                boolean_method: e.target.value,
              })
            }
            className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm mr-1"
          >
            {bool_methods.map((method) => (
              <option key={method} value={method}>
                {method.toUpperCase()}
              </option>
            ))}
          </Select>

          <div className="pl-5 pt-3 border-gray-300 border-solid border-2">
            {singleSearchSpec.subspecs.map((subspec, i) => (
              <div
                key={i}
                // divider style border at bottom
                className="pt-2  border-b-2 border-solid border-grey-light pb-2 mb-2"
              >
                <SearchItem
                  singleSearchSpec={subspec}
                  setThisSearchSpec={(new_subspec) => {
                    setThisSearchSpec({
                      ...singleSearchSpec,
                      subspecs: singleSearchSpec.subspecs.map(
                        (foundsubspec, i) =>
                          i === singleSearchSpec.subspecs.indexOf(subspec)
                            ? new_subspec
                            : foundsubspec
                      ),
                    });
                  }}
                  config={config}
                />
                {/* Deelete button */}
                <button
                  className="text-red-500 text-sm hover:text-red-700 ml-3"
                  onClick={() => {
                    setThisSearchSpec({
                      ...singleSearchSpec,
                      subspecs: singleSearchSpec.subspecs.filter(
                        (compsubspec, i) =>
                          i !== singleSearchSpec.subspecs.indexOf(subspec)
                      ),
                    });
                  }}
                >
                  X
                </button>
              </div>
            ))}
            {/* Add a button to add a new subspec */}
            <button
              className="inline-block w-32 mb-3 border py-1 px-1 text-grey-darkest text-sm"
              onClick={() => {
                setThisSearchSpec({
                  ...singleSearchSpec,
                  subspecs: [
                    ...singleSearchSpec.subspecs,
                    getDefaultSearch(config),
                  ],
                });
              }}
            >
              Add sub-search
            </button>
          </div>
        </>
      )}
      {singleSearchSpec.method === "number" && (
        // heading with name
        // interface with select box for less than, greater than, greater than or equal to, less than or equal to, equal to
        // then a number input
        <div>
          <Select
            value={singleSearchSpec.number_method}
            onChange={(e) =>
              setThisSearchSpec({
                ...singleSearchSpec,
                number_method: e.target.value,
              })
            }
            className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm mr-1"
          >
            {number_methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <DebounceInput
            type="number"
            value={singleSearchSpec.number}
            onChange={(e) =>
              setThisSearchSpec({
                ...singleSearchSpec,
                number: e.target.value,
              })
            }
            className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
          />
        </div>
      )}
    </>
  );
};

export default SearchItem;
