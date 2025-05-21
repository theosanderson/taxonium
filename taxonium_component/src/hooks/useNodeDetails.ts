import { useState, useCallback, useRef } from "react";
import type { Backend, NodeDetails } from "../types/backend";

function useNodeDetails(nickname: string, backend: Backend) {
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getNodeDetails = useCallback(
    (node_id: string | number) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => {
        backend.getDetails(node_id, setNodeDetails);
      }, 50);
    },
    [backend]
  );
  const clearNodeDetails = useCallback(() => {
    setNodeDetails(null);
  }, []);
  return { nodeDetails, getNodeDetails, clearNodeDetails, setNodeDetails };
}

export default useNodeDetails;
