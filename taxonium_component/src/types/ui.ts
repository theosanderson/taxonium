import type React from "react";
import type { NodeDetails } from "./backend";

export type NodeSelectHandler = (nodeId: string | number | null) => void;
export type NodeDetailsLoadedHandler = (nodeId: string | number | null, nodeDetails: NodeDetails | null) => void;

export interface SelectedDetails {
  nodeDetails: NodeDetails | null;
  getNodeDetails: (id: string | number) => void;
  clearNodeDetails: () => void;
}

export interface OverlayContent {
  content: React.ReactNode | null;
}

export interface HoverDetailsState {
  nodeDetails: NodeDetails | null;
  setNodeDetails: (details: NodeDetails | null) => void;
  clearNodeDetails: () => void;
  getNodeDetails?: (id: string | number) => void;
}
