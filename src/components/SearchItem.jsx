import React from "react";

const SearchItem = ({ singleSearchSpec, setThisSearchSpec }) => {
  const types = [
    { name: "name", label: "Name", type: "text_match" },
    { name: "meta_Lineage", label: "PANGO lineage", type: "text_exact" },
    { name: "meta_Country", label: "Country", type: "text_match" },
    { name: "mutation", label: "Mutation", type: "mutation" },
  ];

  const name_to_type = Object.fromEntries(
    types.map((type) => [type.name, type.type])
  );

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
    </div>
  );
};

export default SearchItem;
