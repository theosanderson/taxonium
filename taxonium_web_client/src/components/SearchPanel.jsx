import React, { useEffect, useMemo, useState } from "react";
import SearchItem from "./SearchItem";
import { FaSearch } from "react-icons/fa";
import { RiAddCircleLine } from "react-icons/ri";
import { BiPalette } from "react-icons/bi";
import { BsInfoCircle } from "react-icons/bs";
import { DebounceInput } from "react-debounce-input";
import { IoMdSettings } from "react-icons/io";
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

function get_epi_isl_url(epi_isl) {
  if (epi_isl.length > 4) {
    return (
      "https://www.epicov.org/acknowledgement/" +
      epi_isl.slice(-4, -2) +
      "/" +
      epi_isl.slice(-2) +
      "/" +
      epi_isl +
      ".json"
    );
  }
}
get_epi_isl_url("");
function numberWithCommas(x) {
  const internationalNumberFormat = new Intl.NumberFormat("en-US");
  return internationalNumberFormat.format(x);
}

function SearchPanel({
  possibleXTypes,
  xType,
  setXType,
  blinkingEnabled,
  setBlinkingEnabled,
  metadataItemList,
  getMetadataItem,
  searchItems,
  setSearchItems,
  colourBy,
  setColourBy,
  selectedNode,
  data,
  searchColors,
  numSearchResults,
  totalSeqs,
  setZoomToSearch,
  showMutText,
  setShowMutText,
}) {
  //const [acknowledgements, setAcknowledgements] = useState({});
  const acknowledgements = null;
  const node_data = data.node_data;

  const [configMode, setConfigMode] = useState("colour");

  const cur_genbank = useMemo(() => {
    if (selectedNode) {
      const cur_genbank = node_data.genbanks[selectedNode];
      if (cur_genbank && cur_genbank !== "nan") {
        return cur_genbank;
      }
    }
    return "";
  }, [node_data, selectedNode]);

  const cur_epi_isl = useMemo(() => {
    if (selectedNode) {
      const cur_epi_isl = node_data.epi_isl_numbers[selectedNode];
      if (cur_epi_isl && cur_epi_isl !== 0) {
        return "EPI_ISL_" + cur_epi_isl;
      }
    }
    return "";
  }, [node_data, selectedNode]);

  useEffect(() => {
    /*
    if (cur_epi_isl) {
      fetch(get_epi_isl_url(cur_epi_isl))
        .then((response) => response.json())
        .then((data) => setAcknowledgements(data));
    } else {
      setAcknowledgements(null);
    }*/
  }, [cur_epi_isl]);

  const selected_muts = useMemo(() => {
    if (!selectedNode) {
      return [];
    }
    let cur_node = selectedNode;
    let mutations = {};
    while (cur_node !== node_data.parents[cur_node]) {
      const these_muts = node_data.mutations[cur_node].mutation
        ? Object.fromEntries(
            node_data.mutations[cur_node].mutation.map((x) => {
              const this_mut = data.mutation_mapping[x];
              return [
                this_mut.gene + ":" + this_mut.position,
                this_mut.final_res,
              ];
            })
          )
        : {};
      mutations = { ...these_muts, ...mutations };
      cur_node = node_data.parents[cur_node];
    }
    return Object.entries(mutations)
      .map((x) => x[0] + x[1])
      .sort();
  }, [data, node_data, selectedNode]);




  return (
    <div className="overflow-y-auto" style={{ height: "calc(100vh - 5em)" }}>
      <div className=" border-t md:border-t-0 border-b border-gray-300">
        <div className="mt-3 mb-3 text-gray-500 text-sm">
          Displaying {numberWithCommas(totalSeqs)} sequences from INSDC, COG-UK
          and CNCB
        </div>
        <div className="border-t md:border-t-0 border-b border-gray-300 pb-2 mb-2 text-gray-500">
        Tree type: <select value={xType} onChange={(e) => setXType(e.target.value)}
        className="border py-1 px-1 text-grey-darkest text-sm">
          {possibleXTypes.map((x) => (
            <option key={x} value={x}>
              {toTitleCase(x)}
            </option>
          ))}
        </select>
        </div>
        <h2 className="text-xl mt-5 mb-4 text-gray-700">
          <div className="float-right mr-3 text-gray-500 text-sm">
          <input
            type="checkbox"
            checked={blinkingEnabled}
            onChange={(event) => {
             
              setBlinkingEnabled(!blinkingEnabled);
            }}
          /> Blink
          </div>
          <FaSearch className="inline-block mr-2" />
          Search
        </h2>
        {searchItems.map(function (item, index) {
          return (
            <SearchItem
            metadataItemList = {metadataItemList}
              numResultsHere={numSearchResults[index]}
              searchColors={searchColors}
              index={index}
              key={item.id}
              id={item.id}
              search_for_ids={item.search_for_ids}
              category={item.category}
              aa_gene={item.aa_gene}
              aa_pos={item.aa_pos}
              aa_final={item.aa_final}
              all_genes={data.all_genes}
              min_tips={item.min_tips}
              value={item.value}
              setThis={(mapping) => {
                searchItems[index] = { ...searchItems[index], ...mapping };
                setSearchItems([...searchItems]);
              }}
              zoomToMe={() => {
                console.log(index);
                setZoomToSearch({ index });
              }}
              removeItem={(id) => {
                // console.log("remove", id);
                setSearchItems(searchItems.filter((x) => x.id !== id));
              }}
              enabled={item.enabled}
              current_accession={
                item.category === "genbanks" && cur_genbank
                  ? cur_genbank
                  : item.category === "epis" && cur_epi_isl
                  ? cur_epi_isl
                  : ""
              }
            ></SearchItem>
          );
        })}

        <button
          className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
          onClick={() =>
            setSearchItems([
              ...searchItems,
              {
                id: Math.random(),
                category: "name",
                value: "",
                enabled: true,
                aa_final: "any",
                min_tips: 1,
                aa_gene: "S",
                search_for_ids: "",
              },
            ])
          }
        >
          <RiAddCircleLine className="inline-block mr-2" />
          Add a new search
        </button>
      </div>
      {configMode === "other" && (
        <div className="border-b border-gray-300 pb-3">
          <h2 className="text-xl mt-5 mb-4 text-gray-700">
            <button
              onClick={() => setConfigMode("colour")}
              className="float-right mr-5 block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
            >
              <BiPalette className="inline-block mr-1 ml-1" />
            </button>
            <IoMdSettings className="inline-block mr-2" />
            Other settings{" "}
          </h2>
          Show mutation text{" "}
          <input
            type="checkbox"
            checked={showMutText}
            onChange={(event) => {
              console.log(showMutText);
              setShowMutText(!showMutText);
            }}
          />
          <div className="text-sm text-gray-500 p-5">
            Mutations are only shown at nodes with at least 10 descendant
            genomes
          </div>
        </div>
      )}
      {configMode === "colour" && (
        <div className="border-b border-gray-300 pb-3">
          <h2 className="text-xl mt-5 mb-4 text-gray-700">
            <button
              onClick={() => setConfigMode("other")}
              className="float-right mr-5 block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
            >
              <IoMdSettings className="inline-block mr-1 ml-1" />
            </button>
            <BiPalette className="inline-block mr-2" />
            Colour by{" "}
          </h2>

          <select
            className="border py-2 px-3 text-grey-darkest"
            value={colourBy.variable}
            onChange={(event) =>
              setColourBy({ ...colourBy, variable: event.target.value })
            }
          >
             {metadataItemList.map((item) => (<option key={item} value={item}>{toTitleCase(item)}</option>))}
            <option value="aa">Amino acid at site</option>
            <option value="none">None</option>
          </select>
          {colourBy.variable === "aa" && (
            <div
              className="
     p-2 m-1 ml-0  text-gray-700"
            >
              {" "}
              <label className="text-sm">Gene</label>
              <select
                className="border py-1 px-1 text-grey-darkest text-sm h-7 w-20 m-3 my-1"
                value={colourBy.gene}
                onChange={(event) =>
                  setColourBy({ ...colourBy, gene: event.target.value })
                }
              >
                {data.all_genes &&
                  data.all_genes.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
              </select>
              <div>
                <label className="text-sm">Residue</label>{" "}
                <DebounceInput
                  debounceTimeout={300}
                  type="number"
                  value={colourBy.residue}
                  onChange={(event) =>
                    setColourBy({ ...colourBy, residue: event.target.value })
                  }
                  className="border py-1 px-1 text-grey-darkest text-sm h-7 w-16 m-3 my-1"
                />
              </div>
              <div className="hidden">
                Colour lines{" "}
                <input
                  type="checkbox"
                  value={colourBy.colourLines}
                  onChange={(event) =>
                    setColourBy({
                      ...colourBy,
                      colourLines: event.target.value,
                    })
                  }
                ></input>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        {selectedNode && (
          <div className="text-gray-500 mr-3">
            <h2 className="text-xl mt-5 mb-4 text-gray-700">
              <BsInfoCircle className="inline-block mr-2" />
              Node info
            </h2>

            <div className="font-bold">
              {node_data.names[selectedNode] ? (
                node_data.names[selectedNode]
              ) : (
                <>Un-named internal node</>
              )}
            </div>
            {cur_genbank && (
              <div>
                <span className="font-semibold">Genbank:</span>{" "}
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  href={"https://www.ncbi.nlm.nih.gov/nuccore/" + cur_genbank}
                >
                  {cur_genbank}
                </a>
              </div>
            )}
            <div>
              {false && cur_epi_isl && (
                <>
                  <span className="font-semibold">GISAID:</span> {cur_epi_isl}
                </>
              )}
            </div>
            <div>
              <span className="font-semibold">Date:</span>{" "}
              {data.date_mapping[node_data.dates[selectedNode]]}
            </div>
           

            {metadataItemList.map(x=>{
            const info =getMetadataItem(x)
            const value = info.mapping[info.node_values[selectedNode]]
            return  <div
          
          >
            <span className="font-semibold">{toTitleCase(x)}:</span>{" "} {value}
          </div>

          })

    }
            <span className="font-semibold">Mutations from root:</span>
            <div className="text-xs mr-5 mb-3">
              {
                selected_muts && selected_muts.join(", ") //TODO assign the top thing to a constant and use it again
              }
            </div>
            {false && acknowledgements && (
              <div>
                {" "}
                <span className="font-semibold">Acknowledgements</span>
                <div className="text-xs mr-5 ">
                  <b>Originating lab:</b> {acknowledgements.covv_orig_lab}
                  <br />
                  <b>Submitting lab:</b> {acknowledgements.covv_subm_lab}
                  <br />
                  <b>Authors:</b> {acknowledgements.covv_authors}
                </div>
              </div>
            )}
          </div>
            )}
        
      </div>
    </div>
  );
}

export default SearchPanel;
