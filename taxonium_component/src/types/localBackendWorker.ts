export interface StatusData {
  type: "status";
  data: {
    percentage?: number;
    message?: string | null;
    [key: string]: unknown;
  };
}

export interface QueryData {
  type: "query";
  data: import("./backend").NodesResponse;
}

export interface SearchData {
  type: "search";
  data: import("./backend").SearchResult;
}

export interface ConfigData {
  type: "config";
  data: import("./backend").Config;
}

export interface DetailsData {
  type: "details";
  data: import("./backend").NodeDetails;
}

export interface ListData {
  type: "list";
  data: unknown[];
}

export interface NextStrainData {
  type: "nextstrain";
  data: Record<string, unknown>;
}

export type LocalBackendMessage =
  | StatusData
  | QueryData
  | SearchData
  | ConfigData
  | DetailsData
  | ListData
  | NextStrainData;
