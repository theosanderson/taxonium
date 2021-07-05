import React from "react";
import { BsTrash } from "react-icons/bs";
import {DebounceInput} from 'react-debounce-input';
function SearchItem({ id, category, enabled, value, setThis, removeItem }) {
  
  const explanations = {
    name: "Enter a sequence name like QEUH-13ADA01",
    lineage:
      "Enter a PANGO lineage like B.1.1.7. Note that sub-lineages will not be found by this method.",
    country: "Enter a country like 'India' ",
    mutation: "Enter an amino acid mutation like S:E484K",
  };
  //console.log("key", id);
  return (
    <div className="border-gray-100 border-b mb-3 pb-3">
      <input
        name="isGoing"
        type="checkbox"
        className="  h-5 mr-2 border-gray-400 border"
        checked={enabled}
        onChange={(event) => setThis({ enabled: !enabled })}
      />
      <select
        className=" w-36 border py-2 px-1 text-grey-darkest text-sm"
        value={category}
        onChange={(event) => setThis({ category: event.target.value })}
      >
        <option value="name">Sequence name</option>
        <option value="lineage">Lineage</option>
        <option value="country">Country</option>
        <option value="mutation">AA mutation</option>
      </select>
      &nbsp;
      <DebounceInput
        className=" w-32 border py-2 px-3 text-grey-darkest"
        value={value}
        onChange={(event) => setThis({ value: event.target.value })}
        debounceTimeout={300}
     />
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
