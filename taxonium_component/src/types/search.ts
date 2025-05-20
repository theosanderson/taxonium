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
  searchResults: Record<string, any>;
}
