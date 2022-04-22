import React from "react";
import { DebounceInput , DebounceTextArea} from "react-debounce-input";

const SearchItem = ({ singleSearchSpec, setThisSearchSpec, config }) => {
  const types = config.search_types ? config.search_types : [];

  let all_amino_acids = "ACDEFGHIKLMNPQRSTVWY".split("");
  all_amino_acids = ["any"].concat(all_amino_acids);

  const text_types = ["text_exact", "text_match"];

  const name_to_type = Object.fromEntries(
    types.map((type) => [type.name, type.type])
  );

  const is_text = text_types.includes(singleSearchSpec.method);

  const is_multi_text = singleSearchSpec.method === "text_per_line";

  return (
    <>
      <select
        className="inline-block w-42  border py-1 px-1 text-grey-darkest text-sm mr-1"
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
        <DebounceInput
          className="inline-block w-56 border py-1 px-1 text-grey-darkest text-sm"
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

      {singleSearchSpec.type === "mutation" && (
            <div className="pl-11 pt-2 text-gray-700">
          <div>
            <label className="text-sm mr-2">Gene: </label>
            <select
              value={singleSearchSpec.gene}
              onChange={(e) =>
                setThisSearchSpec({ ...singleSearchSpec, gene: e.target.value })
              }
              className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm h-8"
            >
              {config.genes && config.genes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-2">
            
            <label className="text-sm">Mutation at residue </label>
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
            <label className="text-sm">&nbsp;to&nbsp;</label>
            <select
              value={singleSearchSpec.new_residue}
              onChange={(e) => {
                setThisSearchSpec({
                  ...singleSearchSpec,
                  new_residue: e.target.value,
                });
              }}
              className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
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
    </>
  );
};

export default SearchItem;
