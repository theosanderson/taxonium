import { useMemo, useCallback, useState, useEffect } from "react";
import { LineLayer, PolygonLayer, SolidPolygonLayer } from "@deck.gl/layers";
import useBrowserLayerData from "./useBrowserLayerData";

const useBrowserLayers = (
    browserState,
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
    }, [data.data, browserState.ntBounds]);
    const aaWidth = useMemo(() => {
        const browserWidth = browserState.xBounds[1] - browserState.xBounds[0];
        const numNt = browserState.ntBounds[1] - browserState.ntBounds[0];
        return numNt > 600
            ? 2
            : (browserWidth / numNt) * 3;
    }, [browserState.ntBounds, browserState.xBounds]);
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

    const post_order = useCallback((nodes) => {
        if (!settings.browserEnabled) {
            return;
        }
        let to_children = {};
        let root_id = null;
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].parent_id == nodes[i].node_id) {
                root_id = nodes[i].node_id;
                continue;
            }
            if (to_children[nodes[i].parent_id] !== undefined) {
                to_children[nodes[i].parent_id].push(nodes[i].node_id);
            } else {
                to_children[nodes[i].parent_id] = [nodes[i].node_id];
            }
        }
        let stack = [];
        let po = [];
        stack.push(root_id);
        while (stack.length > 0) {
            const node_id = stack.pop();
            if (to_children[node_id]) {
                for (let child_id of to_children[node_id]) {
                    stack.push(child_id);
                }
            }
            po.push(node_id);
        }
        console.log("done postorder", po)
        return po;
    }, [settings.browserEnabled]);
/*



*/
    const [layerData, computedReference] = useBrowserLayerData(data, browserState, settings);

    useEffect(() => {
        if(!reference) {
            setReference(computedReference)
        }
    }, [computedReference])
    
    const ntToX = useCallback((nt) => {
        return browserState.xBounds[0] + (nt - browserState.ntBounds[0])
            / (browserState.ntBounds[1] - browserState.ntBounds[0])
            * (browserState.xBounds[1] - browserState.xBounds[0]) - 3;
    }, [browserState.xBounds, browserState.ntBounds, browserState.yBounds]);

    const getNtPos = useCallback((mut) => {
        if (!genes[mut.gene]) {
            console.log("undef gene", mut.gene)
        }
        return genes[mut.gene][0] + (mut.residue_pos - 1) * 3 - 1;
    }, [genes]);

    //console.log("layerdata", layerData, reference);
    const main_variation_layer = new SolidPolygonLayer({
        data: layerData,
        id: "browser-main",
        onHover: (info) => setHoverInfo(info),
        pickable: true,
        getFillColor: (d) => d.m.new_residue != reference[d.m.gene + ':' + d.m.residue_pos] 
        ? colorHook.toRGB(d.m.new_residue)
        : genes[d.m.gene][2].map((c) => 245 - (0.2*(245-c))),
        getLineColor: (d) => [80, 80, 80],
        lineWidthUnits: "pixels",
        modelMatrix: modelMatrixFixedX,
        getPolygon: (d) => {
            if (!browserState.ntBounds) {
                return [[0, 0]];
            }
            let mut = d.m;
            let ntPos = getNtPos(mut);
            if (ntPos < browserState.ntBounds[0] || ntPos > browserState.ntBounds[1]) {
                return [[0 , 0]];
            }

            let x = ntToX(ntPos);

            return [ [x, d.y[0] - variation_padding], [x, d.y[1] + variation_padding],
                [x + aaWidth, d.y[1] + variation_padding], [x + aaWidth, d.y[0] - variation_padding] ];
        },
        updateTriggers: {
            getPolygon: [browserState.ntBounds, getNtPos, ntToX, aaWidth, variation_padding],
        },
        getPolygonOffset: myGetPolygonOffset
    });
 
    const dynamic_background_data = useMemo(() => {
        if (!settings.browserEnabled) {
            return;
        }
        let d = [];
        for (let key of Object.keys(genes)) {
            if (key == 'ORF1ab') {
                continue;
            }
            const gene = genes[key];
            d.push(
                {
                    x: [
                        [ntToX(gene[0]), viewState.zoom < 7 ? -1e6 : -1e3],
                        [ntToX(gene[0]), viewState.zoom < 7 ? 1e6 : 1e3],
                        [ntToX(gene[1]), viewState.zoom < 7 ? 1e6 : 1e3],
                        [ntToX(gene[1]), viewState.zoom < 7 ? -1e6 : -1e3],
                    ],
                    c: gene[2]
                }
            );
        }
        return d;
    }, [genes, ntToX, browserState.xBounds, viewState.zoom, settings.browserEnabled]);

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
                    [ntToX(29903), y + variation_padding],
                    [ntToX(29903), y - variation_padding]
                ],   
            }
        ]
    }, [selectedDetails, ntToX, variation_padding, data.data])

    if (!settings.browserEnabled) {
        return [];
    }



     const browser_background_layer = new PolygonLayer({
            id: "browser-background",
            
            data: [[[browserState.xBounds[0], viewState.zoom < 7 ? -1e6 : -1e3],
            [browserState.xBounds[0], viewState.zoom < 7 ? 1e6 : 1e3],
            [browserState.xBounds[1], viewState.zoom < 7 ? 1e6 : 1e3],
            [browserState.xBounds[1], viewState.zoom < 7 ? -1e6 : -1e3]]]
            ,
            // data: [ [[-1000, -1000], [-1000, 1000], [1000, 1000], [1000, -1000]] ] ,
            getPolygon: (d) => d,
            modelMatrix: modelMatrixFixedX,
            lineWidthUnits: "pixels",
            getLineWidth: 0,
            filled: true,
            pickable: false,
            //extruded: true,
            //wireframe: true,
            getFillColor: [224, 224, 224],
            getPolygonOffset: myGetPolygonOffset
    });


        const dynamic_browser_background_sublayer  = new SolidPolygonLayer({
            id: "browser-dynamic-background-sublayer",
            data: [{
                
                        x: [ [ntToX(0), viewState.zoom < 7 ? -1e6 : -1e3],
                        [ntToX(0),  viewState.zoom < 7 ? 1e6 : 1e3],
                        [ntToX(29903),  viewState.zoom < 7 ? 1e6 : 1e3],
                        [ntToX(29903), viewState.zoom < 7 ? -1e6 : -1e3]
                    ],   
                        c: [245,245,245]
                    }
            ],
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
                    x: [ [ntToX(0), browserState.yBounds[0]],
                        [ntToX(0), browserState.yBounds[1]],
                        [ntToX(29903), browserState.yBounds[1]],
                        [ntToX(29903), browserState.yBounds[0]]
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
            getFillColor: [220,220,220],
            pickable: false,
            getPolygonOffset: myGetPolygonOffset

        })
        layers.push(browser_background_layer);
        layers.push(dynamic_browser_background_sublayer);
        layers.push(dynamic_browser_background_layer);
        layers.push(browser_outline_layer);
        layers.push(main_variation_layer);
        layers.push(selected_node_layer)


        return layers;

    };

    export default useBrowserLayers;