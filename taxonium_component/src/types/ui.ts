import type React from "react";
import type { NodeDetails } from "./backend";

export interface SelectedDetails {
  nodeDetails: NodeDetails | null;
  getNodeDetails: (id: string | number) => void;
  clearNodeDetails: () => void;
}

export interface OverlayContent {
  content: React.ReactNode | null;
}
