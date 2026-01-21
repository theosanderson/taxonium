import SearchTopLayerItem from "./SearchTopLayerItem";
import { RiAddCircleLine, RiArrowLeftUpLine } from "react-icons/ri";
import { BiPalette } from "react-icons/bi";
import { Button } from "../components/Basic";
import { BsBoxArrowInUpRight, BsQuestionCircle } from "react-icons/bs";
import { MdArrowForward, MdArrowDownward, MdAddCircleOutline } from "react-icons/md";
import { Tooltip as ReactTooltip } from "react-tooltip";
const ReactTooltipAny: any = ReactTooltip;
import prettifyName from "../utils/prettifyName";
import { SearchState } from "../types/search";
import type { Config, Backend } from "../types/backend";
import type { ColorHook, ColorBy } from "../types/color";
import type { Settings } from "../types/settings";
import type { SelectedDetails, OverlayContent } from "../types/ui";
import type { TreenomeState } from "../types/treenome";
import type { View } from "../hooks/useView";

import { FaSearch, FaShare } from "react-icons/fa";

import { Select } from "./Basic";
import ListOutputModal from "./ListOutputModal";

import { useState, useMemo, useEffect, ChangeEvent } from "react";

import classNames from "classnames";

import SearchDisplayToggle from "./SearchDisplayToggle";

const prettify_x_types = { x_dist: "Distance", x_time: "Time" };

const formatNumber = (num: number | null) => {
  return num !== null && typeof num === "number" ? num.toLocaleString() : "";
};

const formatNumberIfNumber = (possNum: number | string) => {
  return typeof possNum === "number" ? possNum.toLocaleString() : possNum;
};
const fixName = (name: string) => {
  return name;
  //return typeof name == "string"
  //  ? name.replace("hCoV-19/", "hCoV-19/\n")
  //  : name;
};

const fixAuthors = (authors: string) => {
  // make sure comma is always followed by space
  return authors.replace(/,([^\s])/g, ", $1");
};

interface SearchPanelProps {
  search: SearchState;
  colorBy: ColorBy;
  config: Config;
  selectedDetails: SelectedDetails;
  overlayContent: OverlayContent["content"];
  setAboutEnabled: (enabled: boolean) => void;
  colorHook: ColorHook;
  xType: string;
  setxType: (val: string) => void;
  settings: Settings;
  backend: Backend;
  className?: string;
  treenomeState: TreenomeState;
  view: View;
  perNodeFunctions: any;
  toggleSidebar: () => void;
  placeSequencesUrl?: string;
}

function SearchPanel({
  search,
  colorBy,
  config,
  selectedDetails,
  overlayContent,
  setAboutEnabled,
  colorHook,
  xType,
  setxType,
  settings,
  backend,
  className,
  treenomeState,
  view,
  perNodeFunctions,
  toggleSidebar,
  placeSequencesUrl,
}: SearchPanelProps) {
  const cfg = config as Record<string, any>;
  const selectedNodeDetails =
    selectedDetails.nodeDetails as Record<string, any> | null;
  const covSpectrumQuery = useMemo(() => {
    if (selectedNodeDetails && selectedNodeDetails.node_id) {
      return perNodeFunctions.getCovSpectrumQuery(
        selectedNodeDetails.node_id
      );
    } else {
      return null;
    }
  }, [selectedNodeDetails]);

  const [listOutputModalOpen, setListOutputModalOpen] = useState(false);

  const handleDownloadJson = () => {
    if (selectedNodeDetails) {
      const node_id = selectedNodeDetails.node_id as string | number;
      backend.getNextstrainJson(node_id, config);
    }
  };

  const formatMetadataItem = (key: string) => {
    // if matches a markdown link "[abc](https://abc.com)" then..
    if (key === "num_tips" && selectedNodeDetails && selectedNodeDetails[key] === 1)
      return;

    if (
      selectedNodeDetails &&
      selectedNodeDetails[key] &&
      (selectedNodeDetails[key] as any).match &&
      (selectedNodeDetails[key] as any).match(/\[.*\]\(.*\)/)
    ) {
      const [, text, url] = (selectedNodeDetails[key] as string).match(
        /\[(.*)\]\((.*)\)/
      )!;
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

    if (cfg.metadataTypes && cfg.metadataTypes[key] === "sequence") {
      return (
        <div className="text-sm mt-1" key={key}>
          <span className="font-semibold">{prettifyName(key, config)}:</span>{" "}
          <div className="text-xs font-mono break-all">
            {selectedNodeDetails ? selectedNodeDetails[key] : ""}
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm mt-1" key={key}>
        <span className="font-semibold">{prettifyName(key, config)}:</span>{" "}
        {colorBy.colorByField === key ? (
          <span
            style={{
              color: colorHook.toRGBCSS(selectedNodeDetails ? selectedNodeDetails[key] : ""),
            }}
          >
            {selectedNodeDetails ? selectedNodeDetails[key] : ""}
          </span>
        ) : (
          formatNumberIfNumber(selectedNodeDetails ? selectedNodeDetails[key] : "")
        )}
        {key === "num_tips" && (
          <span className="ml-1">
            <a
              data-tooltip-id="menu_descendants"
              className="cursor-pointer"
            >
              {" "}
              <FaShare className="inline-block" />
            </a>
              <ReactTooltipAny
                id="menu_descendants"
                clickable={true}
                style={{
                  backgroundColor: "white",
                  color: "black",
                  border: "1px solid #ccc",
                  maxWidth: "300px",
                  zIndex: 9999
                }}
              >
                <div>
                  <h2 className="font-bold mb-2">For this clade:</h2>
                  <div className="mb-3">
                    <Button
                      className=""
                      onClick={() => {
                        if (
                    selectedNodeDetails && selectedNodeDetails.num_tips > 100000 &&
                          !(window as any).warning_shown
                        ) {
                          // pop up a warning and ask if we want to continue
                          alert(
                            "WARNING: This node has a large number of descendants. Displaying them all may take a while or crash this browser window. Are you sure you want to continue? If so press the button again."
                          );
                          (window as any).warning_shown = true;
                          return;
                        }
                        setListOutputModalOpen(true);
                      }}
                    >
                      List all tips
                    </Button>
                  </div>

                  {cfg.enable_ns_download &&
                    selectedNodeDetails && selectedNodeDetails[key] < 1000000 &&
                    !cfg.from_newick && (
                      <>
                        <div className="mb-3">
                          <Button className="" onClick={handleDownloadJson}>
                            Download Nextstrain JSON
                          </Button>
                        </div>

                        {backend.type === "server" &&
                          backend.backend_url &&
                          !backend.backend_url.includes("localhost") &&
                          selectedNodeDetails && selectedNodeDetails[key] < 20000 && (
                            <>
                              <div className="mb-3">
                                <Button
                                  className=""
                                  href={
                                    "https://nextstrain.org/fetch/" +
                                    backend
                                      .getNextstrainJsonUrl(
                                        selectedNodeDetails!.node_id,
                                        config
                                      )
                                      .replace("https://", "")
                                      .replace("http://", "")
                                  }
                                  target="_blank"
                                >
                                  View clade in Nextstrain
                                </Button>
                              </div>
                            </>
                          )}
                      </>
                    )}

                  {cfg.covspectrum_links && (
                    <div className="mb-3">
                      <Button
                        href={covSpectrumQuery}
                        className=""
                        target="_blank"
                      >
                        Find in CovSpectrum
                      </Button>
                    </div>
                  )}
                </div>
              </ReactTooltipAny>
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={classNames(
        "flex flex-col px-4 divide-y text-sm border-gray-200",
        className
      )}
    >
      <div className="flex items-center justify-between border-gray-200">
        <button onClick={toggleSidebar} className="border-gray-200">
          <br />
          {window.innerWidth > 768 ? (
            <MdArrowForward className="mx-auto w-5 h-5 sidebar-toggle border-gray-200" />
          ) : (
            <MdArrowDownward className="mx-auto w-5 h-5 sidebar-toggle border-gray-200" />
          )}
        </button>
        {placeSequencesUrl && (
          <a
            href={placeSequencesUrl}
            className="px-3 py-1.5 text-xs bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-1.5 no-underline my-2"
            data-tooltip-id="global-tooltip"
            data-tooltip-content="Place your own sequences on this tree using viral_usher"
          >
            <MdAddCircleOutline className="w-4 h-4" />
            <span>Place sequences</span>
          </a>
        )}
      </div>
      <div className="space-y-2 py-3 border-gray-200">
        {cfg.num_tips && (
          <>
            <p className="text-gray-500 text-sm">
              {overlayContent ? (
                <>
                  <span title={cfg.date_created ? cfg.date_created : ""}>
                    Displaying
                  </span>{" "}
                  <button
                    className="underline"
                    onClick={() => {
                      setAboutEnabled(true);
                    }}
                  >
                    {formatNumber(cfg.num_tips)}{" "}
                    {cfg.tipPluralNoun ? cfg.tipPluralNoun : "sequences"}
                  </button>{" "}
                  {cfg.source && ` from ${cfg.source}`}
                </>
              ) : (
                <>
                  Displaying {formatNumber(cfg.num_tips)}{" "}
                  {cfg.tipPluralNoun ? cfg.tipPluralNoun : "sequences"}
                  {cfg.source && ` from ${cfg.source}`}
                </>
              )}
            </p>
            {cfg.enabled_by_gisaid && (
              <span className="text-gray-500 mt-1">
                Enabled by data from{" "}
                <a
                  rel="noopener noreferrer"
                  href="https://www.gisaid.org"
                  target="_blank"
                >
                  <img
                    src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png"
                    alt="gisaid-logo"
                    width="65"
                    className="inline-block"
                  />
                </a>
                .
              </span>
            )}
          </>
        )}
        {cfg.x_accessors && cfg.x_accessors.length > 1 && (
          <label className="space-x-2 text-sm block">
            <span className="text-gray-500 text-sm">Tree type:</span>
            <Select
              value={xType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setxType(e.target.value)
              }
              className="text-gray-500 text-xs py-0.5"
            >
              {cfg.x_accessors.map((x: keyof typeof prettify_x_types) => (
                <option key={x} value={x}>
                  {prettify_x_types[x]}
                </option>
              ))}
            </Select>
          </label>
        )}
        {(treenomeState as any).genome &&
          (treenomeState as any).genome.length > 0 &&
          window.location &&
          !window.location.href.includes("disabletreenome") && (
            <span>
              <span className="text-gray-500 text-sm">Treenome Browser:</span>
              <input
                name="treenomeEnabled"
                style={{ verticalAlign: "middle" }}
                type="checkbox"
                className="m-3 inline-block"
                checked={settings.treenomeEnabled}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  settings.setTreenomeEnabled(!settings.treenomeEnabled);
                }}
              />
              <button
                style={{ cursor: "default" }}
                data-tooltip-id="global-tooltip"
                data-tooltip-html="Display a browser with each genome's mutations alongside the tree.&nbsp;<a href='https://docs.taxonium.org/en/latest/treenome.html' class='tooltipLink' target='_blank'>Learn more</a>"
              >
                <span
                  style={{ display: "inline-block", verticalAlign: "middle" }}
                >
                  <BsQuestionCircle />
                </span>
              </button>
            </span>
          )}
      </div>
      <div className="py-3 space-y-2 border-gray-200">
        <div className="flex space-x-2">
          <h2 className="font-bold text-gray-700 flex items-center whitespace-nowrap">
            <BiPalette className="mr-1.5 text-gray-500 h-5 w-5" />
            {
              // if locale is US return "Color by" otherwise "Colour by" :sob:
              window.navigator.language === "en-US" ? "Color by" : "Colour by"
            }
            :
          </h2>
            <Select
              value={colorBy.colorByField}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                colorBy.setColorByField?.(e.target.value)
              }
          >
              {colorBy.colorByOptions.map((item: string) => (
                <option key={item} value={item}>
                  {prettifyName(item, config)}
                </option>
              ))}
          </Select>
        </div>
        {colorBy.colorByField === "genotype" && (
          <div className="space-x-2">
            <label className="space-x-2">
              <span>Gene</span>
              <Select
                value={colorBy.colorByGene}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  colorBy.setColorByGene?.(e.target.value)
                }
                className="w-20"
              >
                {config.genes &&
                    config.genes.map((item: string) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
              </Select>
            </label>
            <label className="space-x-2">
              <span>Residue</span>
              <input
                value={colorBy.colorByPosition}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  colorBy.setColorByPosition?.(
                    e.target.value !== "" ? parseInt(e.target.value) : 0
                  )
                }
                type="number"
                min="0"
                className="inline-block w-16 border py-1 px-1 text-grey-darkest text-sm"
              />
            </label>
          </div>
        )}
      </div>
      <div className="py-3 flex flex-col md:min-h-0 border-gray-200">
        <h2 className="font-bold text-gray-700 flex justify-between items-center mb-2">
          <div className="flex items-center">
            <FaSearch className="ml-1 mr-1.5 text-gray-500 h-4 w-4" />
            Search
          </div>
          <SearchDisplayToggle settings={settings} />
        </h2>
        <div className="space-y-2 md:overflow-y-auto -mr-4 pr-4">
          {search.searchSpec.map((item) => (
            <SearchTopLayerItem
              key={item.key}
              singleSearchSpec={item}
              myKey={item.key}
              search={search}
              config={config}
              backend={backend}
            />
          ))}
          <Button
            className="mx-auto flex items-center font-medium leading-6 mt-2"
            onClick={search.addNewTopLevelSearch}
          >
            <RiAddCircleLine className="mr-1 h-4 w-4 text-gray-500" />
            <span>Add a new search</span>
          </Button>
        </div>
      </div>
      {selectedNodeDetails && (
        <div className="py-3 px-4 md:px-0 mb-0 fixed bottom-0 left-0 right-0 bg-white md:static shadow-2xl md:shadow-none overflow-auto border-gray-200">
          <ListOutputModal
            nodeId={selectedNodeDetails.node_id}
            backend={backend}
            possibleKeys={["name", ...(cfg.keys_to_display as string[])]}
            listOutputModalOpen={listOutputModalOpen}
            setListOutputModalOpen={setListOutputModalOpen}
          />
          <header className="flex items-start justify-between">
            <h2 className="font-bold whitespace-pre-wrap text-sm">
              {selectedNodeDetails[cfg.name_accessor as string] !== "" ? (
                fixName(selectedNodeDetails[cfg.name_accessor as string])
              ) : (
                <i>
                  Internal node{" "}
                  <small>{selectedNodeDetails.node_id}</small>
                </i>
              )}
              {selectedNodeDetails.parent_id !== selectedNodeDetails.node_id && (
                <button
                  className="inline-block text-sm text-gray-700 hover:text-black ml-2"
                  title="Select parent"
                  onClick={() => {
                    selectedDetails.getNodeDetails(selectedNodeDetails.parent_id);
                  }}
                >
                  <RiArrowLeftUpLine className="inline-block mr-2" />
                </button>
              )}
            </h2>

            <button
              onClick={() => selectedDetails.clearNodeDetails()}
              className="text-gray-500"
            >
              close
            </button>
          </header>
          {selectedNodeDetails["meta_ThumbnailURL"] && (
            <img
              src={selectedNodeDetails["meta_ThumbnailURL"] as string}
              alt="thumbnail"
            />
          )}

          {colorBy.colorByField === "genotype" && (
            <span
              style={{
                color: colorHook.toRGBCSS(
                  colorBy.getNodeColorField(selectedNodeDetails as any)
                ),
              }}
            >
              {colorBy.colorByGene}:{colorBy.colorByPosition}
              {colorBy.getNodeColorField(selectedNodeDetails as any)}
            </span>
          )}
          {[...(cfg.keys_to_display as string[]), "num_tips"].map(
            (key) => selectedNodeDetails && selectedNodeDetails[key] && formatMetadataItem(key)
          )}
          {((config.mutations && config.mutations.length) || cfg.useHydratedMutations) &&
            selectedNodeDetails &&
            selectedNodeDetails.node_id !== selectedNodeDetails.parent_id && (
              <>
                <div className="text-xs font-bold mt-2 mb-0 text-gray-700 justify-between flex">
                  <div className="pt-1">Mutations at this node:</div>{" "}
                  {settings.miniMutationsMenu()}
                </div>
                <div className="text-xs leading-5 mt-1 text-gray-700">
                    {settings
                      .filterMutations(selectedNodeDetails.mutations)
                      .sort((a: any, b: any) => {
                        if (a.gene !== b.gene) {
                          return a.gene > b.gene ? 1 : -1;
                        }
                        return (a.residue_pos ?? 0) > (b.residue_pos ?? 0)
                          ? 1
                          : -1;
                      })
                      .map((mutation: any, i: number) => (
                      <span key={mutation.mutation_id}>
                        {i > 0 && <>, </>}
                        <div className="inline-block">
                          {mutation.gene}:{mutation.previous_residue}
                          {mutation.residue_pos}
                          {mutation.new_residue}
                        </div>
                      </span>
                    ))}
                  {selectedNodeDetails.mutations.length === 0 && (
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

          <div>
            {selectedNodeDetails.acknowledgements && (
              <div className="text-xs mt-3  text-gray-700 mr-3">
                <div className="mt-1 justify">
                  <b className="font-semibold">Authors:</b>{" "}
                  {selectedNodeDetails.acknowledgements.authors}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPanel;
