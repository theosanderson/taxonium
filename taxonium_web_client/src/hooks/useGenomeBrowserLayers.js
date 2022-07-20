import { useMemo, useCallback, useState, useEffect } from "react";
import { LineLayer, PolygonLayer, SolidPolygonLayer } from "@deck.gl/layers";
import useGenomeBrowserLayerData from "./useGenomeBrowserLayerData";

const useGenomeBrowserLayers = (
    genomeBrowserState,
    data,
    viewState,
    colorHook,
    setHoverInfo,
    settings,
    reference,
    setReference,
    selectedDetails
) => {
    
    const myGetPolygonOffset = ({layerIndex}) => [0, -(layerIndex+999) * 100];
    const modelMatrixFixedX = useMemo(() => {
        return [
          1 / 2 ** (viewState.zoom),
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
    }, [data.data, genomeBrowserState.ntBounds]);
    const aaWidth = useMemo(() => {
        const browserWidth = genomeBrowserState.xBounds[1] - genomeBrowserState.xBounds[0];
        const numNt = genomeBrowserState.ntBounds[1] - genomeBrowserState.ntBounds[0];
        return numNt > 600
            ? 2
            : (browserWidth / numNt) * 3;
    }, [genomeBrowserState.ntBounds, genomeBrowserState.xBounds]);
    const ntWidth = useMemo(() => {
        return aaWidth / 3;
    }, [aaWidth])
    const genes = useMemo(() => {
        return { // [start, end, [color]]
        'ORF1a': [266, 13469, [142, 188, 102]],
        'ORF1b': [13468, 21556, [229, 150, 5]],
        'ORF1ab': [266, 21556, [142, 188, 102]],
        'S': [21563, 25385, [80, 151, 186]],
        'ORF3a': [25393, 26221, [170, 189, 82]],
        'E': [26245, 26473, [217, 173, 61]],
        'M': [26523, 27192, [80, 151, 186]],
        'ORF6': [27202, 27388, [223, 67, 39]],
        'ORF7a': [27394, 27760, [196, 185, 69]],
        'ORF7b': [27756, 27888, [117, 182, 129]],
        'ORF8': [27894, 28260, [96, 170, 1158]],
        'N': [28274, 29534, [230, 112, 48]],
        'ORF10': [29558, 29675, [90, 200, 216]],
        }
    }, []);

    let layers = [];


    const [layerDataAa, layerDataNt, computedReference] = useGenomeBrowserLayerData(data, genomeBrowserState, settings);
    useEffect(() => {
        if(!reference) {
            setReference(computedReference)
        }
    }, [computedReference, reference, setReference])
    const ntToX = useCallback((nt) => {
        return genomeBrowserState.xBounds[0] + (nt - genomeBrowserState.ntBounds[0])
            / (genomeBrowserState.ntBounds[1] - genomeBrowserState.ntBounds[0])
            * (genomeBrowserState.xBounds[1] - genomeBrowserState.xBounds[0]) - 3;
    }, [genomeBrowserState.xBounds, genomeBrowserState.ntBounds, genomeBrowserState.yBounds]);

    const getNtPos = useCallback((mut) => {
        if (mut.gene == 'nt') {
            return mut.residue_pos - 1;
        }
        return genes[mut.gene][0] + (mut.residue_pos - 1) * 3 - 1;
    }, [genes]);

    const main_variation_layer_aa = new SolidPolygonLayer({
        data: layerDataAa,
        id: "browser-main-aa",
        onHover: (info) => setHoverInfo(info),
        pickable: true,
        getFillColor: (d) => {
            return  d.m.new_residue != reference['aa'][d.m.gene + ':' + d.m.residue_pos] 
            ? colorHook.toRGB(d.m.new_residue)
            : genes[d.m.gene][2].map((c) => 245 - (0.2*(245-c)));
        },
           
        getLineColor: (d) => [80, 80, 80],
        lineWidthUnits: "pixels",
        modelMatrix: modelMatrixFixedX,
        getPolygon: (d) => {
            if (!genomeBrowserState.ntBounds) {
                return [[0, 0]];
            }
            let mut = d.m;
            let ntPos = getNtPos(mut);
            if (ntPos < genomeBrowserState.ntBounds[0] || ntPos > genomeBrowserState.ntBounds[1]) {
                return [[0 , 0]];
            }

            let x = ntToX(ntPos);
            if (mut.gene == 'nt') {
                return [ [x, d.y[0] - variation_padding], [x, d.y[1] + variation_padding],
                [x + ntWidth, d.y[1] + variation_padding], [x + ntWidth, d.y[0] - variation_padding] ];
            }
            return [ [x, d.y[0] - variation_padding], [x, d.y[1] + variation_padding],
            [x + aaWidth, d.y[1] + variation_padding], [x + aaWidth, d.y[0] - variation_padding] ];
        },
        updateTriggers: {
            getPolygon: [genomeBrowserState.ntBounds, getNtPos, ntToX, aaWidth, ntWidth, variation_padding],
            getFillColor: [reference, colorHook, genes]
        },
        getPolygonOffset: myGetPolygonOffset
    });

    const main_variation_layer_nt = new SolidPolygonLayer({
        data: layerDataNt,
        id: "browser-main-nt",
        onHover: (info) => setHoverInfo(info),
        pickable: true,
        getFillColor: (d) => {
            switch(d.m.new_residue) {
                case 'A':
                    return [0, 0, 0];
                case 'C':
                    return [60, 60, 60];
                case 'G':
                    return [120, 120, 120];
                case 'T':
                    return [180, 180, 180];
                default:
                    return [0, 0, 0]
            }
        },
           
        getLineColor: (d) => [80, 80, 80],
        lineWidthUnits: "pixels",
        modelMatrix: modelMatrixFixedX,
        getPolygon: (d) => {
            if (!genomeBrowserState.ntBounds) {
                return [[0, 0]];
            }
            let mut = d.m;
            let ntPos = getNtPos(mut);
            if (ntPos < genomeBrowserState.ntBounds[0] || ntPos > genomeBrowserState.ntBounds[1]) {
                return [[0 , 0]];
            }

            let x = ntToX(ntPos);
            if (mut.gene == 'nt') {
                return [ [x, d.y[0] - variation_padding], [x, d.y[1] + variation_padding],
                [x + ntWidth, d.y[1] + variation_padding], [x + ntWidth, d.y[0] - variation_padding] ];
            }
            return [ [x, d.y[0] - variation_padding], [x, d.y[1] + variation_padding],
            [x + aaWidth, d.y[1] + variation_padding], [x + aaWidth, d.y[0] - variation_padding] ];
        },
        updateTriggers: {
            getPolygon: [genomeBrowserState.ntBounds, getNtPos, ntToX, aaWidth, ntWidth, variation_padding],
            getFillColor: [reference, colorHook, genes]
        },
        getPolygonOffset: myGetPolygonOffset
    });
 
 
    const dynamic_background_data = useMemo(() => {
        if (!settings.genomeBrowserEnabled) {
            return;
        }
        let d = [];
        for (let key of Object.keys(genes)) {
            if (key == 'ORF1ab') {
                continue;
            }
            const gene = genes[key];
            const yl = genomeBrowserState.yBounds[0];
            const yh = genomeBrowserState.yBounds[1];
            d.push(
                {
                    x: [
                        [ntToX(gene[0]-1), -3000],
                        [ntToX(gene[0]-1), yh * 4],
                        [ntToX(gene[1]-1), yh * 4],
                        [ntToX(gene[1]-1), -3000],
                    ],
                    c: gene[2]
                },
            );
        }
        return d;
    }, [genes, ntToX, genomeBrowserState.xBounds, genomeBrowserState.yBounds, viewState.zoom, settings.genomeBrowserEnabled]);

    const selected_node_data = useMemo(() => {
        if (!selectedDetails.nodeDetails || variation_padding == 0 ) {
            return [];
        }
        if (data.data && data.data.nodes && data.data.nodes.length > 500) {
            return [];
        }
        const y = selectedDetails.nodeDetails.y;
   
        return [
            {
                p: [ [ntToX(0), y - variation_padding],
                    [ntToX(0), y + variation_padding],
                    [ntToX(genomeBrowserState.genomeSize), y + variation_padding],
                    [ntToX(genomeBrowserState.genomeSize), y - variation_padding]
                ],   
            }
        ]
    }, [selectedDetails, ntToX, variation_padding, data.data, genomeBrowserState.genomeSize])

    const background_layer_data = useMemo(() => {
        const yh = genomeBrowserState.yBounds[1];
        return [[
            [genomeBrowserState.xBounds[0], -3000],
            [genomeBrowserState.xBounds[0], yh * 4],
            [genomeBrowserState.xBounds[1], yh * 4],
            [genomeBrowserState.xBounds[1], -3000],
            
        ]]
    }, [genomeBrowserState.xBounds, genomeBrowserState.yBounds]);

    const dynamic_browser_background_data = useMemo(() => {
        const yh = genomeBrowserState.yBounds[1];
        return [{
            x: [ [ntToX(0), -3000],
                [ntToX(0), yh * 4],
                [ntToX(genomeBrowserState.genomeSize), yh * 4],
                [ntToX(genomeBrowserState.genomeSize), -3000]
            ],
            c: [245, 245, 245]
        }]
    }, [genomeBrowserState.yBounds, genomeBrowserState.genomeSize, ntToX])

    if (!settings.genomeBrowserEnabled) {
        return [];
    }
  
     const browser_background_layer = new PolygonLayer({
            id: "browser-background",
            
            data: background_layer_data,
            
            // data: [ [[-1000, -1000], [-1000, 1000], [1000, 1000], [1000, -1000]] ] ,
            getPolygon: (d) => d,
            modelMatrix: modelMatrixFixedX,
            lineWidthUnits: "pixels",
            getLineWidth: 0,
            filled: true,
            pickable: false,
            getFillColor: [224, 224, 224],
            getPolygonOffset: myGetPolygonOffset
    });


        const dynamic_browser_background_sublayer  = new SolidPolygonLayer({
            id: "browser-dynamic-background-sublayer",
            data: dynamic_browser_background_data,
            getPolygon: (d) => d.x,
            getFillColor: (d) => d.c,
            getPolygonOffset: myGetPolygonOffset,
            modelMatrix: modelMatrixFixedX,
        });

        const dynamic_browser_background_layer = new SolidPolygonLayer({
            id: "browser-dynamic-background",
            data: dynamic_background_data,
            modelMatrix: modelMatrixFixedX,
            getPolygon: (d) => d.x,
//            filled: true,
//            stroked: true,
            getFillColor: (d) => [...d.c, 0.2*255],
            getPolygonOffset: myGetPolygonOffset,
        });
        const browser_outline_layer = new PolygonLayer({
            id: "browser-outline",
            data: [
                {
                    x: [ [ntToX(0), genomeBrowserState.yBounds[0]],
                        [ntToX(0), genomeBrowserState.yBounds[1]],
                        [ntToX(genomeBrowserState.genomeSize), genomeBrowserState.yBounds[1]],
                        [ntToX(genomeBrowserState.genomeSize), genomeBrowserState.yBounds[0]]
                    ],   
                }
            ],
            getPolygon: (d) => d.x,
            modelMatrix: modelMatrixFixedX,
            lineWidthUnits: "pixels",
            getLineWidth: 1,
            getLineColor: [100, 100, 100],
            opacity: 0.1,
            filled: false,
            pickable: false,
            getPolygonOffset: myGetPolygonOffset
        });

        const selected_node_layer = new PolygonLayer({
            id: "browser-selected-node",
            data: selected_node_data,
            getPolygon: (d) => d.p,
            modelMatrix: modelMatrixFixedX,
            lineWidthUnits: "pixels",
            getLineWidth: .4,
            // getLineColor: [100, 100, 100],
            opacity: 0.1,
            filled: true,
            getFillColor: [240,240,240],
            pickable: false,
            getPolygonOffset: myGetPolygonOffset

        })
        layers.push(browser_background_layer);
        layers.push(dynamic_browser_background_sublayer);
        layers.push(dynamic_browser_background_layer);
        layers.push(browser_outline_layer);
        if (settings.mutationTypesEnabled.aa) {
            layers.push(main_variation_layer_aa);
        }
        if (settings.mutationTypesEnabled.nt) {
            layers.push(main_variation_layer_nt);
        }
        layers.push(selected_node_layer)


        return layers;

    };

    export default useGenomeBrowserLayers;