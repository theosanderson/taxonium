const TreenomeMutationHoverTip = ({
  hoverInfo,
  hoverDetails,
  colorHook,
  colorBy,
  config,
  treenomeReferenceInfo,
}) => {
  if (!hoverInfo || !treenomeReferenceInfo) {
    return null;
  }
  const hoveredMutation = hoverInfo.object;

  if (!hoveredMutation || !hoveredMutation.m) {
    return null;
  }
  const isAa = hoveredMutation.m.type === "aa";
  const posKey = isAa
    ? hoveredMutation.m.gene + ":" + hoveredMutation.m.residue_pos
    : hoveredMutation.m.residue_pos;
  if (
    isAa &&
    hoveredMutation.m.new_residue === treenomeReferenceInfo["aa"][posKey]
  ) {
    return null;
  }
  if (
    !isAa &&
    hoveredMutation.m.new_residue === treenomeReferenceInfo["nt"][posKey]
  ) {
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
            <span style={{}}>
              {treenomeReferenceInfo[isAa ? "aa" : "nt"][posKey]}
            </span>
            <span>{hoveredMutation.m.residue_pos}</span>
            <span style={{}}>{hoveredMutation.m.new_residue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreenomeMutationHoverTip;
