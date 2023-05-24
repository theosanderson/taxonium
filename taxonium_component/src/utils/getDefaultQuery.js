import { getDefaultSearch } from "./searchUtil";

const first_search = getDefaultSearch(null, "aa1");
if (window.location.hostname.includes("visualtreeoflife.taxonium.org")) {
  first_search["type"] = "meta_name";
}
const default_query = {
  srch: JSON.stringify([first_search]),
  enabled: JSON.stringify({ [first_search.key]: true }),
  backend: "",
  xType: "x_dist",
  mutationTypesEnabled: JSON.stringify({ aa: true, nt: false }),
  treenomeEnabled: false,
};

const getDefaultQuery = (first_search) => {
  return { ...default_query };
};

export default getDefaultQuery;
