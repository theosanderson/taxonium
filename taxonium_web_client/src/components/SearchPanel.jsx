import SearchTopLayerItem from "./SearchTopLayerItem";
import { RiAddCircleLine, RiArrowLeftUpLine } from "react-icons/ri";
import { BiPalette } from "react-icons/bi";
import { Button } from "../components/Basic";
import { FaSearch } from "react-icons/fa";
import { BsBoxArrowInUpRight } from "react-icons/bs";
import { MdList } from "react-icons/md";
import { Select } from "./Basic";
import ListOutputModal from "./ListOutputModal";
import { useState } from "react";

const prettify_x_types = { x_dist: "Distance", x_time: "Time" };

const formatNumber = (num) => {
  return num !== null && typeof num === "number" ? num.toLocaleString() : "";
};

const formatNumberIfNumber = (possNum) => {
  return typeof possNum === "number" ? possNum.toLocaleString() : possNum;
};
const fixName = (name) => {
  return name
  //return typeof name == "string"
  //  ? name.replace("hCoV-19/", "hCoV-19/\n")
  //  : name;
};

const fixAuthors = (authors) => {
  // make sure comma is always followed by space
  return authors.replace(/,([^\s])/g, ", $1");
};

function SearchPanel({
  search,
  colorBy,
  config,
  selectedDetails,
  colorHook,
  xType,
  setxType,
  settings,
  backend,
}) {
  const [listOutputModalOpen, setListOutputModalOpen] = useState(false);

  const prettifyName = (name) => {
    if (config && config.customNames && config.customNames[name]) {
      return config.customNames[name];
    }
    if (name === "num_tips") {
      return "Number of descendants";
    }
    const new_name = name.replace("meta_", "").replace("_", " ");
    return new_name.charAt(0).toUpperCase() + new_name.slice(1);
  };

  const formatMetadataItem = (key) => {
    // if matches a markdown link "[abc](https://abc.com)" then..
    if (key == "num_tips" && selectedDetails.nodeDetails[key] == 1) return;
    if (
      selectedDetails.nodeDetails &&
      selectedDetails.nodeDetails[key] &&
      selectedDetails.nodeDetails[key].match &&
      selectedDetails.nodeDetails[key].match(/\[.*\]\(.*\)/)
    ) {
      const [, text, url] =
        selectedDetails.nodeDetails[key].match(/\[(.*)\]\((.*)\)/);
      return (
        <div className="text-sm mt-1" key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-800 underline"
          >
            {text} <BsBoxArrowInUpRight className="inline-block ml-1" />
          </a>
        </div>
      );
    }

    if (config.metadataTypes && config.metadataTypes[key] === "sequence") {
      return (
        <div className="text-sm mt-1" key={key}>
          <span className="font-semibold">{prettifyName(key)}:</span>{" "}
          <div className="text-xs font-mono break-all">
            {selectedDetails.nodeDetails[key]}
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm mt-1" key={key}>
        <span className="font-semibold">{prettifyName(key)}:</span>{" "}
        {colorBy.colorByField === key ? (
          <span
            style={{
              color: colorHook.toRGBCSS(selectedDetails.nodeDetails[key]),
            }}
          >
            {selectedDetails.nodeDetails[key]}
          </span>
        ) : (
          formatNumberIfNumber(selectedDetails.nodeDetails[key])
        )}
        {key === "num_tips" && (
          <span className="ml-1">
            <button
              title="List all tips"
              className="text-gray-600 hover:text-black"
              onClick={() => {
                if (
                  selectedDetails.nodeDetails.num_tips > 100000 &&
                  !window.warning_shown
                ) {
                  // pop up a warning and ask if we want to continue
                  alert(
                    "WARNING: This node has a large number of descendants. Displaying them all may take a while or crash this browser window. Are you sure you want to continue? If so press the button again."
                  );
                  window.warning_shown = true;
                  return;
                }
                setListOutputModalOpen(true);
              }}
            >
              <MdList className="inline-block" />
            </button>
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div
        className="overflow-y-auto"
        style={{ height: "calc( 0.65*(100vh - 5em))" }}
      >
        <div className="mt-3 mb-3 text-gray-500 text-sm">
          {config.num_tips && (
            <>
              Displaying {formatNumber(config.num_tips)}{" "}
              {config.tipPluralNoun ? config.tipPluralNoun : "sequences"}
              {config.source && ` from ${config.source}`}
            </>
          )}
        </div>

        {config.x_accessors && config.x_accessors.length > 1 && (
          <div className="border-t md:border-t-0 border-b border-gray-300 pb-2 mb-2 text-gray-500">
            Tree type:{" "}
            <select
              value={xType}
              onChange={(e) => setxType(e.target.value)}
              className="border py-1 px-1 text-grey-darkest text-sm"
            >
              {config.x_accessors.map((x) => (
                <option key={x} value={x}>
                  {prettify_x_types[x]}
                </option>
              ))}
            </select>
          </div>
        )}
        <h2 className="text-xl mt-5 mb-4 text-gray-700">
          <FaSearch className="inline-block mr-2" />
          Search
        </h2>
        {search.searchSpec.map((item) => (
          <SearchTopLayerItem
            key={item.key}
            singleSearchSpec={item}
            myKey={item.key}
            search={search}
            config={config}
          />
        ))}
        <Button
          className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700 mb-3 mt-3"
          onClick={search.addNewTopLevelSearch}
        >
          <RiAddCircleLine className="inline-block mr-2" />
          Add a new search
        </Button>
        <hr />
        <h2 className="text-xl mt-5 mb-4 text-gray-700">
          <BiPalette className="inline-block mr-2" />
          Colour by{" "}
        </h2>
        <Select
          value={colorBy.colorByField}
          onChange={(e) => colorBy.setColorByField(e.target.value)}
          className="inline-block w-56 border py-1 px-1 text-grey-darkest text-sm"
        >
          {colorBy.colorByOptions.map((item) => (
            <option key={item} value={item}>
              {prettifyName(item)}
            </option>
          ))}
        </Select>
        {colorBy.colorByField === "genotype" && (
          <>
            <div>
              <label className="text-sm">Gene</label>
              <Select
                value={colorBy.colorByGene}
                onChange={(e) => colorBy.setColorByGene(e.target.value)}
                className="border py-1 px-1 text-grey-darkest text-sm h-7 w-20 m-3 my-1"
              >
                {config.genes &&
                  config.genes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <label className="text-sm">Residue</label>
              <input
                value={colorBy.colorByPosition}
                onChange={(e) =>
                  colorBy.setColorByPosition(
                    e.target.value !== "" ? parseInt(e.target.value) : ""
                  )
                }
                type="number"
                min="0"
                className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
              />
            </div>
          </>
        )}
        {selectedDetails.nodeDetails && (
          <ListOutputModal
            ariaHideApp={false}
            nodeId={selectedDetails.nodeDetails.node_id}
            backend={backend}
            possibleKeys={["name", ...config.keys_to_display]}
            listOutputModalOpen={listOutputModalOpen}
            setListOutputModalOpen={setListOutputModalOpen}
          />
        )}
      </div>
      <div
        style={{ height: "calc( 0.35*(100vh - 5em))" }}
        // top border width 2

        className="overflow-y-auto border-t  border-gray-300 pb-2 mb-2 pt-3"
      >
        {selectedDetails.nodeDetails && (
          <div className="text-gray-700">
            <h2 className="font-bold whitespace-pre-wrap text-sm">
              {selectedDetails.nodeDetails[config.name_accessor] !== "" ? (
                fixName(selectedDetails.nodeDetails[config.name_accessor])
              ) : (
                <i>Internal node</i>
              )}
              {selectedDetails.nodeDetails.parent_id !==
                selectedDetails.nodeDetails.node_id && (
                <button
                  className="inline-block text-sm text-gray-700 hover:text-black ml-2"
                  title="Select parent"
                  onClick={() => {
                    selectedDetails.getNodeDetails(
                      selectedDetails.nodeDetails.parent_id
                    );
                  }}
                >
                  <RiArrowLeftUpLine className="inline-block mr-2" />
                </button>
              )}
            </h2>
            {colorBy.colorByField === "genotype" && (
              <span
                style={{
                  color: colorHook.toRGBCSS(
                    colorBy.getNodeColorField(selectedDetails.nodeDetails)
                  ),
                }}
              >
                {colorBy.colorByGene}:{colorBy.colorByPosition}
                {colorBy.getNodeColorField(selectedDetails.nodeDetails)}
              </span>
            )}

            {[...config.keys_to_display, "num_tips"].map(
              (key) =>
                selectedDetails.nodeDetails[key] &&
                formatMetadataItem(key, selectedDetails)
            )}
            {config.mutations.length > 0 &&
              selectedDetails.nodeDetails.node_id !==
                selectedDetails.nodeDetails.parent_id && (
                <>
                  <h3 className="text-xs font-bold mt-4 text-gray-700">
                    Mutations at this node:
                  </h3>
                  <div className="text-xs mt-1 text-gray-700 mr-1">
                    {settings
                      .filterMutations(selectedDetails.nodeDetails.mutations)
                      .map((mutation, i) => (
                        <span key={mutation.mutation_id}>
                          {i > 0 && <>, </>}
                          <div className="inline-block">
                            {mutation.gene}:{mutation.previous_residue}
                            {mutation.residue_pos}
                            {mutation.new_residue}
                          </div>
                        </span>
                      ))}
                    {selectedDetails.nodeDetails.mutations.length === 0 && (
                      <div className=" italic">
                        No{" "}
                        {settings.filterMutations([{ type: "nt" }]).length ===
                        0 ? (
                          <>coding</>
                        ) : (
                          <></>
                        )}{" "}
                        mutations
                      </div>
                    )}
                  </div>
                </>
              )}

            {
              <div>
                {selectedDetails.nodeDetails.acknowledgements && (
                  <div className="text-xs mt-3  text-gray-700 mr-3">
                    <div className="mt-1">
                      <b className="font-semibold">Originating laboratory:</b>{" "}
                      {
                        selectedDetails.nodeDetails.acknowledgements
                          .covv_orig_lab
                      }
                    </div>
                    <div className="mt-1">
                      <b className="font-semibold">Submitting laboratory:</b>{" "}
                      {
                        selectedDetails.nodeDetails.acknowledgements
                          .covv_subm_lab
                      }
                    </div>
                    <div className="mt-1 justify">
                      <b className="font-semibold">Authors:</b>{" "}
                      {fixAuthors(
                        selectedDetails.nodeDetails.acknowledgements
                          .covv_authors
                      )}
                    </div>
                  </div>
                )}
              </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPanel;
