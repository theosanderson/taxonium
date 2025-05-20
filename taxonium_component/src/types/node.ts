export interface Mutation {
  mutation_id?: string;
  gene?: string;
  previous_residue?: string;
  residue_pos?: string;
  new_residue?: string;
  type?: string;
  [key: string]: any;
}

export interface Node {
  node_id: string;
  parent_id?: string;
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
