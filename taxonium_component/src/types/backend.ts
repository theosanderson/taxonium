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
  /**
   * When {@link useHydratedMutations} is false this array contains indices into
   * the {@link mutations} array. When true it contains {@link Mutation}
   * objects.  Allow both to keep the type checker happy during migration.
   */
  rootMutations: Array<Mutation | number>;
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

export interface StatusMessage {
  percentage?: number;
  message?: string | null;
  [key: string]: unknown;
}

import type { Dispatch, SetStateAction } from "react";

export interface BaseBackend {
  queryNodes(
    boundsForQueries: QueryBounds | null,
    setResult: (res: NodesResponse) => void,
    setTriggerRefresh: (v: Record<string, unknown>) => void,
    config: Config
  ): void;
  singleSearch(
    singleSearch: unknown,
    boundsForQueries: QueryBounds | null,
    setResult: (res: SearchResult) => void
  ): { abortController: { abort: () => void } };
  getDetails(node_id: string | number, setResult: (res: NodeDetails) => void): void;
  getConfig(setResult: (res: Config) => void): void;
  setStatusMessage: Dispatch<SetStateAction<StatusMessage | null>>;
  statusMessage: StatusMessage | null;
  getTipAtts(
    nodeId: string | number,
    selectedKey: string,
    callback: (err: unknown, data: unknown) => void
  ): void;
  getNextstrainJson(nodeId: string | number, config: Config): void;
  type: "local" | "server";
}

export interface ServerBackend extends BaseBackend {
  type: "server";
  backend_url: string | null;
  getNextstrainJsonUrl(nodeId: string | number, config: Config): string;
}

export interface LocalBackend extends BaseBackend {
  type: "local";
  backend_url?: undefined;
  getNextstrainJsonUrl?(nodeId: string | number, config: Config): string;
}

export type Backend = ServerBackend | LocalBackend;
