import {
    kn_expand_node,
    kn_reorder,
    kn_parse,
    kn_calxy,
  } from "./jstree";

import reduceMaxOrMin from "./reduceMaxOrMin";

async function do_fetch(url) {
    const response = await fetch(url);
    //get text:
    const text = await response.text();
    //parse text:
    return text;
}

async function cleanup(tree){
    tree.node.forEach( (node, i) => {
        node.node_id = i;
    });

    tree.node.forEach( (node) => {
        node.parent_id = node.parent.node_id
        node.parent = undefined;
        node.x_dist = node.x
        node.x = undefined
        node.mutations = []
        node.num_tips = node.child.length +1 // This isn't accurate but ensures leaves have 1 tip and others have more
    }
    )


}




export async function processNewick(data) {
    let the_data
    if(data.status==="url_supplied"){
        console.log("url_supplied")
        the_data = await do_fetch(data.filename)
        
        
        

    }

    console.log("got nwk data", the_data)
    const tree = kn_parse(the_data);
    kn_calxy(tree);
    console.log("tree is ", tree)
    cleanup(tree)

    const overallMaxX = reduceMaxOrMin(tree.node, (x) => x.x_dist, "max");
    const overallMinX = reduceMaxOrMin(tree.node, (x) => x.x_dist, "min");
    const overallMaxY = reduceMaxOrMin(tree.node, (x) => x.y, "max");
    const overallMinY = reduceMaxOrMin(tree.node, (x) => x.y, "min");
    const y_positions = tree.node.map((x) => x.y);


    const output = {
        nodes: tree.node,
        overallMaxX,
        overallMaxY,
        overallMinX,
        overallMinY,
        y_positions,
        mutations: [],
        node_to_mut: {},
        rootMutations: [],
        rootId: 0,
        overwrite_config:  {},
      };

    return output;
    

}