import type { Node, Mutation } from "./node";

export interface QueryBounds {
  min_x?: number;
  max_x?: number;
  min_y?: number;
  max_y?: number;
  zoom?: number[];
  xType?: string;
  real_width?: number;
  real_height?: number;
  [key: string]: unknown;
}

export interface NodesResponse {
  nodes: Node[];
  [key: string]: unknown;
}

export interface Config {
  title?: string;
  source?: string;
  num_nodes: number;
  initial_x?: number;
  initial_y?: number;
  initial_zoom?: number;
  rootMutations: Mutation[];
  rootId: string | number;
  genes?: string[];
  mutations?: Mutation[];
  useHydratedMutations?: boolean;
  [key: string]: unknown;
}

export interface NodeDetails extends Node {
  acknowledgements?: {
    covv_orig_lab?: string;
    covv_subm_lab?: string;
    covv_authors?: string;
    authors?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SearchResult {
  key: string;
  nodes?: Node[];
  count?: number;
  [key: string]: unknown;
}

export interface NodeLookupData {
  nodes: Node[];
  nodeLookup: Record<string, Node>;
  [key: string]: unknown;
}

export interface DynamicDataWithLookup {
  data: NodeLookupData;
  base_data: NodeLookupData;
  [key: string]: unknown;
}
