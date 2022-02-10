import { useMemo } from "react";
import { BeatLoader } from "react-spinners";
const keys_to_display = ["meta_Lineage", "meta_Country", "genotype"];
const prettify_key = {
  meta_Lineage: "Lineage",
  meta_Country: "Country",
  genotype: "Genotype",
};
const NodeHoverTip = ({ hoverInfo, hoverDetails, colorHook, colorBy }) => {
  const mutations = useMemo(() => {
    if (!hoverDetails.nodeDetails) {
      return [];
    }

    const starting = hoverDetails.nodeDetails.mutations;
    // sort by gene and then by residue_pos
    return starting.sort((a, b) => {
      if (a.gene !== b.gene) {
        return a.gene > b.gene ? 1 : -1;
      }
      return parseInt(a.residue_pos) > parseInt(b.residue_pos) ? 1 : -1;
    });
  }, [hoverDetails]);
  if (!hoverInfo) {
    return null;
  }
  const hoveredNode = hoverInfo.object;
  if (!hoveredNode) {
    return null;
  }

  return (
    <div
      className="bg-gray-100 p-3 opacity-90 text-sm"
      style={{
        position: "absolute",
        zIndex: 1,
        pointerEvents: "none",
        left: hoverInfo.x,
        top: hoverInfo.y,
      }}
    >
      <h2 className="font-bold">
        {hoveredNode.name !== "" ? hoveredNode.name : <i>Internal node</i>}
      </h2>
      {keys_to_display.map(
        (key) =>
          hoveredNode[key] && (
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

      {hoverDetails.nodeDetails &&
      hoveredNode.node_id === hoverDetails.nodeDetails.node_id ? (
        <div>
          <div className="mutations text-sm">
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
              <div className="text-sm italic">No coding mutations</div>
            )}
          </div>
        </div>
      ) : (
        <BeatLoader className="mx-auto my-3" size={4} />
      )}
      {window.show_ids ? (
        <div className="mt-3 text-xs text-gray-400">{hoveredNode.node_id}</div>
      ) : null}
    </div>
  );
};

export default NodeHoverTip;
