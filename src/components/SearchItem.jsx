import React from "react";

const SearchItem = ({ singleSearchSpec, setThisSearchSpec, config }) => {
  const types = config.search_types ? config.search_types : [];

  let all_amino_acids = "ACDEFGHIKLMNPQRSTVWY".split("");
  all_amino_acids = ["any"].concat(all_amino_acids);

  const text_types = ["text_exact", "text_match"];

  const name_to_type = Object.fromEntries(
    types.map((type) => [type.name, type.type])
  );

  const is_text = text_types.includes(singleSearchSpec.method);

  return (
    <div>
      <select
        className="inline-block w-42 bg-gray-100 text-sm  p-1 rounded border-gray-300 border m-1 text-gray-700"
        value={singleSearchSpec.type}
        onChange={(e) =>
          setThisSearchSpec({
            ...singleSearchSpec,
            type: e.target.value,
            method: name_to_type[e.target.value],
          })
        }
      >
        {types.map((type) => (
          <option key={type.name} value={type.name}>
            {type.label}
          </option>
        ))}
      </select>
      {is_text && (
        <input
          className="inline-block w-56 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
          value={singleSearchSpec.text}
          onChange={(e) =>
            setThisSearchSpec({
              ...singleSearchSpec,
              text: e.target.value,
            })
          }
        />
      )}
      {singleSearchSpec.type === "mutation" && (
        <div>
          <div>
            <label>of gene </label>
            <select
              value={singleSearchSpec.gene}
              onChange={(e) =>
                setThisSearchSpec({ ...singleSearchSpec, gene: e.target.value })
              }
              className="inline-block w-16 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
            >
              {config.genes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            &nbsp;at&nbsp;
            <input
              type="number"
              value={singleSearchSpec.position}
              onChange={(e) =>
                setThisSearchSpec({
                  ...singleSearchSpec,
                  position: e.target.value,
                })
              }
              className="inline-block w-16 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
            />
            &nbsp;to&nbsp;
            <select
              value={singleSearchSpec.new_residue}
              onChange={(e) => {
                setThisSearchSpec({
                  ...singleSearchSpec,
                  new_residue: e.target.value,
                });
              }}
              className="inline-block w-16 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
            >
              {all_amino_acids.map((aa) => (
                <option key={aa} value={aa}>
                  {aa}
                </option>
              ))}
            </select>
            <br />
          </div>
        </div>
      )}
      {(singleSearchSpec.type === "revertant" ||
        singleSearchSpec.type === "mutation") && (
        <div>
          <div>
            with at least&nbsp;
            <input
              type="number"
              value={singleSearchSpec.min_tips}
              onChange={(e) =>
                setThisSearchSpec({
                  ...singleSearchSpec,
                  min_tips: e.target.value,
                })
              }
              className="inline-block w-16 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
            />{" "}
            descendants
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchItem;
