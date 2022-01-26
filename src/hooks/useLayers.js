import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";

import { useMemo } from "react";

let getMMatrix = (zoom) => [ 1/2 ** zoom, 0, 0, 0, 0,1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];// new Matrix4().scale([Math.max(1, zoom), 1, 1]);

const useLayers = (data, viewState, colorHook, setHoverInfo) => {
  const {toRGB} = colorHook
  const accessor="meta_Lineage"
  const temp_scatter_layer = new ScatterplotLayer({
    id: "scatter-layer",
    data: data.data.leaves,
    getPosition: (d) => [d.x, d.y],
    getColor: (d) => toRGB(d[accessor]),
    // radius in pixels
    getRadius: 3,
    getLineColor: [100, 100, 100],
    opacity: 0.6,
    stroked: data.data.leaves && data.data.leaves.length < 3000,
    lineWidthUnits: "pixels",
    lineWidthScale: 1,
    pickable: true,
    radiusUnits: "pixels",
    onHover: (info) => setHoverInfo(info),
    modelMatrix: getMMatrix(viewState.zoom),

  });

  const temp_dataframe_of_bounds = [{
    x: viewState.min_x,
    y: viewState.min_y,
  },
  {
    x: viewState.max_x,
    y: viewState.min_y,
  },
  {
    x: viewState.max_x,
    y: viewState.max_y,
  },
  {
    x: viewState.min_x,
    y: viewState.max_y,
  }];

  if (viewState.real_target){
    const add =     {
      x: viewState.real_target[0],
      y: viewState.real_target[1],
    }
    temp_dataframe_of_bounds.push(add);
  }

  const bound_layer = new ScatterplotLayer
  ({
    id: "bound-layer",
    data: temp_dataframe_of_bounds,
    getPosition: (d) => [d.x, d.y],
    getColor: (d) => [0, 0, 0, 255],
    // radius in pixels
    getRadius: 4,
    pickable: true,
    radiusUnits: "pixels",
    modelMatrix: getMMatrix(viewState.zoom),
    

  });

  const lineColor = [150,150,150]
  const temp_line_layer = new LineLayer({
    id: "line-layer",
    data: data.data.lines,
    getSourcePosition: (d) => [d.x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.y],
    getColor: lineColor,
    pickable: true,
    
    modelMatrix: getMMatrix(viewState.zoom),
  });

  const temp_line_layer2 = new LineLayer({
    id: "line-layer",
    data: data.data.lines,
    getSourcePosition: (d) => [d.parent_x, d.y],
    getTargetPosition: (d) => [d.parent_x, d.parent_y],
    getColor: lineColor,
    pickable: true,
    modelMatrix: getMMatrix(viewState.zoom),
  });

  const layers = [bound_layer, temp_line_layer,temp_line_layer2,temp_scatter_layer];
  
  const max_text_number = 400;
  // If leaves are fewer than max_text_number, add a text layer
  if (data.data.leaves && data.data.leaves.length < max_text_number) {
    console.log("Adding text layer");
    const node_label_layer = new TextLayer({
      
      data: data.data.leaves,
      getPosition: (d) => [d.x+10, d.y],
      getText: (d) => d.name,
     
      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
      getSize: data.data.leaves.length <200  ? 12 : 9.5,
      modelMatrix: getMMatrix(viewState.zoom),
    });

  

    
    layers.push(node_label_layer);
    
  }

  const layerFilter = () => true;

  return { layers, layerFilter };
};

export default useLayers;
