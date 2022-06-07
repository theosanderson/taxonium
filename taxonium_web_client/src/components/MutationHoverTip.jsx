import { useMemo } from "react";


const MutationHoverTip = ({ hoverInfo, hoverDetails, colorHook, colorBy, config, reference }) => {

  if (!hoverInfo || !reference) {
    return null;
  }
  const hoveredMutation = hoverInfo.object;
  if (!hoveredMutation || !hoveredMutation.m) {
    return null;
  }
  const posKey = hoveredMutation.m.gene + ':' + hoveredMutation.m.residue_pos;
  if (hoveredMutation.m.new_residue == reference[posKey]) {
    return null;
  }


  return (
    <div
      className="bg-gray-100 p-3 opacity-90 text-sm"
      style={{
        position: "absolute",
        zIndex: 1,
        pointerEvents: "none",
        left: hoverInfo.x, // TODO fix this
        top: hoverInfo.y,
      }}
    >
      <h2 className="font-bold whitespace-pre-wrap">
      </h2>
      {/* {colorBy.colorByField === "genotype" && (
        <span
          style={{
            color: colorHook.toRGBCSS(colorBy.getNodeColorField(hoveredNode)),
          }}
        >
          {colorBy.colorByGene}:{colorBy.colorByPosition}
          {colorBy.getNodeColorField(hoveredNode)}
        </span>
        gene: "ORF1a"
mutation_id: 6384
new_residue: "D"
previous_residue: "G"
residue_pos: 2118
      )} */}


        <div>
          <div className="mutations text-xs">
                <div className="inline-block">
                <span>{hoveredMutation.m.gene}:</span>
                <span style={{ color: colorHook.toRGBCSS(reference[posKey]) }}>
                    {hoveredMutation.m.previous_residue}
                </span>
                <span>{hoveredMutation.m.residue_pos}</span>
                <span style={{ color: colorHook.toRGBCSS(hoveredMutation.m.new_residue) }}>
                    {hoveredMutation.m.new_residue}
                </span>

                </div>

          </div>
        </div>

    </div>
  );
};

export default MutationHoverTip;
