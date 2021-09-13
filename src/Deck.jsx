/// app.js
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import DeckGL from "@deck.gl/react";
import {
  LineLayer,
  ScatterplotLayer,
  PolygonLayer,
  TextLayer,
} from "@deck.gl/layers";
import { OrthographicView } from "@deck.gl/core";
import Spinner from "./components/Spinner";
import { BiZoomIn, BiZoomOut } from "react-icons/bi";

const zoomThreshold = 8;
function coarse_and_fine_configs(
  config,
  node_data,
  precision,
  line_mode,
  optionalFineIds,
  optionalCoarseIds
) {
  const coarse = {
    ...config,
    data: optionalCoarseIds
      ? optionalCoarseIds
      : reduceOverPlotting(config.data, node_data, precision, line_mode),
    visible: true,
    id: config.id + "_coarse",
  };

  const mini = make_minimap_version(coarse);
  const fineIdsToSet = optionalFineIds ? optionalFineIds : config.data;
  const fine = {
    ...config,
    visible: true,
    id: config.id + "_fine",
    data: fineIdsToSet,
  };
  return [coarse, fine, mini];
}

function make_minimap_version(config) {
  return {
    ...config,
    id: config.id.replace("main", "mini"),
    lineWidthScale: 1,
    pickable: false,
    getRadius: config.id.includes("search")
      ? config.getRadius * 0.5
      : config.getRadius,
  };
}

function reduceOverPlotting(nodeIds, node_data, precision, line_mode) {
  const included_points = {};

  const filtered = nodeIds.filter((node) => {
    if (line_mode) {
      if (
        (Math.abs(node_data.x[node] - node_data.x[node_data.parents[node]]) >
          1) |
        (Math.abs(node_data.y[node] - node_data.y[node_data.parents[node]]) >
          0.5)
      ) {
        return true;
      }
    }

    const rounded_x = Math.round(node_data.x[node] * precision) / precision;
    const rounded_y = Math.round(node_data.y[node] * precision) / precision;
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
  });

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
const rgb_cache = {};

function toRGB(string) {
  if (rgb_cache[string]) {
    return rgb_cache[string];
  } else {
    const result = toRGB_uncached(string);
    rgb_cache[string] = result;
    return result;
  }
}

function toRGB_uncached(string) {
  const amino_acids = {
    A: [230, 25, 75],
    R: [60, 180, 75],
    N: [255, 225, 25],
    D: [67, 99, 216],
    C: [245, 130, 49],
    Q: [70, 240, 240],
    E: [145, 30, 180],

    G: [240, 50, 230],
    H: [188, 246, 12],
    I: [250, 190, 190],

    L: [230, 0, 255],
    K: [0, 128, 128],
    M: [154, 99, 36],
    F: [255, 250, 200],
    P: [128, 0, 0],
    T: [170, 255, 195],
    W: [128, 128, 0],

    Y: [0, 0, 117],
    V: [0, 100, 177],
    X: [128, 128, 128],
    O: [255, 255, 255],
    Z: [0, 0, 0],
  };

  if (amino_acids[string]) {
    return amino_acids[string];
  }

  if (string === undefined) {
    return [200, 200, 200];
  }
  if (string === "") {
    return [200, 200, 200];
  }
  if (string === "unknown") {
    return [200, 200, 200];
  }
  if (string === "USA") {
    return [95, 158, 245]; //This is just because the default is ugly
  }
  
   if (string === "B.1.2") {
    return [95, 158, 245]; //This is near B.1.617.2
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

const getXval = (viewState) => 7 / 2 ** (viewState.zoom - 5.6);

function Deck({
  showMutText,
  data,
  colourBy,
  progress,
  setSelectedNode,
  scatterIds,
  search_configs_initial,
  zoomToSearch,
  selectedNode,
}) {
  const [textInfo, setTextInfo] = useState({ ids: [], top: 0, bottom: 0 });
  const [fineScatterInfo, setFineScatterInfo] = useState({
    ids: [],
    top: 0,
    bottom: 0,
  });

  const node_data = data.node_data;

  const [hoverInfo, setHoverInfo] = useState();

  const [viewState, setViewState] = useState({
    zoom: 4.7,
    target: [6, 13],
  });
  const [xZoom, setXZoom] = useState(0);
  const MMatrix = useMemo(
    () => [
      1 / 2 ** (viewState.zoom - xZoom - 5.6),
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
    ],
    [viewState.zoom, xZoom]
  );
  const deckRef = useRef(null);

  const onViewStateChange = useCallback(
    ({ viewId, viewState, oldViewState }) => {
      const zoom_in_x = false;
      if (zoom_in_x && oldViewState) {
        if (viewState.zoom !== oldViewState.zoom) {
          const diff = viewState.zoom - oldViewState.zoom;
          const newxzoom = xZoom + diff;
          setXZoom(newxzoom);
          viewState.zoom = oldViewState.zoom;
        }
      }
      if (viewId === "minimap") {
        return;
      }

      viewState["minimap"] = { zoom: 3.0, target: [5, 13] };
      if (zoom_in_x) {
        if (oldViewState) {
          viewState.target[1] = oldViewState.target[1];
        }
      } else {
        viewState.target[0] = getXval(viewState);
      }
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
    [deckRef, xZoom]
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
        radius: 10,
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
        onViewStateChange({ viewState: newViewState, oldViewState: viewState });
      }
    },
    [viewState, mouseDownIsMinimap, setSelectedNode, onViewStateChange]
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
        lineWidthUnits: "pixels",
      }),
    []
  );

  const getResidue = useMemo(() => {
    let cache = {};

    const the_function = (node, gene, position) => {
      let residue = null;
      let cur_node = node;

      let path = [];
      while (residue == null) {
        let return_val = null;
        path.push(cur_node);
        let interesting_mutations;
        if (cache[cur_node]) {
          return_val = cache[cur_node];
        } else {
          interesting_mutations =
            node_data.mutations[cur_node].mutation &&
            node_data.mutations[cur_node].mutation.filter(
              (x) =>
                data.mutation_mapping[x].gene === gene &&
                data.mutation_mapping[x].position === position
            );

          if (interesting_mutations && interesting_mutations.length === 1) {
            return_val =
              data.mutation_mapping[interesting_mutations[0]].final_res;
          }
          if (node_data.parents[cur_node] === cur_node && return_val == null) {
            return_val = "X";
          }
        }
        if (return_val) {
          path.forEach((x) => {
            cache[x] = return_val;
          });
          return return_val;
        }
        cur_node = node_data.parents[cur_node];
      }
    };
    return the_function;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node_data, data, colourBy]);

  const coarseScatterIds = useMemo(() => {
    return reduceOverPlotting(scatterIds, node_data, 100, false);
  }, [scatterIds, node_data]);

  const scatterFillFunction = useMemo(() => {
    if (colourBy.variable === "lineage") {
      return (d) => toRGB(data.lineage_mapping[node_data.lineages[d]]);
    } else if (colourBy.variable === "country") {
      return (d) => toRGB(data.country_mapping[node_data.countries[d]]);
    } else if (colourBy.variable === "aa") {
      return (d) => toRGB(getResidue(d, colourBy.gene, colourBy.residue));
    } else {
      return [200, 200, 200];
    }
  }, [colourBy, node_data, data, getResidue]);

  const scatterplot_config = {
    data: scatterIds,
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
    updateTriggers: {
      getFillColor: scatterFillFunction,
    },
    getFillColor: scatterFillFunction,
  };

  const scatter_configs = coarse_and_fine_configs(
    scatterplot_config,
    node_data,
    100,
    false,
    fineScatterInfo.ids,
    coarseScatterIds
  );

  const scatter_configs2 = scatter_configs.map((x) => ({
    ...x,
    modelMatrix: x.id.includes("mini") ? undefined : MMatrix,
    stroked: x.id.includes("mini") ? undefined : viewState.zoom > 15,
    radiusMaxPixels: x.id.includes("mini")
      ? 2
      : viewState.zoom > 15
      ? viewState.zoom / 5
      : 3,
  }));
  const scatter_layers = scatter_configs2.map((x) => new ScatterplotLayer(x));

  const selected_node_layer = useMemo(
    () =>
      new ScatterplotLayer({
        data: selectedNode ? [selectedNode] : [],
        visible: true,
        opacity: 1,
        getRadius: 6,
        radiusUnits: "pixels",

        id: "main-selected",
        filled: false,
        stroked: true,
        modelMatrix: MMatrix,

        getLineColor: [0, 0, 0],
        getPosition: (d) => {
          return [node_data.x[d], node_data.y[d]];
        },
        lineWidthUnits: "pixels",
        lineWidthScale: 2,
      }),
    [selectedNode, node_data, MMatrix]
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
        modelMatrix: x.id.includes("mini") ? undefined : MMatrix,
      })),
    [search_configs, MMatrix]
  );
  const search_layers = useMemo(
    () => search_configs2.map((x) => new ScatterplotLayer(x)),
    [search_configs2]
  );

  const line_layer_2_config = useMemo(
    () => ({
      id: "main-line",
      data: node_data.ids.filter((x) => true),

      getWidth: 1,
      pickable: true,
      onHover: (info) => setHoverInfo(info),
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
      data: node_data.ids.filter((x) => true),
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
          coarse_and_fine_configs(x, node_data, 100, true)
        )
      ),
    [line_layer_2_config, line_layer_3_config, node_data]
  );

  const line_configs2 = useMemo(
    () =>
      line_configs.map((x) => ({
        ...x,
        modelMatrix: x.id.includes("mini") ? undefined : MMatrix,
      })),
    [line_configs, MMatrix]
  );
  const line_layers = useMemo(
    () => line_configs2.map((x) => new LineLayer(x)),
    [line_configs2]
  );

  if (viewState.zoom > 17 && viewState.needs_update !== true) {
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
      setTextInfo({
        top: new_top,
        bottom: new_bot,
        ids: textIds,
      });
    }
  }

  if (viewState.zoom > zoomThreshold - 1 && viewState.needs_update !== true) {
    // Fine coarse
    if (
      (viewState.nw[1] > fineScatterInfo.top) &
      (viewState.se[1] < fineScatterInfo.bottom)
    ) {
      // still within
    } else {
      const cur_top = viewState.nw[1];
      const cur_bot = viewState.se[1];
      const height = cur_bot - cur_top;
      const new_top = cur_top - height * 2;
      const new_bot = cur_bot + height * 2;
      const fineScatterIds = scatterIds.filter(
        (x) => (node_data.y[x] > new_top) & (node_data.y[x] < new_bot)
      );

      //console.log("recalculating text")
      setFineScatterInfo({
        top: new_top,
        bottom: new_bot,
        ids: fineScatterIds,
      });
    }
  }

  const mutTextIds = useMemo(
    () =>
      showMutText
        ? node_data.ids.filter(
            (x) =>
              /* node_data.y[x] > new_top &&
      node_data.y[x] < new_bot &&*/
              node_data.num_tips[x] > 10 && node_data.mutations[x]
          )
        : [],
    [node_data.ids, node_data.mutations, node_data.num_tips, showMutText]
  );
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

  const text_config_muts = useMemo(
    () => ({
      id: "main-text-muts-layer",
      data: mutTextIds.filter(() => true),
      getPosition: (d) => [node_data.x[d], node_data.y[d]],
      getText: (d) =>
        node_data.mutations[d].mutation
          ? node_data.mutations[d].mutation
              .map((y) => {
                const x = data.mutation_mapping[y];

                return x.gene + ":" + x.orig_res + x.position + x.final_res;
              })
              .sort()
              .join(", ")
          : "",
      getColor: [180, 180, 180],
      getAngle: 0,

      billboard: true,
      getTextAnchor: "start",
      getAlignmentBaseline: "center",
    }),
    [
      data.mutation_mapping,
      mutTextIds,
      node_data.mutations,
      node_data.x,
      node_data.y,
    ]
  );

  const text_layers = useMemo(() => {
    if (true) {
      return [
        new TextLayer({
          ...text_config,
          visible: viewState.zoom > 18.5,
          getSize: viewState.zoom > 19 ? 12 : 9.5,
          modelMatrix: MMatrix,
        }),
      ];
    } else {
      return [];
    }
  }, [text_config, MMatrix, viewState]);

  const text_layer_muts = useMemo(() => {
    if (!showMutText) {
      return [];
    }
    return [
      new TextLayer({
        ...text_config_muts,
        visible: true,
        getSize: viewState.zoom > 19 ? 12 : 9.5,
        modelMatrix: MMatrix,
        getColor: [0, 0, 0],
      }),
    ];
  }, [text_config_muts, viewState, MMatrix, showMutText]);

  const pos_layer_mini = useMemo(() => {
    let data;
    if (viewState.nw !== undefined) {
      data = [
        {
          contour: [
            [-100, -100],
            [100, -100],
            [100, viewState.nw[1]],
            [-100, viewState.nw[1]],
          ],
          color: [100, 100, 100],
        },
        {
          contour: [
            [-100, viewState.nw[1]],
            [100, viewState.nw[1]],
            [100, viewState.se[1]],
            [-100, viewState.se[1]],
          ],
          color: [255, 255, 255],
        },

        {
          contour: [
            [-100, viewState.se[1]],
            [100, viewState.se[1]],
            [100, 300],
            [-100, 300],
          ],
          color: [150, 150, 150],
        },
      ];
    } else {
      data = [];
    }

    return new PolygonLayer({
      id: "mini-pos",
      data: data,
      opacity: 0.05,
      radiusMinPixels: 4,
      radiusMaxPixels: 4,
      getRadius: 4,
      getLineWidth: 0.1,
      getPolygon: (d) => {
        return d.contour;
      },
      getFillColor: (d) => d.color,
    });
  }, [viewState]);

  const layers = useMemo(
    () => [
      poly_layer,
      ...text_layers,
      ...line_layers,
      // text_layer,

      ...scatter_layers,

      ...search_layers,

      pos_layer_mini,
      selected_node_layer,
      ...text_layer_muts,
    ],
    [
      poly_layer,
      text_layers,

      scatter_layers,
      line_layers,

      pos_layer_mini,
      search_layers,
      // text_layer
      selected_node_layer,
      text_layer_muts,
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
        borderWidth: "1px",
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
      let aa, aa_col;
      if (colourBy.variable === "aa") {
        aa = getResidue(hoverInfo.object, colourBy.gene, colourBy.residue);
        aa_col = toRGBCSS(aa);
      }

      const mutations =
        node_data.mutations[hoverInfo.object] &&
        node_data.mutations[hoverInfo.object].mutation &&
        node_data.mutations[hoverInfo.object].mutation
          .map((y) => {
            const x = data.mutation_mapping[y];

            return x.gene + ":" + x.orig_res + x.position + x.final_res;
          })
          .sort();
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
          {aa && (
            <div className="bg-white p-1 inline-block">
              {colourBy.gene}:{colourBy.residue}
              <span
                className="font-bold"
                style={{
                  color: aa_col,
                }}
              >
                {aa}
              </span>
            </div>
          )}
          <div
            style={{
              color:
                colourBy.variable === "lineage" ? toRGBCSS(lineage) : "inherit",
            }}
          >
            {lineage}
          </div>

          <div
            style={{
              color:
                colourBy.variable === "country" ? toRGBCSS(country) : "inherit",
            }}
          >
            {country}
          </div>
          {date}

          <div className="text-xs text-gray-600">
            <div className="mt-1">
              <b>Node mutations</b>
            </div>

            {mutations ? mutations.join(", ") : <i>No coding mutations</i>}
          </div>
        </div>
      );
    }
  }, [data, node_data, hoverInfo, colourBy, getResidue]);
  const spinnerShown = useMemo(() => node_data.ids.length === 0, [node_data]);

  const zoomIncrement = useCallback(
    (increment) => {
      const newViewState = {
        ...viewState,
        zoom: viewState.zoom + increment,

        needs_update: true,
      };
      const newViewState2 = {
        ...newViewState,
        target: [getXval(newViewState), newViewState.target[1]],
      };

      onViewStateChange({ viewState: newViewState2, oldViewState: viewState });
    },
    [viewState, onViewStateChange]
  );

  const getMaxOfArrayUsingReduce = (array) =>
    array.reduce((max, b) => (b > max ? b : max), array[0]);

  const getMinOfArrayUsingReduce = (array) =>
    array.reduce((min, b) => (b < min ? b : min), array[0]);

  useEffect(() => {
    if (zoomToSearch.index !== null | zoomToSearch>0) {
      
      let zoom_val
      if(!zoomToSearch.index){zoom_val=zoomToSearch}else{zoom_val=zoomToSearch.index}
      

      console.log("zoomToSearch", zoom_val);

      const valid_search = search_configs_initial.filter(
        (x) => x.original_index === zoom_val
      )

      if(valid_search.length === 0){
        return

      }
      

      const y_values = valid_search[0].data.map(x=>node_data.y[x])


      if(y_values.length === 0){
        return

      }
      

      const max_y_val = getMaxOfArrayUsingReduce(y_values)
      const min_y_val = getMinOfArrayUsingReduce(y_values)
  
      
      const newViewState = {
        ...viewState,
        zoom: 9-Math.log2(max_y_val-min_y_val+.001),

        needs_update: true,
      };


      const newViewState2 = {
        ...newViewState,
        target: [
          getXval(newViewState),
          (min_y_val + max_y_val) / 2
          
            
          ,
        ],
      };

      setViewState(newViewState2);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomToSearch,node_data]);

  return (
    <div
      className="w-full h-full relative"
      onClick={onClickOrMouseMove}
      onPointerMove={onClickOrMouseMove}
      onPointerDown={onClickOrMouseMove}
    >
      {" "}
      <DeckGL
        pickingRadius={10}
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
              (layer.id.startsWith("mini") && viewport.id === "minimap");
            const second_bit =
              layer.id.includes("mini") |
              ((viewState.zoom < zoomThreshold) & !layer.id.includes("fine")) |
              ((viewState.zoom >= zoomThreshold) & !layer.id.includes("coarse"));

            return first_bit & second_bit;
          },
          [viewState.zoom]
        )}
        controller={true}
        layers={layers}
      >
        {hoverStuff}
        <div style={{ position: "absolute", right: "0.2em", bottom: "0.2em" }}>
          <button
            className=" w-12 h-10 bg-gray-100  p-1 rounded border-gray-300 text-gray-700 opacity-60 hover:opacity-100"
            onClick={() => {
              zoomIncrement(0.6);
            }}
          >
            <BiZoomIn className="mx-auto  w-5 h-5 " />
          </button>
          <button
            className=" w-12 h-10 bg-gray-100 ml-1 p-1 rounded border-gray-300 text-gray-700  opacity-60  hover:opacity-100"
            onClick={() => {
              zoomIncrement(-0.6);
            }}
          >
            <BiZoomOut className="mx-auto w-5 h-5 " />
          </button>
        </div>
      </DeckGL>
      {spinnerShown && <Spinner isShown={true} progress={progress} />}
    </div>
  );
}

export default Deck;
