import React from "react";
import { BsTrash } from "react-icons/bs";
function SearchItem({ id, category, value, setThis, removeItem }) {
  const explanations = {
    name: "Enter a GISAID name like hCoV-19/Australia/NT12/2020 . EPI_ISL ids are not supported.",
    lineage:
      "Enter a PANGO lineage like B.1.1.7. Note that sub-lineages will not be found by this method.",
    country: "Enter a country like 'India' ",
    mutation: "Enter an amino acid mutation like S:E484K",
  };
  console.log("key", id);
  return (
    <div className="border-gray-100 border-b mb-3 pb-3">
      <select
        className="border py-2 px-3 text-grey-darkest"
        value={category}
        onChange={(event) => setThis({ category: event.target.value })}
      >
        <option value="name">GISAID Name</option>
        <option value="lineage">Lineage</option>
        <option value="country">Country</option>
        <option value="mutation">AA mutation</option>
      </select>
      &nbsp;
      <input
        className="border py-2 px-3 text-grey-darkest"
        value={value}
        onChange={(event) => setThis({ value: event.target.value })}
      ></input>
      <div className="text-sm text-gray-600 px-3">{explanations[category]}</div>
      <button
        className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
        onClick={() => removeItem(id)}
      >
        <BsTrash className="inline-block mr-2" />
        Remove this search
      </button>
    </div>
  );
}

export default SearchItem;
