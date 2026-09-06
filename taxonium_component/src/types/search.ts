import type { QueryBounds } from "./backend";
import type { Node } from "./node";

export enum SearchMethod {
  TEXT_MATCH = "text_match",
  TEXT_EXACT = "text_exact",
  TEXT_PER_LINE = "text_per_line",
  MUTATION = "mutation",
  GENOTYPE = "genotype",
  REVERTANT = "revertant",
  NUMBER = "number",
  BOOLEAN = "boolean",
  NAME = "name",
  SPECTRA = "spectra",
}

export enum BooleanMethod {
  AND = "and",
  OR = "or",
  NOT = "not",
}

export enum NumberMethod {
  GT = ">",
  LT = "<",
  GTE = ">=",
  LTE = "<=",
  EQ = "==",
}

export interface SearchSpec {
  key: string;
  type: string;
  method?: SearchMethod;
  text?: string;
  controls?: boolean;
  gene?: string;
  position?: number;
  new_residue?: string;
  min_tips?: number;
  boolean_method?: BooleanMethod;
  subspecs?: SearchSpec[];
  number_method?: NumberMethod;
  number?: number;
  spectra?: string[];        // Array of spectrum texts
  spectra_threshold?: number;
  min_mutations?: number;
}

export interface SearchBackendResult {
  type: string;
  data: Node[];
  total_count: number;
}

export interface SearchResultItem {
  boundingBox: QueryBounds | null;
  result: SearchBackendResult;
  overview?: Node[];
}

export type SearchResults = Record<string, SearchResultItem>;

export interface SearchControllerEntry {
  con: { abort: () => void };
  bounds: QueryBounds | null;
}

export interface SearchState {
  searchSpec: SearchSpec[];
  setSearchSpec: (spec: SearchSpec[]) => void;
  addNewTopLevelSearch: () => void;
  deleteTopLevelSearch: (key: string) => void;
  getLineColor: (index: number) => [number, number, number];
  setZoomToSearch: (zoom: { index: number } | null) => void;
  searchesEnabled: Record<string, boolean>;
  setEnabled: (key: string, enabled: boolean) => void;
  searchLoadingStatus: Record<string, string>;
  searchResults: SearchResults;
}
