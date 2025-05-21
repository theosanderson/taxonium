import type { QueryBounds } from "./backend";
import type { Node } from "./node";

export interface SearchSpec {
  key: string;
  type: string;
  method?: string;
  text?: string;
  controls?: boolean;
  gene?: string;
  position?: number;
  new_residue?: string;
  min_tips?: number;
  boolean_method?: string;
  subspecs?: SearchSpec[];
  number_method?: string;
  number?: number;
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
