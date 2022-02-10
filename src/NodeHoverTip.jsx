import { useMemo } from "react";
import { BeatLoader } from "react-spinners";
const NodeHoverTip = ({ hoverInfo, hoverDetails }) => {
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
        {hoveredNode.node_id}: {hoveredNode.name}
      </h2>
      {hoverDetails.nodeDetails &&
      hoveredNode.node_id === hoverDetails.nodeDetails.node_id ? (
        <div>
          <div className="mutations">
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
          </div>
        </div>
      ) : (
        <BeatLoader className="mx-auto my-3" size={4} />
      )}
    </div>
  );
};

export default NodeHoverTip;
