import type { Node } from "./node";
import type { NodeLookupData } from "./backend";

export interface ColorHook {
  toRGB: (val: string | number) => [number, number, number];
  toRGBCSS: (val: string | number) => string;
}

export interface ColorBy {
  colorByField: string;
  setColorByField?: (field: string) => void;
  colorByOptions: string[];
  getNodeColorField: (
    node: Node,
    dataset?: NodeLookupData
  ) => string | number;
  colorByPosition: number;
  setColorByPosition?: (pos: number) => void;
  colorByGene: string;
  setColorByGene?: (gene: string) => void;
}
