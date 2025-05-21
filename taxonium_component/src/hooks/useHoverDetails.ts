import { useState, useCallback } from "react";

import type { NodeDetails } from "../types/backend";
import type { HoverDetailsState } from "../types/ui";

function useHoverDetails(): HoverDetailsState {
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);

  const clearNodeDetails = useCallback(() => {
    setNodeDetails(null);
  }, []);
  return { nodeDetails, setNodeDetails, clearNodeDetails };
}

export default useHoverDetails;
