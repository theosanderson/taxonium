import type { Mutation } from "./node";

export interface VariationDatum<M = any> {
  m: M;
  y: [number, number];
}

export type MutationVariationDatum = VariationDatum<Mutation>;

export interface TreenomeState {
  ntBounds: [number, number];
  genomeSize: number;
}

export interface TreenomeSettings {
  treenomeEnabled: boolean;
  mutationTypesEnabled: { aa: boolean; nt: boolean };
}
