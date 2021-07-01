/// app.js
import React, { useState, useMemo, useCallback, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { LineLayer, ScatterplotLayer, PolygonLayer } from "@deck.gl/layers";
import { OrthographicView } from "@deck.gl/core";
import Spinner from "./components/Spinner";

function reduceOverPlotting(dataset, precision = 10) {
  const included_points = {};
  const rounded_dataset = dataset.map((node) => {
    const new_node = { ...node };
    new_node.x = Math.round(node.x * precision) / precision;
    new_node.y = Math.round(node.y * precision) / precision;
    return new_node;
  });

  const filtered = rounded_dataset.filter((node) => {
    if (included_points[node.x]) {
      if (included_points[node.x][node.y]) {
        return false;
      } else {
        included_points[node.x][node.y] = 1;
        return true;
      }
    } else {
      included_points[node.x] = { [node.y]: 1 };
      return true;
    }
  });

  console.log(filtered.length, ":");
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
    return [  106, 140, 28]; // diff to UK
  }
  if (string === "India") {
    return [  61, 173, 166]; // diff to UK
  }
  if (string === "Denmark") {
    return [  24, 112, 32]; // diff to UK
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

// DeckGL react component
function Deck({ nodeData, metadata, colourBy, searchItems }) {
  window.searchItems = searchItems;
  const scatterData = useMemo(
    () => nodeData.filter((x) => x.name !== null),
    [nodeData]
  );
  // Data to be used by the LineLayer
  const lineData = useMemo(() => {
    let data = [];

    nodeData.forEach((node) => {
      let first_path = node.parent;
      let first_node = nodeData[first_path];

      if (first_node) {
        data.push({
          sourcePosition: [node.x, node.y],
          targetPosition: [first_node.x, node.y],
        });

        data.push({
          sourcePosition: [first_node.x, node.y],
          targetPosition: [first_node.x, first_node.y],
        });
      }
    });
    return data;
  }, [nodeData]);

  const [hoverInfo, setHoverInfo] = useState();
  const zoomThreshold = 8;
  const [viewState, setViewState] = useState({
    zoom: 4.5,
    target: [6, 15],
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
        viewState = { ...viewState, nw: nw, se: se, needs_update:false };
        nw[0] = -500;
        se[0] = 500;

        setViewState(viewState);
      }
    },
    [deckRef]
  );
  
  const [mouseDownIsMinimap,setMouseDownIsMinimap] = useState(false)

  const onClickOrMouseMove = useCallback(
    (event) => {
      if (event.buttons === 0 && event._reactName === "onMouseMove") {
        return false;
      }

    
      const pickInfo = deckRef.current.pickObject({
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
        radius: 1,
      });
      //console.log(viewState);

      if ( event._reactName === "onMouseDown") {
        if (pickInfo && pickInfo.viewport.id === "minimap") {
          setMouseDownIsMinimap(true)
        }
        else{
          setMouseDownIsMinimap(false)
        }
      }


      if (pickInfo && pickInfo.viewport.id === "minimap" && mouseDownIsMinimap) {
        //viewState.target=pickInfo.coordinate
        //console.log(pickInfo)
        const newViewState = {
          ...viewState,
          target: [getXval(viewState), pickInfo.coordinate[1]],
          needs_update:true
        };
        setViewState(newViewState );
      }
    },
    [viewState,mouseDownIsMinimap]
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
        lineWidthMinPixels: 1,
        getPolygon: (d) => d.contour,

        getFillColor: (d) => [240, 240, 240],
        getLineColor: [80, 80, 80],
        getLineWidth: 1,
      }),
    []
  );

  const minimapScatterData = useMemo(
    () => reduceOverPlotting(scatterData),
    [scatterData]
  );

  const coarseScatterData = useMemo(
    () => reduceOverPlotting(scatterData, 100),
    [scatterData]
  );

  const scatterplot_config = useMemo(() => {
    return {
      data: scatterData.filter(() => true),
      visble: true,
      opacity: 0.7,
      radiusMinPixels: 1,
      radiusMaxPixels: 2,
      getRadius: 4,
      radiusUnits: "pixels",
      getPosition: (d) => {
        return [d.x, d.y];
      },
      getFillColor: (d) => toRGB(metadata[d.name][colourBy]),
    };
  }, [scatterData, metadata, colourBy]);

  const search_configs_initial = useMemo(() => {
    const colors = [
      [255, 213, 0],
      [183, 0, 255],
      [255, 0, 0],
      [0, 0, 255],
      [0, 255, 255],
    ];
    const configs = searchItems
      .map((item, counter) => {
        const filter_function =
          item.category === "mutation"
            ? (x) =>
                metadata[x.name]["aa_subs"] &&
                metadata[x.name]["aa_subs"].includes(item.value)
            : item.category === "name"
            ? (x) => x.name === item.value
            : (x) => metadata[x.name][item.category] === item.value;
        const enabled =
          item.value !== null && item.value !== "" && item.enabled;
        return {
          enabled: enabled,
          data: enabled ? scatterData.filter(filter_function) : [],
          opacity: 0.7,
          radiusMinPixels: 10 + counter * 2,
          filled: false,
          stroked: true,
          radiusMaxPixels: 10 + counter * 2,
          getRadius: 8,
          radiusUnits: "pixels",
          lineWidthUnits: "pixels",
          lineWidthScale: 1,

          getPosition: (d) => {
            return [d.x, d.y];
          },
          getFillColor: (d) => [0, 0, 0],
          getLineColor: (d) => colors[counter % colors.length],
        };
      })
      
    return configs;
  }, [metadata, scatterData, searchItems]);

  const search_layers_main = useMemo(() => {
    console.log("main");
    const mains = search_configs_initial.map(
      (x, i) =>
        new ScatterplotLayer({
          ...x,
          id: "main-search" + i,
          modelMatrix: getMMatrix(viewState.zoom),
        })
    );
    return mains;
  }, [search_configs_initial, viewState.zoom]);

  const search_layers_mini = useMemo(() => {
    console.log("mini");
    const minis = search_configs_initial.map(
      (x, i) =>
        new ScatterplotLayer({
          ...x,
          id: "mini-search" + i,
        })
    );

    return minis;
  }, [search_configs_initial]);

  const scatter_layer_main = useMemo(
    () =>
      new ScatterplotLayer({
        ...scatterplot_config,
        radiusMinPixels: 1,
        radiusMaxPixels: 4,
        getRadius: 4,
        opacity: viewState.zoom > 15 ? 0.8 : 0.6,
        id: "main-scatter",
        modelMatrix: getMMatrix(viewState.zoom),
        pickable: true,
        getLineColor: (d) => [100, 100, 100],
        stroked: viewState.zoom > 15,
        lineWidthUnits: "pixels",
        lineWidthScale: 1,
        visible: viewState.zoom > zoomThreshold,
        onHover: (info) => setHoverInfo(info),
      }),
    [viewState, scatterplot_config]
  );

  const line_layer_main = useMemo(
    () =>
      new LineLayer({
        id: "main-lines",
        data: lineData,
        getColor: (d) => [70, 70, 70],
        modelMatrix: getMMatrix(viewState.zoom),
      }),
    [viewState, lineData]
  );

  const pos_layer_mini = useMemo(
    () =>
      new PolygonLayer({
        id: "mini-pos",
        data: [viewState],
        opacity: 0.2,
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

  const scatter_layer_mini = useMemo(
    () =>
      new ScatterplotLayer({
        id: "mini-scatter",
        ...scatterplot_config,
        data: minimapScatterData.filter(() => true),
        visible: true,
      }),
    [scatterplot_config, minimapScatterData]
  );

  const scatter_layer_coarse = useMemo(
    () =>
      new ScatterplotLayer({
        ...scatterplot_config,
        id: "main-scatter-coarse",
        data: coarseScatterData.filter(() => true),
        radiusMinPixels: 1,
        radiusMaxPixels: 4,
        getRadius: 4,
        opacity: viewState.zoom > 15 ? 0.8 : 0.6,

        modelMatrix: getMMatrix(viewState.zoom),
        pickable: true,
        getLineColor: (d) => [100, 100, 100],
        stroked: viewState.zoom > 15,
        lineWidthUnits: "pixels",
        lineWidthScale: 1,
        visible: viewState.zoom < zoomThreshold,
        onHover: (info) => setHoverInfo(info),
      }),
    [scatterplot_config, coarseScatterData, viewState.zoom]
  );

  const line_layer_mini = useMemo(
    () =>
      new LineLayer({
        id: "mini-lines",
        data: lineData,
      }),
    [lineData]
  );

  const layers = useMemo(
    () => [
      poly_layer,
      line_layer_main,
      scatter_layer_main,
      scatter_layer_coarse,
      line_layer_mini,
      scatter_layer_mini,
      pos_layer_mini,
      ...search_layers_main,
      ...search_layers_mini,
    ],
    [
      poly_layer,
      line_layer_main,
      scatter_layer_main,
      scatter_layer_coarse,
      line_layer_mini,
      scatter_layer_mini,
      pos_layer_mini,
      search_layers_main,
      search_layers_mini,
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
          <h2 className="font-bold">{hoverInfo.object.name}</h2>
          {metadata[hoverInfo.object.name].lineage !== "unknown" && (
            <div
              style={{
                color: toRGBCSS(metadata[hoverInfo.object.name].lineage),
              }}
            >
              {metadata[hoverInfo.object.name].lineage}
            </div>
          )}
          {metadata[hoverInfo.object.name].date !== "unknown" && (
            <div className="italic">{metadata[hoverInfo.object.name].date}</div>
          )}
          {metadata[hoverInfo.object.name].date === "unknown" && (
            <div className="italic text-sm">
              Import GISAID data for lineage info outside the UK
            </div>
          )}
          <div className="text-xs">
            {
              metadata[hoverInfo.object.name].aa_subs &&
                metadata[hoverInfo.object.name].aa_subs.join(", ") //TODO assign the top thing to a constant and use it again
            }
          </div>
        </div>
      );
    }
  }, [metadata, hoverInfo]);
  const spinnerShown = useMemo(
    () => nodeData.length === 0 || !Object.keys(metadata).length,
    [metadata, nodeData]
  );

  return (
    <div
      className="w-full h-full relative"
      onClick={onClickOrMouseMove}
      onMouseMove={onClickOrMouseMove}
      onMouseDown={onClickOrMouseMove}
    >
      {" "}
      <DeckGL
        onAfterRender={() => {
          if (viewState.nw === undefined||viewState.needs_update) {
            onViewStateChange({ viewState });
          }
        }}
        ref={deckRef}
        views={views}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layerFilter={useCallback(({ layer, viewport }) => {
          return (
            (layer.id.startsWith("main") && viewport.id === "main") ||
            (layer.id.startsWith("mini") &&
              viewport.id === "minimap" &&
              window.hidemini !== true)
          );
        }, [])}
        controller={true}
        layers={layers}
      >
        {hoverStuff}
      </DeckGL>
      {spinnerShown && <Spinner isShown={true} />}
    </div>
  );
}

export default Deck;
