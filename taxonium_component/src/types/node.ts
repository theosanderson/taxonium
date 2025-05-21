export interface Mutation {
  mutation_id?: number;
  gene?: string;
  previous_residue?: string;
  residue_pos?: number;
  new_residue?: string;
  type?: "aa" | "nt";
  nuc_for_codon?: number;
  [key: string]: any;
}

export interface Node {
  node_id: number;
  parent_id?: number;
  mutations: Mutation[];
  [key: string]: any;
}

export interface HoverDetails {
  nodeDetails?: {
    acknowledgements?: {
      covv_orig_lab: string;
      covv_subm_lab: string;
      covv_authors: string;
    };
    [key: string]: any;
  } | null;
  [key: string]: any;
}
