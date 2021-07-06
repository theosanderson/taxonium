import React from "react";
import { BsTrash } from "react-icons/bs";
import { DebounceInput } from "react-debounce-input";
function SearchItem({ id, category, enabled, value, setThis, removeItem, index ,searchColors}) {
  const explanations = {
    name: "Enter a sequence name like QEUH-13ADA01",
    lineage:
      "Enter a PANGO lineage like B.1.1.7. Note that sub-lineages will not be found by this method.",
    country: "Enter a country like 'India' ",
    mutation: "Enter an amino acid mutation like S:E484K",
  };

  const thecolor = searchColors[index % searchColors.length]
  //console.log("key", id);
  return (
    <div className="border-gray-100 border-b mb-3 pb-3">
      <input
        name="isGoing"
        type="checkbox"
        style={{
        
         
          "outline": (enabled && value.length>0)?`1px solid rgb(${thecolor[0]},${thecolor[1]},${thecolor[2]})`:"0px",
          "outlineOffset":"2px"
        }}
        className="w-3 h-3 m-3"
        checked={enabled}
        onChange={(event) => setThis({ enabled: !enabled })}
      />
      <select
        className=" w-36 border py-2 px-1 text-grey-darkest text-sm h-10"
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
        className=" w-32 border py-2 px-3 text-grey-darkest h-10"
        value={value}
        onChange={(event) => setThis({ value: event.target.value })}
        debounceTimeout={300}
      /><button
      className=" bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border  text-gray-700 ml-2 h-8"
      onClick={() => removeItem(id)}
    ><BsTrash className="inline-block " /></button>
      <div className="text-sm text-gray-600 px-3">{explanations[category]}</div>
      
    </div>
  );
}

export default SearchItem;
