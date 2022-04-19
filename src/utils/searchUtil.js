export function getDefaultSearch(key) {
  if (!key) {
    key = Math.random().toString(36).substring(2, 15);
    console.log("generated key", key);
  }
  return {
    key,
    type: "meta_Lineage",
    method: "text_exact",
    text: "",
    gene: "S",
    position: 484,
    new_residue: "K",
    min_tips: 0,
  };
}
