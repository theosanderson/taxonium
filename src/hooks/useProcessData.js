import { useMemo } from "react";

const useProcessData = (data, viewState) => {
  const processedData = useMemo(() => {
    return data;
  }, [data]);

  return processedData;
};

export default useProcessData;
