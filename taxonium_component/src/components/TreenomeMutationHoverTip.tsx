import type { HoverDetails, Mutation } from "../types/node";

interface HoverInfo {
  x: number;
  y: number;
  object: { m?: NumericMutation };
}

interface NumericMutation extends Mutation {
  residue_pos: number;
  gene: string;
  new_residue: string;
  type: string;
}

interface TreenomeMutationHoverTipProps {
  hoverInfo: HoverInfo | null;
  hoverDetails?: HoverDetails | null;
  colorHook: unknown;
  colorBy: unknown;
  config: unknown;
  treenomeReferenceInfo: Record<"aa" | "nt", Record<string, string>> | null;
}

const TreenomeMutationHoverTip = ({
  hoverInfo,
  hoverDetails,
  colorHook,
  colorBy,
  config,
  treenomeReferenceInfo,
}: TreenomeMutationHoverTipProps) => {
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
        zIndex: 1,
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
