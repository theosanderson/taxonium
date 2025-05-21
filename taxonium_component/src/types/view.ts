import type { OrthographicViewState } from "@deck.gl/core";

export interface SubViewState
  extends Omit<OrthographicViewState, "target" | "zoom"> {
  target: [number, number] | [number, number, number];
  zoom: number | [number, number];
  pitch?: number;
  bearing?: number;
  [key: string]: unknown;
}

export interface ViewState extends SubViewState {
  minimap?: SubViewState;
  "browser-main"?: SubViewState;
  "browser-axis"?: SubViewState;
  min_x?: number;
  max_x?: number;
  min_y?: number;
  max_y?: number;
  real_width?: number;
  real_height?: number;
  [key: string]: unknown;
}
