export interface VariationDatum<M = any> {
  m: M;
  y: [number, number];
}

export interface TreenomeState {
  ntBounds: [number, number];
  genomeSize: number;
}

export interface TreenomeSettings {
  treenomeEnabled: boolean;
  mutationTypesEnabled: { aa: boolean; nt: boolean };
}
