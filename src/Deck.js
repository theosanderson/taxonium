/// app.js
import React, { useState , useMemo,useCallback,useRef} from 'react';
import DeckGL from '@deck.gl/react';
import { LineLayer, ScatterplotLayer ,PolygonLayer} from '@deck.gl/layers';
import * as node_data from './data2.json';
import { OrthographicView } from '@deck.gl/core';



const dummy_polygons = [{
       contour: [[-100,-100],[-100,100],[100,100],[100,-100]],
       zipcode: 94107,
       population: 26599,
      area: 6.11
     }]
 function toRGB(string) {
  var hash = 0;
  if (string.length === 0) return hash;
  for (var i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
  }
  var rgb = [0, 0, 0];
  for ( i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 255;
      rgb[i] = value;
  }
  if ((rgb[0]+rgb[1]+rgb[2])<50 || (rgb[0]+rgb[1]+rgb[2])>500){
    return toRGB(string+"_")
  }
  return rgb;
}


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
  const deckRef = useRef(null);
 
  const onClick = useCallback(event => {
   
    const pickInfo = deckRef.current.pickObject({
      x: event.clientX,
      y: event.clientY,
      radius: 1
    });
    console.log(viewState);
    if(pickInfo){
    //viewState.target=pickInfo.coordinate
    console.log(pickInfo)
    setViewState({...viewState,target:pickInfo.coordinate})
  }
  }, [viewState])
  


  const poly_layer = new PolygonLayer({
    id: 'mini-poly-layer',
    data:dummy_polygons,
    pickable: true,
    stroked: true,
    filled: true,
    wireframe: true,
    lineWidthMinPixels: 1,
    getPolygon: d => d.contour,

    getFillColor: d => [40,80,80],
    getLineColor: [80, 80, 80],
    getLineWidth: 1
  });


  const scatterplot_config = useMemo(() => { return {
    
    data:node_data.default.filter(x=> x.name!=null),
    opacity: 0.7,
    radiusMinPixels: 1,
    radiusMaxPixels: 3,
    getRadius: 0.2,
    getPosition: d => {
      return([d.x,d.y] )
    } ,
    getFillColor: d=>toRGB(d.lineage),
  
  }},[]);

  const scatter_layer_main =  useMemo(() => new ScatterplotLayer({id: 'main-scatter',  modelMatrix: getMMatrix(viewState.zoom),pickable:true,...scatterplot_config}),[viewState,scatterplot_config])

  const line_layer_main = useMemo(() => new LineLayer({
    id: 'main-lines', data, modelMatrix: getMMatrix(viewState.zoom)

  }),[viewState])


  const pos_layer_mini = useMemo(() =>new ScatterplotLayer({
    id: 'mini-pos',
    data: [viewState],
    opacity: 1,
    radiusMinPixels: 4,
    radiusMaxPixels: 4,
    getRadius: 4,
    getPosition: d => [0, d.target[1]],
    getFillColor: [255, 0, 0]
  }),[viewState])

  const scatter_layer_mini = useMemo(() => new ScatterplotLayer({id: 'mini-scatter',  ...scatterplot_config}),[scatterplot_config])

  const line_layer_mini = useMemo(() =>new LineLayer({
    id: 'mini-lines', data

  }),[])


  const layers = [
    poly_layer,line_layer_main, scatter_layer_main, line_layer_mini, scatter_layer_mini, pos_layer_mini
  ];


  return<div onClick={onClick}> <DeckGL ref={deckRef}
    views={[new OrthographicView({ id: 'main', controller: true }),
    new OrthographicView({ id: 'minimap', x: 10, y: 10, width: '20%', height: '43%', controller: true })]}
    viewState={viewState}
    onViewStateChange={useCallback(

      ({ viewId, viewState, oldViewState }) => {
        if (viewId === "minimap") {
          return
        }


        viewState['minimap'] = { zoom: 3, target: [10, 15] }
        viewState.target[0] = 3 / 2 ** (viewState.zoom - 6)


       
        setViewState(viewState)

      },[])
    }

    layerFilter={useCallback(({ layer, viewport }) => {
      return ((layer.id.startsWith("main") && viewport.id === "main") || (layer.id.startsWith("mini") && viewport.id === "minimap"))


    },[])}

    controller={true}
    layers={layers}
    getTooltip={({object}) => object && (object.name+": "+object.lineage) }

  /></div>
}

export default Deck
