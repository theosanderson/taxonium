import { useState, useCallback, useRef } from "react";

function useNodeDetails(nickname, backend) {
  const [nodeDetails, setNodeDetails] = useState(null);
  const timeout = useRef(null);

  const getNodeDetails = useCallback(
    (node_id) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => {
        backend.getDetails(node_id, setNodeDetails);
      }, 50);
    },
    [backend],
  );
  const clearNodeDetails = useCallback(() => {
    setNodeDetails(null);
  }, []);
  return { nodeDetails, getNodeDetails, clearNodeDetails };
}

export default useNodeDetails;
