import React, { useEffect } from "react";
import DebounceInput from "./DebounceInput";
import { Select } from "./Basic";
import { getDefaultSearch } from "../utils/searchUtil";
import {
  SearchSpec,
  SearchMethod,
  NumberMethod,
  BooleanMethod,
} from "../types/search";
import type { Config, SearchType, Backend } from "../types/backend";
const number_methods = [
  NumberMethod.GT,
  NumberMethod.LT,
  NumberMethod.GTE,
  NumberMethod.LTE,
  NumberMethod.EQ,
];

// title case
const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

const bool_methods = [
  BooleanMethod.AND,
  BooleanMethod.OR,
  BooleanMethod.NOT,
];
interface SearchItemProps {
  singleSearchSpec: SearchSpec;
  setThisSearchSpec: (spec: SearchSpec) => void;
  config: Config;
  backend?: Backend;
}

const SearchItem = ({ singleSearchSpec, setThisSearchSpec, config, backend }: SearchItemProps) => {
  const types = (config.search_types as SearchType[]) ?? [];

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
        gene: (config.genes ?? [])[0] ?? "",
      });
    }
  }, [singleSearchSpec.type, singleSearchSpec.new_residue]);

  useEffect(() => {
    if (
      singleSearchSpec.type === "mutation" &&
      (!singleSearchSpec.new_residue ||
        !mut_aa_options.includes(singleSearchSpec.new_residue) ||
        (config.genes && !config.genes.includes(singleSearchSpec.gene ?? "")))
    ) {
      setThisSearchSpec({
        ...singleSearchSpec,
        new_residue: "any",
        position: 0,
        gene: (config.genes ?? [])[0] ?? "",
      });
    }
  }, [singleSearchSpec.type, singleSearchSpec.new_residue]);

  // if method is number and number is not set and number_method is not set, set number_method to "="
  useEffect(() => {
    if (
      singleSearchSpec.method === SearchMethod.NUMBER &&
      !singleSearchSpec.number &&
      !singleSearchSpec.number_method
    ) {
      setThisSearchSpec({
        ...singleSearchSpec,
        number_method: NumberMethod.EQ,
        number: 0,
      });
    }
  }, [
    singleSearchSpec.method,
    singleSearchSpec.number,
    singleSearchSpec.number_method,
  ]);

  const text_types = [SearchMethod.TEXT_EXACT, SearchMethod.TEXT_MATCH];

  const specific_configurations = Object.fromEntries(
    types.map((type: SearchType) => {
      const obj: { method: SearchMethod; controls?: boolean } = {
        method: type.type as SearchMethod,
      };
      if (type.controls) {
        obj.controls = type.controls;
      }

      return [type.name, obj];
    })
  );

  const setTypeTo = (type: any) => {
    setThisSearchSpec({
      ...singleSearchSpec,
      type: type,
      ...specific_configurations[type],
    });
  };

  const is_text = text_types.includes(
    (singleSearchSpec.method ?? "") as SearchMethod
  );

  const is_multi_text = singleSearchSpec.method === SearchMethod.TEXT_PER_LINE;

  // Ensure boolean searches always have subspecs and a boolean method
  const subspecs = singleSearchSpec.subspecs ?? [];
  const boolean_method = singleSearchSpec.boolean_method ?? BooleanMethod.AND;

  return (
    <>
      <Select
        className="inline-block w-42  border py-1 px-1 text-grey-darkest text-sm mr-1"
        value={singleSearchSpec.type}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setTypeTo(e.target.value)
        }
      >
        {types.map((type: SearchType) => (
          <option key={type.name} value={type.name}>
            {type.label}
          </option>
        ))}
      </Select>
      {is_text && (
        <DebounceInput
          className="inline-block w-40 border py-1 px-1 text-grey-darkest text-sm"
          value={singleSearchSpec.text ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
          value={singleSearchSpec.text ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
                singleSearchSpec.method === SearchMethod.TEXT_EXACT || is_multi_text
              }
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: SearchMethod.TEXT_EXACT,
                  });
                } else {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: SearchMethod.TEXT_MATCH,
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: SearchMethod.TEXT_PER_LINE,
                  });
                } else {
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    method: SearchMethod.TEXT_MATCH,
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setThisSearchSpec({ ...singleSearchSpec, gene: e.target.value })
              }
              className="inline-block w-40 border py-1 px-1 text-grey-darkest text-sm h-8"
            >
              {config.genes &&
                (config.genes as string[]).map((item: string) => (
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
              value={singleSearchSpec.position ?? 0}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setThisSearchSpec({
                  ...singleSearchSpec,
                  position: Number(e.target.value),
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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
              value={singleSearchSpec.min_tips ?? 0}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setThisSearchSpec({
                  ...singleSearchSpec,
                  min_tips: Number(e.target.value),
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
            value={boolean_method}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setThisSearchSpec({
                ...singleSearchSpec,
                boolean_method: e.target.value as BooleanMethod,
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
            {subspecs.map((subspec: SearchSpec, i: number) => (
              <div
                key={i}
                // divider style border at bottom
                className="pt-2  border-b-2 border-solid border-grey-light pb-2 mb-2"
              >
                <SearchItem
                  singleSearchSpec={subspec}
                  setThisSearchSpec={(new_subspec: SearchSpec) => {
                    setThisSearchSpec({
                      ...singleSearchSpec,
                      subspecs: subspecs.map(
                        (foundsubspec: SearchSpec, i: number) =>
                          i === subspecs.indexOf(subspec)
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
                  subspecs: subspecs.filter(
                        (compsubspec: SearchSpec, i: number) =>
                          i !== subspecs.indexOf(subspec)
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
                    ...subspecs,
                    getDefaultSearch(config as any),
                  ],
                });
              }}
            >
              Add sub-search
            </button>
          </div>
        </>
      )}
      {singleSearchSpec.method === SearchMethod.NUMBER && (
        // heading with name
        // interface with select box for less than, greater than, greater than or equal to, less than or equal to, equal to
        // then a number input
        <div>
          <Select
            value={singleSearchSpec.number_method}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setThisSearchSpec({
                ...singleSearchSpec,
                number_method: e.target.value as NumberMethod,
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
            value={singleSearchSpec.number ?? 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setThisSearchSpec({
                ...singleSearchSpec,
                number: Number(e.target.value),
              })
            }
            className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
          />
        </div>
      )}
      {singleSearchSpec.method === SearchMethod.SPECTRA && (
        <div className="pl-2 pt-2">
          <div className="text-sm text-gray-600 mb-2">
            Compare mutation spectra. Enter tab-separated context/count pairs (e.g., A[C&gt;T]G	10).
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {(singleSearchSpec.spectra ?? ["", ""]).map((spectrum, index) => (
              <div key={index} className="flex-1 min-w-48">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    {index === 0 ? "Target Spectrum:" : `Background ${index}:`}
                  </label>
                  {index > 1 && (
                    <button
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => {
                        const newSpectra = [...(singleSearchSpec.spectra ?? [])];
                        newSpectra.splice(index, 1);
                        setThisSearchSpec({
                          ...singleSearchSpec,
                          spectra: newSpectra,
                        });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <DebounceInput
                  element="textarea"
                  className="w-full h-32 border py-1 px-1 text-grey-darkest text-sm font-mono"
                  placeholder={"A[C>T]G\t10\nA[C>T]A\t5\n..."}
                  value={spectrum}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const newSpectra = [...(singleSearchSpec.spectra ?? ["", ""])];
                    newSpectra[index] = e.target.value;
                    setThisSearchSpec({
                      ...singleSearchSpec,
                      spectra: newSpectra,
                    });
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <button
              className="text-blue-600 text-sm hover:text-blue-800"
              onClick={() => {
                setThisSearchSpec({
                  ...singleSearchSpec,
                  spectra: [...(singleSearchSpec.spectra ?? ["", ""]), ""],
                });
              }}
            >
              + Add background spectrum
            </button>
            {backend?.getOverallSpectrum && (
              <button
                className="text-green-600 text-sm hover:text-green-800"
                onClick={() => {
                  backend.getOverallSpectrum((spectrum: string | null) => {
                    if (spectrum) {
                      const newSpectra = [...(singleSearchSpec.spectra ?? ["", ""])];
                      // Set the last background spectrum (index 1 or higher)
                      const targetIndex = newSpectra.length > 1 ? newSpectra.length - 1 : 1;
                      newSpectra[targetIndex] = spectrum;
                      setThisSearchSpec({
                        ...singleSearchSpec,
                        spectra: newSpectra,
                      });
                    }
                  });
                }}
              >
                Auto-infer background from tree
              </button>
            )}
          </div>
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm mr-2">Min mutations:</label>
              <DebounceInput
                type="number"
                value={singleSearchSpec.min_mutations ?? 1}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    min_mutations: Number(e.target.value),
                  })
                }
                className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
              />
            </div>
            <div>
              <label className="text-sm mr-2">Delta LL threshold:</label>
              <DebounceInput
                type="number"
                step="0.1"
                value={singleSearchSpec.spectra_threshold ?? 2.0}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setThisSearchSpec({
                    ...singleSearchSpec,
                    spectra_threshold: Number(e.target.value),
                  })
                }
                className="inline-block w-20 border py-1 px-1 text-grey-darkest text-sm"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Returns nodes where log(L_target) - max(log(L_background)) &gt;= threshold.
          </div>
        </div>
      )}
    </>
  );
};

export default SearchItem;
