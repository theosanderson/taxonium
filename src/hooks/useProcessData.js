import { useMemo, useState } from "react";

function reduceOverPlotting(nodeIds, node_data, precision) {
  const included_points = {};

  const filtered = nodeIds.filter((node) => {
    const rounded_x = Math.round(node_data.x[node] * precision) / precision;
    const rounded_y = Math.round(node_data.y[node] * precision) / precision;
    if (included_points[rounded_x]) {
      if (included_points[rounded_x][rounded_y]) {
        return false;
      } else {
        included_points[rounded_x][rounded_y] = 1;
        return true;
      }
    } else {
      included_points[rounded_x] = { [rounded_y]: 1 };
      return true;
    }
  });

  return filtered;
}

const createDataSubset = (data, selection, bounds, downsamplingPrecision) => {};

const useProcessData = (data, expandedBounds, downsamplingPrecision) => {
  const fullData = useMemo(() => {
    const scatterIds = data.node_data.ids.filter(
      (x) => data.node_data.names[x] !== ""
    );
    return { scatterIds };
  }, [data]);
  const processedData = useMemo(() => {
    const configs = {};
    const scatter_main = createDataSubset(
      data,
      fullData.scatterIds,
      expandedBounds,
      downsamplingPrecision
    );
    configs["scatter_main"] = scatter_main;
    return configs;
  }, [fullData, expandedBounds]);

  return processedData;
};

export default useProcessData;
