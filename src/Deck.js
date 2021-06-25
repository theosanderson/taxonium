/// app.js
import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';
import * as node_data from './data2.json';
import { OrthographicView } from '@deck.gl/core';


let getMMatrix = (zoom) => [1 / 2 ** (zoom - 6), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];



// Data to be used by the LineLayer
let data = [
 
];


node_data.default.forEach((node) => {
  let first_path = node.path[0]
  let first_node = node_data.default[first_path]

  if (first_node) {

    data.push({
      sourcePosition: [node.x, node.y],
      targetPosition: [first_node.x, node.y]
    })

    data.push({
      sourcePosition:[first_node.x, node.y],
      targetPosition: [first_node.x, first_node.y]
    })
  }

})

// DeckGL react component
function Deck() {

  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 10,
    zoom: 7
  }

  );

  const scatterplot_config = {
    
    data:node_data.default.filter(x=> x.name!=null),
    opacity: 0.7,
    radiusMinPixels: 1,
    radiusMaxPixels: 3,
    getRadius: 0.2,
    getPosition: d => {
      return([d.x,d.y] )
    } ,
    getFillColor: [233, 50, 233],
  
  }

  const scatter_layer_main = new ScatterplotLayer({id: 'main-scatter',  modelMatrix: getMMatrix(viewState.zoom),...scatterplot_config});

  const line_layer_main = new LineLayer({
    id: 'main-lines', data, modelMatrix: getMMatrix(viewState.zoom)

  })


  const pos_layer_mini = new ScatterplotLayer({
    id: 'mini-pos',
    data: [viewState],
    opacity: 1,
    radiusMinPixels: 4,
    radiusMaxPixels: 4,
    getRadius: 4,
    getPosition: d => [0, d.target[1]],
    getFillColor: [255, 0, 0]
  });

  const scatter_layer_mini = new ScatterplotLayer({id: 'mini-scatter',  ...scatterplot_config});

  const line_layer_mini = new LineLayer({
    id: 'mini-lines', data

  })


  const layers = [
    line_layer_main, scatter_layer_main, line_layer_mini, scatter_layer_mini, pos_layer_mini
  ];


  return <DeckGL
    views={[new OrthographicView({ id: 'main', controller: true }),
    new OrthographicView({ id: 'minimap', x: 10, y: 10, width: '20%', height: '20%', controller: true })]}
    viewState={viewState}
    onViewStateChange={

      ({ viewId, viewState, oldViewState }) => {
        if (viewId == "minimap") {
          return
        }


        viewState['minimap'] = { zoom: 2, target: [10, 15] }
        viewState.target[0] = 3 / 2 ** (viewState.zoom - 6)

        console.log(viewState)
        setViewState(viewState)
      }
    }

    layerFilter={({ layer, viewport }) => {
      return ((layer.id.startsWith("main") && viewport.id == "main") || (layer.id.startsWith("mini") && viewport.id == "minimap"))


    }}

    controller={true}
    layers={layers}

  />;
}

export default Deck
