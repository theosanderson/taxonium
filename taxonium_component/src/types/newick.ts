export interface InputFile {
  status?: "url_supplied" | "loaded";
  filename?: string;
  data?: ArrayBuffer | string;
}

export interface MetadataFile extends InputFile {
  filetype: "meta_tsv" | "meta_csv";
  taxonColumn?: string;
}

export interface NewickFile extends InputFile {
  filetype: "nwk" | "nexus";
  ladderize?: boolean;
  useDistances?: boolean;
  metadata?: MetadataFile;
  taxonColumn?: string;
}

import type { Node, Mutation } from "./node";

export interface ProcessedTree {
  nodes: Node[];
  overallMaxX: number;
  overallMaxY: number;
  overallMinX: number;
  overallMinY: number;
  y_positions: number[];
  mutations: Mutation[];
  node_to_mut: Record<number, number[]>;
  rootMutations: Array<Mutation | number>;
  rootId: number;
  overwrite_config: {
    num_tips: number;
    from_newick: boolean;
    [key: string]: unknown;
  };
}
