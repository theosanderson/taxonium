function reduceMaxOrMin<T>(
  array: T[],
  accessFunction: (item: T) => number,
  maxOrMin: "max" | "min"
): number {
  if (maxOrMin === "max") {
    return accessFunction(
      array.reduce(function (max, item) {
        return accessFunction(item) > accessFunction(max) ? item : max;
      })
    );
  } else if (maxOrMin === "min") {
    return accessFunction(
      array.reduce(function (min, item) {
        return accessFunction(item) < accessFunction(min) ? item : min;
      })
    );
  }

  return NaN;
}

export default reduceMaxOrMin;
