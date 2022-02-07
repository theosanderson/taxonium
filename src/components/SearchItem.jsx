import React from "react";

const SearchItem = ({ singleSearchSpec, setThisSearchSpec }) => {
  const types = [
    { name: "name", label: "Name", type: "match" },
    { name: "lineage", label: "PANGO lineage", type: "exact" },
    { name: "mutation", label: "Mutation", type: "mutation" },
  ];

  return (
    <div>
      <select
        className="block w-full bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
        value={singleSearchSpec.type}
        onChange={(e) =>
          setThisSearchSpec({ ...singleSearchSpec, type: e.target.value })
        }
      >
        {types.map((type) => (
          <option key={type.name} value={type.name}>
            {type.label}
          </option>
        ))}
      </select>
      <label>Text</label>
      <input
        className="inline-block w-56 bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
        value={singleSearchSpec.text}
        onChange={(e) =>
          setThisSearchSpec({ ...singleSearchSpec, text: e.target.value })
        }
      />
    </div>
  );
};

export default SearchItem;
