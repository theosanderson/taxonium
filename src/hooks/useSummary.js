import { useState, useEffect } from "react";

const useSummary = (backend) => {
  const [summary, setSummary] = useState({
    title: "loading",
    source: "",
    num_nodes: 0,
  });

  useEffect(() => {
    backend.getSummary(setSummary);
  }, [backend]);

  return summary;
};

export default useSummary;
