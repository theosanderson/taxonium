import type { SearchSpec } from "../types/search";
import { SearchMethod } from "../types/search";

export interface SearchUtilConfig {
  defaultSearch?: SearchSpec;
}

export function getDefaultSearch(config: SearchUtilConfig | null, key?: string): SearchSpec {
  if (!key) {
    key = Math.random().toString(36).substring(2, 15);
  }
  if (config && config.defaultSearch) {
    return config.defaultSearch;
  }
  return {
    key,
    type: SearchMethod.NAME,
    method: SearchMethod.TEXT_MATCH,
    text: "",
    gene: "S",
    position: 484,
    new_residue: "any",
    min_tips: 0,
  };
}
