/// app.js
import React, { useState, useMemo, useCallback, useRef } from "react";
import DeckGL from "@deck.gl/react";
import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";
import { OrthographicView } from "@deck.gl/core";
import Spinner from "./components/Spinner";
import {BiZoomIn,BiZoomOut} from "react-icons/bi"


const zoomThreshold = 8;
function coarse_and_fine_configs(config, node_data, precision) {
  const coarse = {
    ...config,
    data: reduceOverPlotting(config.data, node_data, precision),
    visible: true,
    id: config.id + "_coarse",
  };
  const mini = make_minimap_version(coarse);
  const fine = { ...config, visible: true, id: config.id + "_fine" };
  if(config.id.includes("line")){
    return [config,mini];
  }
  else{
  
  
  return [coarse, fine, mini];
  }
}

function make_minimap_version(config) {
  return {
    ...config,
    id: config.id.replace("main", "mini"),
    lineWidthScale: 1,
    pickable: false,
    getRadius: config.id.includes("search") ? config.getRadius*0.5 : config.getRadius
  };
}

function reduceOverPlotting(nodeIds, node_data, precision = 10) {
  const included_points = {};
 

  const filtered = nodeIds
    .filter((node) => {
    const rounded_x = Math.round(node_data.x[node] * precision) / precision;
    const rounded_y  = Math.round(node_data.y[node] * precision) / precision;
      if (included_points[rounded_x]) {
        if (included_points[rounded_x][rounded_y]) {
          return false;
        } else {
          included_points[rounded_x][rounded_y] = 1;
          return true;
        }
      } else {
        included_points[rounded_x] = { [rounded_y]: 1 };
        return true;
      }
    })
    

  return filtered;
}
const dummy_polygons = [
  {
    contour: [
      [-100, -100],
      [-100, 100],
      [100, 100],
      [100, -100],
    ],
    zipcode: 94107,
    population: 26599,
    area: 6.11,
  },
];
function toRGB(string) {
  if (string === undefined) {
    return [200, 200, 200];
  }
  if (string === "unknown") {
    return [200, 200, 200];
  }
  if (string === "USA") {
    return [95, 158, 245]; //This is just because the default is ugly
  }
  if (string === "England") {
    return [214, 58, 15]; // UK all brick
  }
  if (string === "Scotland") {
    return [255, 130, 82]; // UK all brick
  }
  if (string === "Wales") {
    return [148, 49, 22]; // UK all brick
  }
  if (string === "Northern Ireland") {
    return [140, 42, 15]; // UK all brick
  }
  if (string === "France") {
    return [140, 28, 120]; // diff to UK
  }
  if (string === "Germany") {
    return [106, 140, 28]; // diff to UK
  }
  if (string === "India") {
    return [61, 173, 166]; // diff to UK
  }
  if (string === "Denmark") {
    return [24, 112, 32]; // diff to UK
  }

  string = string.split("").reverse().join("");
  var hash = 0;
  if (string.length === 0) return hash;
  for (var i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  var rgb = [0, 0, 0];
  for (i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 255;
    rgb[i] = value;
  }
  if (rgb[0] + rgb[1] + rgb[2] < 150 || rgb[0] + rgb[1] + rgb[2] > 500) {
    return toRGB(string + "_");
  }
  return rgb;
}
function toRGBCSS(string) {
  const output = toRGB(string);
  return `rgb(${output[0]},${output[1]},${output[2]})`;
}

let getMMatrix = (zoom) => [
  1 / 2 ** (zoom - 5.6),
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
];

const getXval = (viewState) => 7 / 2 ** (viewState.zoom - 5.6);

function Deck({ data, colourBy, progress, setSelectedNode,scatterIds,search_configs_initial}) {
  const [textInfo, setTextInfo] = useState({ ids: [], top: 0, bottom: 0 });

  const node_data = data.node_data;

  
  const [hoverInfo, setHoverInfo] = useState();

  const [viewState, setViewState] = useState({
    zoom: 4.7,
    target: [6, 13],
  });

  const deckRef = useRef(null);

  const onViewStateChange = useCallback(
    ({ viewId, viewState, oldViewState }) => {
      if (viewId === "minimap") {
        return;
      }

      viewState["minimap"] = { zoom: 3.0, target: [5, 13] };
      viewState.target[0] = getXval(viewState);

      if (deckRef.current.viewports.length) {
        const main_vp = deckRef.current.viewports[0];
        const nw = main_vp.unproject([0, 0, 0]);
        const se = main_vp.unproject([main_vp.width, main_vp.height, 0]);
        se[0] = se[0] * 2 ** (viewState.zoom - 6);
        nw[0] = nw[0] * 2 ** (viewState.zoom - 6);
        viewState = { ...viewState, nw: nw, se: se, needs_update: false };
        nw[0] = -500;
        se[0] = 500;

        setViewState(viewState);
      }
    },
    [deckRef]
  );

  const [mouseDownIsMinimap, setMouseDownIsMinimap] = useState(false);

  const onClickOrMouseMove = useCallback(
    (event) => {
      if (event.buttons === 0 && event._reactName === "onPointerMove") {
        return false;
      }

      const pickInfo = deckRef.current.pickObject({
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
        radius: 1,
      });

      if (event._reactName === "onPointerDown") {
        if (pickInfo && pickInfo.viewport.id === "minimap") {
          setMouseDownIsMinimap(true);
        } else {
          setMouseDownIsMinimap(false);
        }
      }
      if (
        pickInfo &&
        pickInfo.viewport.id === "main" &&
        event._reactName === "onClick"
      ) {
        setSelectedNode(pickInfo.object);
      }

      if (!pickInfo && event._reactName === "onClick") {
        setSelectedNode(null);
      }

      if (
        pickInfo &&
        pickInfo.viewport.id === "minimap" &&
        mouseDownIsMinimap
      ) {
        const newViewState = {
          ...viewState,
          target: [getXval(viewState), pickInfo.coordinate[1]],
          needs_update: true,
        };
        setViewState(newViewState);
      }
    },
    [viewState, mouseDownIsMinimap, setSelectedNode]
  );

  const poly_layer = useMemo(
    () =>
      new PolygonLayer({
        //This dummy layer provides a gray background, but more importantly, it means that a picking event is always generated on clicks, allowing us to make pressing on the minimap change the view
        id: "mini-poly-layer",
        data: dummy_polygons,
        pickable: true,
        stroked: true,
        opacity: 0.5,
        filled: true,
        wireframe: true,
        getPolygon: (d) => d.contour,

        getFillColor: (d) => [240, 240, 240],
        getLineColor: [80, 80, 80],
        getLineWidth: 1,
        lineWidthUnits: 'pixels'
      }),
    []
  );

  const scatterplot_config = useMemo(() => {
    return {
      data: scatterIds.filter(() => true),
      visible: true,
      opacity: 0.6,
      getRadius: 3,
      radiusUnits: "pixels",

      id: "main-scatter",

      pickable: true,
      getLineColor: [100, 100, 100],

      lineWidthUnits: "pixels",
      lineWidthScale: 1,

      onHover: (info) => setHoverInfo(info),
      getPosition: (d) => {
        return [node_data.x[d], node_data.y[d]];
      },
      getFillColor: (d) => {
        if (colourBy === "lineage") {
          return toRGB(data.lineage_mapping[node_data.lineages[d]]);
        } else if (colourBy === "country") {
          return toRGB(data.country_mapping[node_data.countries[d]]);
        } else {
          return [200, 200, 200];
        }
      },
    };
  }, [scatterIds, node_data, data, colourBy]);

  const scatter_configs = useMemo(
    () => coarse_and_fine_configs(scatterplot_config, node_data, 100),
    [scatterplot_config, node_data]
  );
  const scatter_configs2 = useMemo(
    () =>
      scatter_configs.map((x) => ({
        ...x,
        modelMatrix: x.id.includes("mini")
          ? undefined
          : getMMatrix(viewState.zoom),
        stroked: x.id.includes("mini") ? undefined : viewState.zoom > 15,
        radiusMaxPixels: x.id.includes("mini")
          ? 2
          : viewState.zoom > 15
          ? viewState.zoom / 5
          : 3,
      })),
    [scatter_configs, viewState.zoom]
  );
  const scatter_layers = useMemo(
    () => scatter_configs2.map((x) => new ScatterplotLayer(x)),
    [scatter_configs2]
  );

  

  const search_configs = useMemo(
    () =>
      [].concat(
        ...search_configs_initial.map((x) =>
          coarse_and_fine_configs(x, node_data, 100)
        )
      ),
    [search_configs_initial, node_data]
  );

  const search_configs2 = useMemo(
    () =>
      search_configs.map((x) => ({
        ...x,
        modelMatrix: x.id.includes("mini")
          ? undefined
          : getMMatrix(viewState.zoom),
      })),
    [search_configs, viewState.zoom]
  );
  const search_layers = useMemo(
    () => search_configs2.map((x) => new ScatterplotLayer(x)),
    [search_configs2]
  );

  const line_layer_2_config = useMemo(
    () => ({
      id: "main-line",
      data: node_data.ids,
      pickable: false,
      getWidth: 1,
      getTargetPosition: (d) => [
        node_data.x[node_data.parents[d]],
        node_data.y[d],
      ],
      getSourcePosition: (d) => [node_data.x[d], node_data.y[d]],
      getColor: [150, 150, 150],
    }),
    [node_data]
  );

  const line_layer_3_config = useMemo(
    () => ({
      id: "main-line-2",
      data: node_data.ids,
      pickable: false,
      getWidth: 1,
      getTargetPosition: (d) => [
        node_data.x[node_data.parents[d]],
        node_data.y[node_data.parents[d]],
      ],
      getSourcePosition: (d) => [
        node_data.x[node_data.parents[d]],
        node_data.y[d],
      ],
      getColor: [150, 150, 150],
    }),
    [node_data]
  );

  const line_configs = useMemo(
    () =>
      [].concat.apply(
        [],
        [line_layer_2_config, line_layer_3_config].map((x) =>
          coarse_and_fine_configs(x, node_data, 100)
        )
      ),
    [line_layer_2_config, line_layer_3_config, node_data]
  );

  const line_configs2 = useMemo(
    () =>
      line_configs.map((x) => ({
        ...x,
        modelMatrix: x.id.includes("mini")
          ? undefined
          : getMMatrix(viewState.zoom),
      })),
    [line_configs, viewState.zoom]
  );
  const line_layers = useMemo(
    () => line_configs2.map((x) => new LineLayer(x)),
    [line_configs2]
  );

  if (viewState.zoom > 17) {
    /*
    Creating a text layer with every node takes a *long* time, even if it's not visible until zoomed, so we don't do that.

    Instead, this section of code runs every render. It checks whether the zoom is sufficient to start thinking about text. If not, it does nothing.

    If text will be displayed soon, we check whether the area of text that we have precomputed contains the current viewport. If so, we do nothing.

    If not we set textIds to the ids within a certain range (9* the height) of the current viewport. This will be used later on to make a layer by the memoised function.

    We also record the location for which we did the precomputation.
    */
    if (
      (viewState.nw[1] > textInfo.top) &
      (viewState.se[1] < textInfo.bottom)
    ) {
      // console.log("still within", viewState.nw[1] , textInfo.top)
    } else {
      const cur_top = viewState.nw[1];
      const cur_bot = viewState.se[1];
      const height = cur_bot - cur_top;
      const new_top = cur_top - height * 4;
      const new_bot = cur_bot + height * 4;
      const textIds = scatterIds.filter(
        (x) => (node_data.y[x] > new_top) & (node_data.y[x] < new_bot)
      );
      //console.log("recalculating text")
      setTextInfo({ top: new_top, bottom: new_bot, ids: textIds });
    }
  }

  const text_config = useMemo(
    () => ({
      id: "main-text-layer",
      data: textInfo.ids,
      getPosition: (d) => [node_data.x[d] + 0.3, node_data.y[d]],
      getText: (d) => node_data.names[d],
      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
    }),
    [node_data, textInfo]
  );

  const text_layers = useMemo(() => {
    if (true) {
      return [
        new TextLayer({
          ...text_config,
          visible: viewState.zoom > 18.5,
          getSize: viewState.zoom > 19 ? 12 : 9.5,
          modelMatrix: getMMatrix(viewState.zoom),
        }),
      ];
    } else {
      return [];
    }
  }, [text_config, viewState]);

  const pos_layer_mini = useMemo(
    () =>
      new PolygonLayer({
        id: "mini-pos",
        data: [viewState],
        opacity: 0.1,
        radiusMinPixels: 4,
        radiusMaxPixels: 4,
        getRadius: 4,
        getLineWidth: 0.1,
        getPolygon: (d) => {
          if (d.nw !== undefined) {
            return [
              [d.nw[0], d.nw[1]],
              [d.se[0], d.nw[1]],
              [d.se[0], d.se[1]],
              [d.nw[0], d.se[1]],
            ];
          } else {
            return [];
          }
        },
        getFillColor: [255, 255, 255],
      }),
    [viewState]
  );

  const layers = useMemo(
    () => [
      poly_layer,
      ...text_layers,
      ...line_layers,
      // text_layer,

      ...scatter_layers,

      ...search_layers,

      pos_layer_mini,
    ],
    [
      poly_layer,
      text_layers,

      scatter_layers,
      line_layers,

      pos_layer_mini,
      search_layers,
      // text_layer
    ]
  );

  window.deck = deckRef;

  const views = useMemo(
    () => [
      new OrthographicView({ id: "main", controller: true }),
      new OrthographicView({
        id: "minimap",
        x: "79%",
        y: "1%",
        width: "20%",
        height: "35%",
        controller: true,
      }),
    ],
    []
  );

  const hoverStuff = useMemo(() => {
    if (hoverInfo && hoverInfo.object) {
      const lineage =
        data.lineage_mapping[node_data.lineages[hoverInfo.object]];
      const country =
        data.country_mapping[node_data.countries[hoverInfo.object]];
      const date = data.date_mapping[node_data.dates[hoverInfo.object]];
      return (
        <div
          className="bg-gray-100 p-3 opacity-90 text-sm"
          style={{
            position: "absolute",
            zIndex: 1,
            pointerEvents: "none",
            left: hoverInfo.x,
            top: hoverInfo.y,
          }}
        >
          <h2 className="font-bold">{node_data.names[hoverInfo.object]}</h2>

          <div
            style={{
              color: toRGBCSS(lineage),
            }}
          >
            {lineage}
          </div>

          <div> {country}</div>
          {date}

          <div className="text-xs">
            {
              node_data.mutations[hoverInfo.object] &&
                node_data.mutations[hoverInfo.object].mutation &&
                node_data.mutations[hoverInfo.object].mutation
                  .map((x) => data.mutation_mapping[x])
                  .join(", ") //TODO assign the top thing to a constant and use it again
            }
          </div>
        </div>
      );
    }
  }, [data, node_data, hoverInfo]);
  const spinnerShown = useMemo(() => node_data.ids.length === 0, [node_data]);


  const zoomIncrement=useCallback( (increment)=>{
    
    const newViewState = {
      ...viewState,
      zoom:viewState.zoom+increment,
      
      needs_update: true,
    };
    const newViewState2 = {
      ...newViewState,
      target: [getXval(newViewState), newViewState.target[1]],
    };
    
    setViewState(newViewState2);
  },[viewState])

  return (
    <div
      className="w-full h-full relative"
      onClick={onClickOrMouseMove}
      onPointerMove={onClickOrMouseMove}
      onPointerDown={onClickOrMouseMove}
    >
      {" "}
      <DeckGL
        onAfterRender={() => {
          if (viewState.nw === undefined || viewState.needs_update) {
            onViewStateChange({ viewState });
          }
        }}
        ref={deckRef}
        views={views}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layerFilter={useCallback(
          ({ layer, viewport }) => {
            const first_bit =
              (layer.id.startsWith("main") && viewport.id === "main") ||
              (layer.id.startsWith("mini") &&
                viewport.id === "minimap" &&
                window.hidemini !== true);
            const second_bit =
              layer.id.includes("mini") |
              ((viewState.zoom < zoomThreshold) & !layer.id.includes("fine")) |
              ((viewState.zoom > zoomThreshold) & !layer.id.includes("coarse"));

            return first_bit & second_bit;
          },
          [viewState.zoom]
        )}
        controller={true}
        layers={layers}
      >
        {hoverStuff}
        <div style={{position:"absolute",
              right: "0.2em",
              bottom: "0.2em",
             }}>
        <button
               className=" w-12 h-10 bg-gray-100  p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
               onClick={()=>{zoomIncrement(0.6)}}
        ><BiZoomIn className="mx-auto  w-5 h-5 " /></button>
        <button
               className=" w-12 h-10 bg-gray-100 ml-1 p-1 rounded border-gray-300 text-gray-700  opacity-60  hover:opacity-100" onClick={()=>{zoomIncrement(-0.6)}}
        ><BiZoomOut  className="mx-auto w-5 h-5 "  /></button></div>
        
      </DeckGL>
      {spinnerShown && <Spinner isShown={true} progress={progress} />}
    </div>
  );
}

export default Deck;
