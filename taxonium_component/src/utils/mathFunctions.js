export const linear_normalization = (
  enteredValue,
  minEntry,
  maxEntry,
  normalizedMin,
  normalizedMax
) => {
  if (maxEntry === minEntry) {
    return normalizedMin + (normalizedMax - normalizedMin) / 2;
  }

  // ensure all input values are positive
  enteredValue = Math.abs(enteredValue);
  minEntry = Math.abs(minEntry);
  maxEntry = Math.abs(maxEntry);
  normalizedMin = Math.abs(normalizedMin);
  normalizedMax = Math.abs(normalizedMax);

  // calculate the normalized value
  let mx =
    (Math.log(enteredValue) - Math.log(minEntry)) /
    (Math.log(maxEntry) - Math.log(minEntry));
  let preshiftNormalized = mx * (normalizedMax - normalizedMin);
  let shiftedNormalized = preshiftNormalized + normalizedMin;

  // ensure the normalized value is within the specified range
  if (shiftedNormalized < Math.min(normalizedMin, normalizedMax)) {
    shiftedNormalized = Math.min(normalizedMin, normalizedMax);
  } else if (shiftedNormalized > Math.max(normalizedMin, normalizedMax)) {
    shiftedNormalized = Math.max(normalizedMin, normalizedMax);
  }

  return shiftedNormalized;
};
