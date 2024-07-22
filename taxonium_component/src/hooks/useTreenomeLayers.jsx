import { useMemo, useCallback, useEffect } from "react";
import { LineLayer, PolygonLayer, SolidPolygonLayer } from "@deck.gl/layers";
import useTreenomeLayerData from "./useTreenomeLayerData";

const useTreenomeLayers = (
  treenomeState,
  data,
  viewState,
  colorHook,
  setHoverInfo,
  settings,
  treenomeReferenceInfo,
  setTreenomeReferenceInfo,
  selectedDetails,
) => {
  const myGetPolygonOffset = ({ layerIndex }) => [0, -(layerIndex + 999) * 100];
  const modelMatrixFixedX = useMemo(() => {
    return [
      1 / 2 ** viewState.zoom,
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
  }, [viewState.zoom]);

  const variation_padding = useMemo(() => {
    if (!data.data.nodes) {
      return 0;
    }
    if (data.data.nodes.length < 10000) {
      return 0.0001;
    } else {
      return 0;
    }
  }, [data.data]);
  const aaWidth = useMemo(() => {
    const browserWidth = treenomeState.xBounds[1] - treenomeState.xBounds[0];
    const numNt = treenomeState.ntBounds[1] - treenomeState.ntBounds[0];
    return numNt > 600 ? 2 : (browserWidth / numNt) * 3;
  }, [treenomeState.ntBounds, treenomeState.xBounds]);
  const ntWidth = useMemo(() => {
    return aaWidth / 3;
  }, [aaWidth]);
  const cov2Genes = useMemo(() => {
    if (settings.isCov2Tree) {
      return {
        // [start, end, [color]]
        ORF1a: [266, 13469, [142, 188, 102]],
        ORF1b: [13468, 21556, [229, 150, 5]],
        ORF1ab: [266, 21556, [142, 188, 102]],
        S: [21563, 25385, [80, 151, 186]],
        ORF3a: [25393, 26221, [170, 189, 82]],
        E: [26245, 26473, [217, 173, 61]],
        M: [26523, 27192, [80, 151, 186]],
        ORF6: [27202, 27388, [223, 67, 39]],
        ORF7a: [27394, 27760, [196, 185, 69]],
        ORF7b: [27756, 27888, [117, 182, 129]],
        ORF8: [27894, 28260, [96, 170, 1158]],
        N: [28274, 29534, [230, 112, 48]],
        ORF10: [29558, 29675, [90, 200, 216]],
      };
    } else {
      return null;
    }
  }, [settings.isCov2Tree]);

  const ntToCov2Gene = useCallback(
    (nt) => {
      if (cov2Genes !== null) {
        for (const gene of Object.keys(cov2Genes)) {
          const [start, end, color] = cov2Genes[gene];
          if (nt >= start && nt <= end) {
            return gene;
          }
        }
      }
      return null;
    },
    [cov2Genes],
  );

  let layers = [];

  const [
    layerDataAa,
    layerDataNt,
    computedReference,
    cachedVarDataAa,
    cachedVarDataNt,
  ] = useTreenomeLayerData(data, treenomeState, settings);
  useEffect(() => {
    if (!treenomeReferenceInfo) {
      setTreenomeReferenceInfo(computedReference);
    }
  }, [computedReference, treenomeReferenceInfo, setTreenomeReferenceInfo]);
  const ntToX = useCallback(
    (nt) => {
      return (
        treenomeState.xBounds[0] +
        ((nt - treenomeState.ntBounds[0]) /
          (treenomeState.ntBounds[1] - treenomeState.ntBounds[0])) *
          (treenomeState.xBounds[1] - treenomeState.xBounds[0]) -
        3
      );
    },
    [treenomeState.xBounds, treenomeState.ntBounds],
  );

  const getNtPos = useCallback(
    (mut) => {
      if (mut.gene === "nt") {
        return mut.residue_pos - 1;
      }
      if (mut.nuc_for_codon !== undefined) {
        return mut.nuc_for_codon - 1;
      }
      if (cov2Genes !== null) {
        return cov2Genes[mut.gene][0] + (mut.residue_pos - 1) * 3 - 1;
      }
    },
    [cov2Genes],
  );

  const main_variation_aa_common_props = {
    onHover: (info) => setHoverInfo(info),
    pickable: true,
    getColor: (d) => {
      if (cov2Genes !== null) {
        return d.m.new_residue !==
          treenomeReferenceInfo["aa"][d.m.gene + ":" + d.m.residue_pos]
          ? colorHook.toRGB(d.m.new_residue)
          : cov2Genes[d.m.gene][2].map((c) => 245 - 0.2 * (245 - c));
      } else {
        return d.m.new_residue !==
          treenomeReferenceInfo["aa"][d.m.gene + ":" + d.m.residue_pos]
          ? colorHook.toRGB(d.m.new_residue)
          : [245, 245, 245];
      }
    },
    modelMatrix: modelMatrixFixedX,
    getSourcePosition: (d) => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }
      let mut = d.m;
      let ntPos = getNtPos(mut);
      if (
        ntPos < treenomeState.ntBounds[0] ||
        ntPos > treenomeState.ntBounds[1]
      ) {
        return [[0, 0]];
      }
      let x = ntToX(ntPos);
      return [x + aaWidth / 2, d.y[0] - variation_padding];
    },
    getTargetPosition: (d) => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }
      let mut = d.m;
      let ntPos = getNtPos(mut);
      if (
        ntPos < treenomeState.ntBounds[0] ||
        ntPos > treenomeState.ntBounds[1]
      ) {
        return [[0, 0]];
      }
      let x = ntToX(ntPos);
      return [x + aaWidth / 2, d.y[1] + variation_padding];
    },
    getWidth: (d) => {
      return aaWidth;
    },
    updateTriggers: {
      getTargetPosition: [
        treenomeState.ntBounds,
        getNtPos,
        ntToX,
        variation_padding,
        aaWidth,
      ],
      getSourcePosition: [
        treenomeState.ntBounds,
        getNtPos,
        ntToX,
        variation_padding,
        aaWidth,
      ],
      getWidth: [aaWidth],
      getColor: [treenomeReferenceInfo, colorHook, cov2Genes],
    },
    getPolygonOffset: myGetPolygonOffset,
  };
  const main_variation_layer_aa = {
    layerType: "LineLayer",
    ...main_variation_aa_common_props,
    data: layerDataAa,
    id: "browser-loaded-main-aa",
  };
  const fillin_variation_layer_aa = {
    layerType: "LineLayer",
    ...main_variation_aa_common_props,
    data: cachedVarDataAa,
    id: "browser-fillin-aa",
  };

  const main_variation_nt_common_props = {
    onHover: (info) => setHoverInfo(info),
    pickable: true,
    getColor: (d) => {
      let color = [0, 0, 0];
      switch (d.m.new_residue) {
        case "A":
          color = [0, 0, 0];
          break;
        case "C":
          color = [60, 60, 60];
          break;
        case "G":
          color = [120, 120, 120];
          break;
        case "T":
          color = [180, 180, 180];
          break;
        default:
          color = [0, 0, 0];
          break;
      }
      if (cov2Genes !== null) {
        if (d.m.new_residue === treenomeReferenceInfo["nt"][d.m.residue_pos]) {
          const gene = ntToCov2Gene(d.m.residue_pos);
          if (gene !== null) {
            return cov2Genes[gene][2].map((c) => 245 - 0.2 * (245 - c));
          }
        }
      }
      return color;
    },
    modelMatrix: modelMatrixFixedX,
    getSourcePosition: (d) => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }
      let mut = d.m;
      let ntPos = getNtPos(mut);
      if (
        ntPos < treenomeState.ntBounds[0] ||
        ntPos > treenomeState.ntBounds[1]
      ) {
        return [[0, 0]];
      }
      let x = ntToX(ntPos);
      return [x + ntWidth / 2, d.y[0] - variation_padding];
    },
    getTargetPosition: (d) => {
      if (!treenomeState.ntBounds) {
        return [[0, 0]];
      }
      let mut = d.m;
      let ntPos = getNtPos(mut);
      if (
        ntPos < treenomeState.ntBounds[0] ||
        ntPos > treenomeState.ntBounds[1]
      ) {
        return [[0, 0]];
      }
      let x = ntToX(ntPos);
      return [x + ntWidth / 2, d.y[1] + variation_padding];
    },
    getWidth: (d) => {
      return ntWidth;
    },
    updateTriggers: {
      getTargetPosition: [
        treenomeState.ntBounds,
        getNtPos,
        ntToX,
        variation_padding,
        ntWidth,
      ],
      getSourcePosition: [
        treenomeState.ntBounds,
        getNtPos,
        ntToX,
        variation_padding,
        ntWidth,
      ],
      getWidth: [ntWidth],
      getColor: [treenomeReferenceInfo, colorHook, cov2Genes],
    },
    getPolygonOffset: myGetPolygonOffset,
  };

  const main_variation_layer_nt = {
    layerType: "LineLayer",
    ...main_variation_nt_common_props,
    data: layerDataNt,
    id: "browser-loaded-main-nt",
  };

  const fillin_variation_layer_nt = {
    layerType: "LineLayer",
    ...main_variation_nt_common_props,
    data: cachedVarDataNt,
    id: "browser-fillin-nt",
  };

  const dynamic_background_data = useMemo(() => {
    if (!settings.treenomeEnabled || cov2Genes === null) {
      return [];
    }
    let d = [];
    for (let key of Object.keys(cov2Genes)) {
      if (key === "ORF1ab") {
        continue;
      }
      const gene = cov2Genes[key];
      const yh = treenomeState.yBounds[1];
      d.push({
        x: [
          [ntToX(gene[0] - 1), -3000],
          [ntToX(gene[0] - 1), yh * 4],
          [ntToX(gene[1] - 1), yh * 4],
          [ntToX(gene[1] - 1), -3000],
        ],
        c: gene[2],
      });
    }
    return d;
  }, [cov2Genes, ntToX, treenomeState.yBounds, settings.treenomeEnabled]);

  const selected_node_data = useMemo(() => {
    if (!selectedDetails.nodeDetails || variation_padding === 0) {
      return [];
    }
    if (data.data && data.data.nodes && data.data.nodes.length > 500) {
      return [];
    }
    const y = selectedDetails.nodeDetails.y;

    return [
      {
        p: [
          [ntToX(0), y - variation_padding],
          [ntToX(0), y + variation_padding],
          [ntToX(treenomeState.genomeSize), y + variation_padding],
          [ntToX(treenomeState.genomeSize), y - variation_padding],
        ],
      },
    ];
  }, [
    selectedDetails,
    ntToX,
    variation_padding,
    data.data,
    treenomeState.genomeSize,
  ]);

  const background_layer_data = useMemo(() => {
    const yh = treenomeState.yBounds[1];
    return [
      [
        [treenomeState.xBounds[0], -3000],
        [treenomeState.xBounds[0], yh * 4],
        [treenomeState.xBounds[1], yh * 4],
        [treenomeState.xBounds[1], -3000],
      ],
    ];
  }, [treenomeState.xBounds, treenomeState.yBounds]);

  const dynamic_browser_background_data = useMemo(() => {
    const yh = treenomeState.yBounds[1];
    return [
      {
        x: [
          [ntToX(0), -3000],
          [ntToX(0), yh * 4],
          [ntToX(treenomeState.genomeSize), yh * 4],
          [ntToX(treenomeState.genomeSize), -3000],
        ],
        c: [245, 245, 245],
      },
    ];
  }, [treenomeState.yBounds, treenomeState.genomeSize, ntToX]);

  if (!settings.treenomeEnabled) {
    return [];
  }

  const browser_background_layer = {
    layerType: "PolygonLayer",
    id: "browser-loaded-background",

    data: background_layer_data,

    // data: [ [[-1000, -1000], [-1000, 1000], [1000, 1000], [1000, -1000]] ] ,
    getPolygon: (d) => d,
    modelMatrix: modelMatrixFixedX,
    lineWidthUnits: "pixels",
    getLineWidth: 0,
    filled: true,
    pickable: false,
    getFillColor: [224, 224, 224],
    getPolygonOffset: myGetPolygonOffset,
  };

  const dynamic_browser_background_sublayer = {
    layerType: "SolidPolygonLayer",
    id: "browser-loaded-dynamic-background-sublayer",
    data: dynamic_browser_background_data,
    getPolygon: (d) => d.x,
    getFillColor: (d) => d.c,
    getPolygonOffset: myGetPolygonOffset,
    modelMatrix: modelMatrixFixedX,
  };

  const dynamic_browser_background_layer = {
    layerType: "SolidPolygonLayer",
    id: "browser-loaded-dynamic-background",
    data: dynamic_background_data,
    modelMatrix: modelMatrixFixedX,
    getPolygon: (d) => d.x,
    getFillColor: (d) => [...d.c, 0.2 * 255],
    getPolygonOffset: myGetPolygonOffset,
  };
  const browser_outline_layer = {
    layerType: "PolygonLayer",
    id: "browser-loaded-outline",
    data: [
      {
        x: [
          [ntToX(0), treenomeState.baseYBounds[0]],
          [ntToX(0), treenomeState.baseYBounds[1]],
          [ntToX(treenomeState.genomeSize), treenomeState.baseYBounds[1]],
          [ntToX(treenomeState.genomeSize), treenomeState.baseYBounds[0]],
        ],
      },
    ],
    getPolygon: (d) => d.x,
    modelMatrix: modelMatrixFixedX,
    lineWidthUnits: "pixels",
    getLineWidth: 1,
    getLineColor: [100, 100, 100],
    opacity: 0.1,
    filled: false,
    pickable: false,
    getPolygonOffset: myGetPolygonOffset,
  };

  const selected_node_layer = {
    layerType: "PolygonLayer",
    id: "browser-loaded-selected-node",
    data: selected_node_data,
    getPolygon: (d) => d.p,
    modelMatrix: modelMatrixFixedX,
    lineWidthUnits: "pixels",
    getLineWidth: 0.4,
    opacity: 0.1,
    filled: true,
    getFillColor: [240, 240, 240],
    pickable: false,
    getPolygonOffset: myGetPolygonOffset,
  };
  layers.push(browser_background_layer);
  layers.push(dynamic_browser_background_sublayer);
  layers.push(dynamic_browser_background_layer);
  layers.push(browser_outline_layer);
  if (settings.mutationTypesEnabled.aa) {
    layers.push(fillin_variation_layer_aa);
    layers.push(main_variation_layer_aa);
  }
  if (settings.mutationTypesEnabled.nt) {
    layers.push(fillin_variation_layer_nt);
    layers.push(main_variation_layer_nt);
  }
  layers.push(selected_node_layer);

  return layers;
};

export default useTreenomeLayers;
