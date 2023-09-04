import { useState, useCallback } from "react";

function useHoverDetails() {
  const [nodeDetails, setNodeDetails] = useState(null);

  const clearNodeDetails = useCallback(() => {
    setNodeDetails(null);
  }, []);
  return { nodeDetails, setNodeDetails, clearNodeDetails };
}

export default useHoverDetails;
