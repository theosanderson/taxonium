import { useMemo } from "react";

const fixName = (name) => {
  return name;
  //return typeof name == "string"
  //   ? name.replace("hCoV-19/", "hCoV-19/\n")
  //   : name;
};

const fixAuthors = (authors) => {
  // make sure comma is always followed by space
  return authors.replace(/,([^\s])/g, ", $1");
};

const NodeHoverTip = ({
  hoverInfo,
  hoverDetails,
  colorHook,
  colorBy,
  config,
  filterMutations,
  deckSize,
}) => {
  const initial_mutations = useMemo(() => {
    if (hoverInfo && hoverInfo.object && hoverInfo.object.mutations) {
      const starting = hoverInfo.object.mutations;
      // sort by gene and then by residue_pos
      return starting.sort((a, b) => {
        if (a.gene !== b.gene) {
          return a.gene > b.gene ? 1 : -1;
        }
        return parseInt(a.residue_pos) > parseInt(b.residue_pos) ? 1 : -1;
      });
    } else {
      return [];
    }
  }, [hoverInfo]);

  const mutations = useMemo(() => {
    return filterMutations(initial_mutations);
  }, [initial_mutations, filterMutations]);

  if (!hoverInfo) {
    return null;
  }
  const hoveredNode = hoverInfo.object;
  if (
    !hoveredNode ||
    hoveredNode.node_id === undefined ||
    hoveredNode.node_id === null
  ) {
    return null;
  }

  const flip_vert = hoverInfo.y > deckSize.height * 0.66;
  const flip_horiz = hoverInfo.x > deckSize.width * 0.66;

  const style = {
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
        {hoveredNode[config.name_accessor] !== "" ? (
          fixName(hoveredNode[config.name_accessor])
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

      {config.keys_to_display.map(
        (key) =>
          hoveredNode[key] &&
          !(config.metadataTypes && config.metadataTypes[key] === "sequence") &&
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
          ),
      )}

      {config.mutations.length > 0 && (
        <div>
          <div className="mutations text-xs">
            {mutations.map((mutation, i) => (
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
              {hoverDetails.nodeDetails.acknowledgements.covv_orig_lab}
            </div>
            <div className="mt-1">
              <b className="font-semibold">Submitting laboratory:</b>{" "}
              {hoverDetails.nodeDetails.acknowledgements.covv_subm_lab}
            </div>
            <div className="mt-1 justify">
              <b className="font-semibold">Authors:</b>{" "}
              {fixAuthors(
                hoverDetails.nodeDetails.acknowledgements.covv_authors,
              )}
            </div>
          </div>
        )}
      {window.show_ids ? (
        <div className="mt-3 text-xs text-gray-400">{hoveredNode.node_id}</div>
      ) : null}
    </div>
  );
};

export default NodeHoverTip;
