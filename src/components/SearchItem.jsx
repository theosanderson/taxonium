import React from "react";
import { BsTrash } from "react-icons/bs";
import { DebounceInput } from "react-debounce-input";
import { BiZoomIn } from "react-icons/bi";

function numberWithCommas(x) {
  const internationalNumberFormat = new Intl.NumberFormat("en-US");
  return internationalNumberFormat.format(x);
}

function SearchItem({
  id,
  category,
  enabled,
  value,
  setThis,
  removeItem,
  index,
  searchColors,
  numResultsHere,
  zoomToMe,
  aa_pos,
  aa_final,
  aa_gene,
  all_genes,
  min_tips,
}) {
  const explanations = {
    name: "Enter a sequence name like QEUH-13ADA01",
    lineage:
      "Enter a PANGO lineage like B.1.1.7. Note that sub-lineages will not be found by this method.",
    country: "Enter a country like 'India' ",
    mutation:
      "Enter an amino acid mutation like a mutation in gene S at position 681 to R. Note that this will identify the internal node at which the mutation occurred, rather than all the leaf nodes with the mutation.",
  };

  const thecolor = searchColors[index % searchColors.length];
  //console.log("key", id);
  return (
    <div className="border-gray-100 border-b mb-3 pb-3">
      <input
        name="isGoing"
        type="checkbox"
        style={{
          outline:
            enabled && value.length > 0
              ? `1px solid rgb(${thecolor[0]},${thecolor[1]},${thecolor[2]})`
              : "0px",
          outlineOffset: "2px",
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
      {category === "mutation" && (
        <div
          className="ml-2 
       p-2 m-2 ml-8  text-gray-700"
        >
          {" "}
          <label className="text-sm">Gene:</label>
          <select
            className="border py-1 px-1 text-grey-darkest text-sm h-7 w-16 m-3 my-1"
            value={aa_gene}
            onChange={(event) => setThis({ aa_gene: event.target.value })}
          >
            {all_genes.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <div>
            <label className="text-sm">Mutation at residue:</label>{" "}
            <DebounceInput
              debounceTimeout={300}
              type="number"
              value={aa_pos}
              onChange={(event) => setThis({ aa_pos: event.target.value })}
              className="border py-1 px-1 text-grey-darkest text-sm h-7 w-20 m-3 my-1"
              placeholder="e.g. 681"
            />{" "}
            <label className="text-sm"> to</label>
            <select
              value={aa_final}
              onChange={(event) => setThis({ aa_final: event.target.value })}
              className="border py-1 px-1 text-grey-darkest text-sm h-7 w-16 m-3 my-1"
            >
              {[
                "any",
                "A",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "P",
                "Q",
                "R",
                "S",
                "T",
                "U",
                "V",
                "W",
                "Y",
              ].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            <br />
            <label className="text-sm">Min descendant genomes:</label>
            <DebounceInput
              debounceTimeout={300}
              value={min_tips}
              type="number"
              onChange={(event) =>
                setThis({ min_tips: parseInt(event.target.value) })
              }
              className="border py-1 px-1 text-grey-darkest text-sm h-7 w-16 m-3 my-1"
            />
          </div>
        </div>
      )}
      {category !== "mutation" && (
        <DebounceInput
          className=" w-32 border py-2 px-3 text-grey-darkest h-10"
          value={value}
          onChange={(event) => setThis({ value: event.target.value })}
          debounceTimeout={300}
        />
      )}
      <button
        className=" bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border  text-gray-700 ml-2 h-8"
        onClick={() => removeItem(id)}
      >
        <BsTrash className="inline-block " />
      </button>
      <div className="text-sm text-gray-600 px-3">{explanations[category]}</div>
      <div className="text-sm text-gray-900 px-3">
        {" "}
        {(value.length > 0 || category === "mutation") && (
          <>
            {" "}
            {numberWithCommas(numResultsHere)} result
            {numResultsHere !== 1 && <>s</>}
          </>
        )}
        {numResultsHere === 1 && enabled && (
          <>
            {" "}
            <button
              onClick={zoomToMe}
              className="inline-block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-1 text-gray-700"
            >
              <BiZoomIn className="inline-block mr-1" />
              locate
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default SearchItem;
