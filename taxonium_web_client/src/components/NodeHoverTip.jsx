import { useMemo } from "react";
import { BeatLoader } from "react-spinners";

const fixName = (name) => {
  return name.replace("hCoV-19/", "hCoV-19/\n");
};

const NodeHoverTip = ({
  hoverInfo,
  hoverDetails,
  colorHook,
  colorBy,
  config,
}) => {
  const mutations = useMemo(() => {
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
      <h2 className="font-bold whitespace-pre-wrap">
        {hoveredNode[config.name_accessor] !== "" ? (
          fixName(hoveredNode[config.name_accessor])
        ) : (
          <i>Internal node</i>
        )}
      </h2>
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

      {
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
              <div className="text-xs italic">No coding mutations</div>
            )}
          </div>
        </div>
      }
      {window.show_ids ? (
        <div className="mt-3 text-xs text-gray-400">{hoveredNode.node_id}</div>
      ) : null}
    </div>
  );
};

export default NodeHoverTip;
