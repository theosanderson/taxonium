import { BeatLoader } from "react-spinners";
const NodeHoverTip = ({ hoverInfo, hoverDetails }) => {
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
            {hoverDetails.nodeDetails.mutations.map((mutation, i) => (
              <>
                {i > 0 && <>, </>}
                <div className="inline-block" key={mutation.mutation_id}>
                  {mutation.gene}:{mutation.previous_residue}
                  {mutation.residue_pos}
                  {mutation.new_residue}
                </div>
              </>
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
