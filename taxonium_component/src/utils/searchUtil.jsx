export function getDefaultSearch(config, key) {
  if (!key) {
    key = Math.random().toString(36).substring(2, 15);
    console.log("generated key", key);
  }
  if (config && config.defaultSearch) {
    return config.defaultSearch;
  }
  return {
    key,
    type: "name",
    method: "text_match",
    text: "",
    gene: "S",
    position: 484,
    new_residue: "any",
    min_tips: 0,
  };
}
