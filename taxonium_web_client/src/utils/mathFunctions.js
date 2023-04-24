export const linear_normalization = (
  enteredValue,
  minEntry,
  maxEntry,
  normalizedMin,
  normalizedMax
) => {
  let mx = Math.log(enteredValue - minEntry) / Math.log(maxEntry - minEntry);
  let preshiftNormalized = mx * (normalizedMax - normalizedMin);
  let shiftedNormalized = preshiftNormalized + normalizedMin;

  return shiftedNormalized;
};
