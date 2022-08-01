const MutationHoverTip = ({
  hoverInfo,
  hoverDetails,
  colorHook,
  colorBy,
  config,
  reference,
}) => {
  if (!hoverInfo || !reference) {
    return null;
  }
  const hoveredMutation = hoverInfo.object;

  if (!hoveredMutation || !hoveredMutation.m) {
    return null;
  }
  const posKey = hoveredMutation.m.gene + ":" + hoveredMutation.m.residue_pos;
  if (hoveredMutation.m.new_residue === reference["aa"][posKey]) {
    return null;
  }

  return (
    <div
      className="bg-gray-100 p-3 opacity-90 text-sm"
      style={{
        position: "absolute",
        zIndex: 0,
        pointerEvents: "none",
        left: hoverInfo.x,
        top: hoverInfo.y,
      }}
    >
      <h2 className="font-bold whitespace-pre-wrap"></h2>
      <div>
        <div className="mutations text-xs">
          <div className="inline-block">
            <span>{hoveredMutation.m.gene}:</span>
            <span style={{}}>{reference["aa"][posKey]}</span>
            <span>{hoveredMutation.m.residue_pos}</span>
            <span style={{}}>{hoveredMutation.m.new_residue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MutationHoverTip;
