import { useMemo } from "react";
import type { Mutation, Node } from "../types/node";
import type { HoverDetailsState } from "../types/ui";
import type { DeckSize, HoverInfo } from "../types/common";
import type { Config } from "../types/backend";
import type { ColorHook, ColorBy } from "../types/color";

const fixName = (name: string) => {
  return name;
  //return typeof name == "string"
  //   ? name.replace("hCoV-19/", "hCoV-19/\n")
  //   : name;
};

const fixAuthors = (authors: string) => {
  // make sure comma is always followed by space
  return authors.replace(/,([^\s])/g, ", $1");
};

interface NodeHoverTipProps {
  hoverInfo: HoverInfo<Node> | null;
  hoverDetails?: HoverDetailsState | null;
  colorHook: ColorHook;
  colorBy: ColorBy;
  config: Config;
  filterMutations: (mutations: Mutation[]) => Mutation[];
  deckSize: DeckSize;
}

const NodeHoverTip = ({
  hoverInfo,
  hoverDetails,
  colorHook,
  colorBy,
  config,
  filterMutations,
  deckSize,
}: NodeHoverTipProps) => {
  const nameAccessor = config.name_accessor as string;
  const keysToDisplay = (config.keys_to_display as string[]) || [];
  const metadataTypes = config.metadataTypes as Record<string, string> | undefined;
  const initial_mutations = useMemo(() => {
    if (hoverInfo && hoverInfo.object && hoverInfo.object.mutations) {
      const starting = hoverInfo.object.mutations;
      // sort by gene and then by residue_pos
      return starting.sort((a: Mutation, b: Mutation) => {
        const geneA = a.gene ?? "";
        const geneB = b.gene ?? "";
        if (geneA !== geneB) {
          return geneA > geneB ? 1 : -1;
        }
        return (a.residue_pos ?? 0) > (b.residue_pos ?? 0) ? 1 : -1;
      });
    } else {
      return [] as Mutation[];
    }
  }, [hoverInfo]);

  const mutations = useMemo(() => {
    return filterMutations(initial_mutations);
  }, [initial_mutations, filterMutations]);

  if (!hoverInfo) {
    return null;
  }
  const hoveredNode: Node = hoverInfo.object;
  if (
    !hoveredNode ||
    hoveredNode.node_id === undefined ||
    hoveredNode.node_id === null
  ) {
    return null;
  }

  const flip_vert = hoverInfo.y > deckSize.height * 0.66;
  const flip_horiz = hoverInfo.x > deckSize.width * 0.66;

  const style: React.CSSProperties = {
    position: "absolute",
    zIndex: 1,
    pointerEvents: "none",
  };

  if (!flip_vert) {
    style.top = hoverInfo.y + 5;
  } else {
    style.bottom = deckSize.height - hoverInfo.y + 5;
  }

  if (!flip_horiz) {
    style.left = hoverInfo.x + 5;
  } else {
    style.right = deckSize.width - hoverInfo.x + 5;
  }

  return (
    <div
      className="bg-gray-100 p-3 opacity-90 text-sm"
      style={{
        ...style,
      }}
    >
      <h2 className="font-bold whitespace-pre-wrap">
        {hoveredNode[nameAccessor] !== "" ? (
          fixName(hoveredNode[nameAccessor] as string)
        ) : (
          <i>Internal node</i>
        )}
      </h2>
      {hoveredNode["meta_ThumbnailURL"] && (
        <img src={hoveredNode["meta_ThumbnailURL"]} alt="thumbnail" />
      )}
      {colorBy.colorByField === "genotype" && (
        <span
          style={{
            color: colorHook.toRGBCSS(colorBy.getNodeColorField(hoveredNode)),
          }}
        >
          {colorBy.colorByGene}:{colorBy.colorByPosition}
          {colorBy.getNodeColorField(hoveredNode)}
        </span>
      )}

      {keysToDisplay.map(
        (key: string) =>
          hoveredNode[key] &&
          !(metadataTypes && metadataTypes[key] === "sequence") &&
          !(
            typeof hoveredNode[key] === "string" &&
            hoveredNode[key].match(/\[.*\]\(.*\)/)
          ) && (
            <div key={key}>
              {/*<span className="text-gray-800">{prettify_key[key]}</span>:{" "}*/}
              {colorBy.colorByField === key ? (
                <span style={{ color: colorHook.toRGBCSS(hoveredNode[key]) }}>
                  {hoveredNode[key]}
                </span>
              ) : (
                hoveredNode[key]
              )}
            </div>
          )
      )}

      {((config.mutations && config.mutations.length) ||
        config.useHydratedMutations) && (
        <div>
          <div className="mutations text-xs">
            {mutations.map((mutation: Mutation, i: number) => (
              <span key={mutation.mutation_id}>
                {i > 0 && <>, </>}
                <div className="inline-block">
                  {mutation.gene}:{mutation.previous_residue}
                  {mutation.residue_pos}
                  {mutation.new_residue}
                </div>
              </span>
            ))}
            {mutations.length === 0 && (
              <div className="text-xs italic">
                No{" "}
                {filterMutations([{ type: "nt" }]).length === 0 ? (
                  <>coding</>
                ) : (
                  <></>
                )}{" "}
                mutations
              </div>
            )}
          </div>
        </div>
      )}
      {hoverDetails &&
        hoverDetails.nodeDetails &&
        hoverDetails.nodeDetails.acknowledgements && (
          <div className="text-xs mt-3  mr-3">
            <div className="mt-1">
              <b className="font-semibold">Originating laboratory:</b>{" "}
              {hoverDetails.nodeDetails.acknowledgements.covv_orig_lab ?? ""}
            </div>
            <div className="mt-1">
              <b className="font-semibold">Submitting laboratory:</b>{" "}
              {hoverDetails.nodeDetails.acknowledgements.covv_subm_lab ?? ""}
            </div>
            <div className="mt-1 justify">
              <b className="font-semibold">Authors:</b>{" "}
              {fixAuthors(
                hoverDetails.nodeDetails.acknowledgements.covv_authors ?? ""
              )}
            </div>
          </div>
        )}
      {(window as any).show_ids ? (
        <div className="mt-3 text-xs text-gray-400">{hoveredNode.node_id}</div>
      ) : null}
    </div>
  );
};

export default NodeHoverTip;
