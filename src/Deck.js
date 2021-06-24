/// app.js
import React from 'react';
import DeckGL from '@deck.gl/react';
import {LineLayer} from '@deck.gl/layers';
import * as node_data from './data2.json';



// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 3,
  pitch: 0,
  bearing: 0
};

// Data to be used by the LineLayer
let data = [
  {sourcePosition: [0, 5], targetPosition: [5, 5]},
  {sourcePosition: [0,0], targetPosition: [5,5]}
];

let lines = [];

node_data.default.forEach((node)=>{
  let first_path=node.path[0]
  let first_node = node_data.default[first_path]
  
  if (first_node){
 
  data.push({sourcePosition:[node.x,node.y],
    targetPosition:[first_node.x,first_node.y]
  })
  }

})

// DeckGL react component
function Deck() {
  const layers = [
    new LineLayer({id: 'line-layer', data})
  ];
  return <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={layers} />;
}

export default Deck