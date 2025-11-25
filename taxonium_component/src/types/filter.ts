import type { QueryBounds } from "./backend";
import type { Node } from "./node";
import { SearchMethod, BooleanMethod, NumberMethod } from "./search";

export { SearchMethod as FilterMethod, BooleanMethod, NumberMethod };

export interface FilterSpec {
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
  subspecs?: FilterSpec[];
  number_method?: NumberMethod;
  number?: number;
}

export interface FilterBackendResult {
  type: string;
  data: Node[];
  total_count: number;
}

export interface FilterResultItem {
  boundingBox: QueryBounds | null;
  result: FilterBackendResult;
  overview?: Node[];
}

export type FilterResults = Record<string, FilterResultItem>;

export interface FilterControllerEntry {
  con: { abort: () => void };
  bounds: QueryBounds | null;
}

export interface FilterState {
  filterSpec: FilterSpec[];
  setFilterSpec: (spec: FilterSpec[]) => void;
  addNewTopLevelFilter: () => void;
  deleteTopLevelFilter: (key: string) => void;
  filtersEnabled: Record<string, boolean>;
  setEnabled: (key: string, enabled: boolean) => void;
  filterLoadingStatus: Record<string, string>;
  filterResults: FilterResults;
  filterEnabled: boolean;
  setFilterEnabled: (enabled: boolean) => void;
}

