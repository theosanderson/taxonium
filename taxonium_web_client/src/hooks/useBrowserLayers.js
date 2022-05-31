import { useMemo, useCallback, useState, useEffect } from "react";
import { LineLayer, PolygonLayer, SolidPolygonLayer } from "@deck.gl/layers";

const useBrowserLayers = (
    browserState,
    data,
    viewState,
    colorHook,
    setHoverInfo,
    reference,
    setReference,
    modelMatrix
) => {
    
    // TODO this is hack
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
        return numNt > 150
            ? 2
            : (browserWidth / numNt) * 3;
    }, [browserState.ntBounds, browserState.xBounds]);
    const genes = useMemo(() => {
        return { // [start, end, [color]]
        'ORF1a': [266, 13469, [142, 188, 102]],
        'ORF1b': [13468, 21556, [229, 150, 5]],
        'ORF1ab': [266, 21556, [255, 255, 255]],
        'S': [21563, 25385, [80, 151, 186]],
        'ORF3a': [25393, 26221, [170, 189, 82]],
        'E': [26245, 26473, [217, 173, 61]],
        'M': [26523, 27192, [80, 151, 186]],
        'ORF6': [27202, 27388, [223, 67, 39]],
        'ORF7a': [27394, 27760, [196, 185, 69]],
        'ORF7b': [27756, 27888, [117, 182, 129]],
        'ORF8': [27894, 28260, [96, 170, 1158]],
        'N': [28274, 29534, [230, 112, 48]],
        'ORF10': [29558, 29675, [90, 200, 216]]
        }
    }, []);

    let layers = [];

    const post_order = useCallback((nodes) => {
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
        console.log("root", root_id)
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
    }, []);

    // Might be a better way to do this. This let us use the zoomed out base_data unless we are
    // sufficiently zoomed in rather than zoomed in at all
    const [cachedVarData, setCachedVarData] = useState(null);

    const variation_data = useMemo(() => {
        // Assumes that nodes in data are in preorder.
        // We visit them in reverse order to traverse bottom up
        console.log("start var")
        let var_data = [];
        let nodes = null;
        let lookup = null;
        if (data.data && data.data.nodes && data.data.nodes.length < 90000) {
            nodes = data.data.nodes;
            lookup = data.data.nodeLookup;

        } else {
            if (cachedVarData) {
                console.log("cached----")
                return cachedVarData;
            }
            if (!data.base_data || !data.base_data.nodes) {
                return var_data;
            }
            nodes = data.base_data.nodes;
            lookup = data.base_data.nodeLookup;
        }

        if (!nodes) {
            return var_data;
        }
        if (!data.data.nodeLookup) {
            return var_data;
        }
        const postorder_nodes = post_order(nodes);
        console.log("po", postorder_nodes)
        const root = postorder_nodes.find((id) =>  id == lookup[id].parent_id);
        let yspan = {};
        for (let i = postorder_nodes.length - 1; i >= 0; i--) {
            let node = lookup[postorder_nodes[i]];
            let parent = node.parent_id;
            if (!yspan[node.node_id]) { // Leaf 
                yspan[node.node_id] = [node.y, node.y];
            }
            //console.log("node", node, parent, node.name)
            let cur_yspan = yspan[node.node_id];
            let par_yspan = yspan[parent];
            //console.log("cur, par", cur_yspan, par_yspan);
            if (par_yspan) {
                if (cur_yspan[0] < par_yspan[0]) {
                    yspan[parent][0] = cur_yspan[0];
                }
                if (cur_yspan[1] > par_yspan[1]) {
                    yspan[parent][1] = cur_yspan[1];
                }
            } else {
              //  console.log(cur_yspan)
                yspan[parent] = [...cur_yspan];
            }
            const ref = {}
            for (let mut of node.mutations) {
                if (mut.gene == 'nt') {
                    continue; // Skip nt mutations for now
                }
                if (node.node_id == root) {
                    ref[mut.gene + ':' + mut.residue_pos] = mut.new_residue;
                    continue;
                }
                var_data.unshift({
                    y: yspan[node.node_id],
                    m: mut
                });
            }
            if (node.node_id == root) {
                setReference(ref);
            }
        }
        if (data.data && data.data.nodes.length >= 90000) {
            console.log("caching...")
            setCachedVarData(var_data);
        }
        console.log("stop var")
        return var_data;
    }, [data.data, data.base_data, setReference, cachedVarData, post_order]);


    const variation_data_filtered = useMemo(() => {
        if (!data.data || !data.data.nodes) {
            return [];
        }
        if (data.data.nodes.length < 10000 || browserState.ntBounds[1] - browserState.ntBounds[0] < 1000) {
            return variation_data;
        } else {
            return variation_data.filter((d) => (d.y[1] - d.y[0]) > .002)
        }
    }, [variation_data, data.data, browserState.ntBounds]);

    const ntToX = useCallback((nt) => {
        return browserState.xBounds[0] + (nt - browserState.ntBounds[0])
            / (browserState.ntBounds[1] - browserState.ntBounds[0])
            * (browserState.xBounds[1] - browserState.xBounds[0]) - 3.2;
    }, [browserState]);

    const getNtPos = useCallback((mut) => {
        if (!genes[mut.gene]) {
            console.log("undef gene", mut.gene)
        }
        return genes[mut.gene][0] + (mut.residue_pos - 1) * 3 - 1;
    }, [genes]);

    const variation_layer = new SolidPolygonLayer({
        data: variation_data_filtered,
        id: "browser-variation-layer",
        onHover: (info) => setHoverInfo(info),
        pickable: true,
        getFillColor: (d) => d.m.new_residue != reference[d.m.gene + ':' + d.m.residue_pos] 
            ? colorHook.toRGB(d.m.new_residue)
            : [255, 255, 255],
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
        }
    });

    const browser_boundary_lines_layer = new LineLayer({
            id: "browser-boundary-lines",
            data: [
                {
                    a: [browserState.xBounds[0], browserState.yBounds[0]],
                    b: [browserState.xBounds[0], browserState.yBounds[1]]
                }, {
                    a: [browserState.xBounds[1], browserState.yBounds[0]],
                    b: [browserState.xBounds[1], browserState.yBounds[1]],
                },
            ],
            getSourcePosition: (d) => d.a,
            getTargetPosition: (d) => d.b,
            lineWidthUnits: "pixels",
            getColor: [0, 0, 0],
            getWidth: 2,
            pickable: false,
            modelMatrix: modelMatrixFixedX,
        });
        const browser_background_layer = new PolygonLayer({
            id: "browser-background",
            data: [[[browserState.xBounds[0], browserState.yBounds[0]],
            [browserState.xBounds[1], browserState.yBounds[0]],
            [browserState.xBounds[1], browserState.yBounds[1]],
            [browserState.xBounds[0], browserState.yBounds[1]]]]
            ,
            // data: [ [[-1000, -1000], [-1000, 1000], [1000, 1000], [1000, -1000]] ] ,
            getPolygon: (d) => d,
            updateTriggers: {
                getPolygon: browserState
            },
            modelMatrix: modelMatrixFixedX,
            lineWidthUnits: "pixels",
            getLineWidth: 2,
            filled: true,
            pickable: false,
            //extruded: true,
            //wireframe: true,
            getLineColor: [50, 50, 50],
            getFillColor: [235, 235, 235],
        });


        const dynamic_browser_background_layer = new SolidPolygonLayer({
            id: "browser-dynamic-background",
            data: [[
                [ntToX(0), browserState.yBounds[0]],
                [ntToX(0), browserState.yBounds[1]],
                [ntToX(29903), browserState.yBounds[1]],
                [ntToX(29903), browserState.yBounds[0]]
            ]],
            modelMatrix: modelMatrixFixedX,
            getPolygon: (d) => d,
//            filled: true,
//            stroked: true,
            lineWidthUnits: "pixels",
            getLineWidth: 2,
            getFillColor: [255, 255, 255],
        });

        layers.push(browser_background_layer);
        layers.push(dynamic_browser_background_layer);
        layers.push(browser_boundary_lines_layer);
        layers.push(variation_layer);


        return layers;

    };

    export default useBrowserLayers;