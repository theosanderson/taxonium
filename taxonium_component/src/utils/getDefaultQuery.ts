import { getDefaultSearch } from "./searchUtil";
import type { Query } from "../types/query";

const first_search = getDefaultSearch(null, "aa1");
if (window.location.hostname.includes("visualtreeoflife.taxonium.org")) {
  first_search["type"] = "meta_name";
}
const first_filter = getDefaultSearch(null, "filter1");
const default_query: Query = {
  srch: JSON.stringify([first_search]),
  enabled: JSON.stringify({ [first_search.key]: true }),
  fltr: JSON.stringify([first_filter]),
  filterEnabled: JSON.stringify({ [first_filter.key]: false }),
  backend: "",
  xType: "x_dist",
  mutationTypesEnabled: JSON.stringify({ aa: true, nt: false }),
  treenomeEnabled: false,
};

// first_search is currently unused, but remains for backwards compatibility
const getDefaultQuery = () => {
  return { ...default_query };
};

export default getDefaultQuery;
