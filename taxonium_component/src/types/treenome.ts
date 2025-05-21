import type { Mutation } from "./node";

export interface VariationDatum<M = any> {
  m: M;
  y: [number, number];
}

export interface NumericMutation extends Omit<Mutation, "residue_pos"> {
  residue_pos: number;
  gene: string;
  new_residue: string;
  type?: string;
  nuc_for_codon?: number;
}

export type NumericVariationDatum = VariationDatum<NumericMutation>;

export interface TreenomeState {
  ntBounds: [number, number];
  genomeSize: number;
}

export interface TreenomeSettings {
  treenomeEnabled: boolean;
  mutationTypesEnabled: { aa: boolean; nt: boolean };
}
