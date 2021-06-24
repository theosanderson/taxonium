/// app.js
import React , {useState} from 'react';
import DeckGL from '@deck.gl/react';
import {LineLayer,ScatterplotLayer} from '@deck.gl/layers';
import * as node_data from './data2.json';
import {OrthographicView} from '@deck.gl/core';


let getMMatrix = (zoom) => [1/2 ** (zoom-6), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];



// Data to be used by the LineLayer
let data = [
  {sourcePosition: [0, 5], targetPosition: [5, 5]},
  {sourcePosition: [0,0], targetPosition: [5,5]}
];


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
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 7
  });

  const scatter = new ScatterplotLayer({
    id: 'scatterplot-layer',
    data,
    opacity:0.7,
    radiusMinPixels: 1,
    radiusMaxPixels: 3,
    getRadius:0.2,
    getPosition: d => d.sourcePosition,
    getFillColor:[233,50,233],
    modelMatrix: getMMatrix(viewState.zoom)
  });


  const layers = [
    new LineLayer({id: 'line-layer', data,modelMatrix: getMMatrix(viewState.zoom)
  }),scatter
  
  ];
  return <DeckGL
  views={new OrthographicView()}
  viewState={viewState}
  onViewStateChange={
    
    ({viewState, oldViewState}) => {
      
      const oldScale = 2**oldViewState.zoom;
      const newScale = 2**viewState.zoom;
      if (oldScale !== newScale && viewState.target && oldViewState.target) {
        viewState.target[0] = oldViewState.target[0] / newScale * oldScale;
      }
      setViewState(viewState)
    }
  }
    
    

      controller={true}
      layers={layers} />;
}

export default Deck