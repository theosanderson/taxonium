import { useCallback, useMemo } from "react";
import filtering from "taxonium_data_handling"
var protobuf = require("protobufjs");




function useLocalBackend(uploaded_data, proto){

   

    
    console.log("local backend:", uploaded_data)

    const processedUploadedData = useMemo(() => {

        if(!uploaded_data){
            return {}
        }
        

        
        console.log("Processing uploaded data")
        const NodeList = proto.lookupType("AllData");
        const message = NodeList.decode(new Uint8Array(uploaded_data.data ));
        const result = NodeList.toObject(message);
        window.result = result;
        console.log(result)


        
        const node_data_in_columnar_form = result.node_data;

        const country_stuff = node_data_in_columnar_form.metadata_singles.find(x=>x.metadata_name==="Country")
        const lineage_stuff = node_data_in_columnar_form.metadata_singles.find(x=>x.metadata_name==="Lineage")
        const nodes_initial = []
        result.mutation_mapping = result.mutation_mapping.map(x=>{
            if (x===''){
                return null
            }
            const [gene,rest] = x.split(":")
            const [previous_residue, residue_pos, new_residue] = rest.split("_")
            return {
                gene,
                previous_residue,
                residue_pos: parseInt(residue_pos),
                new_residue

            }})


        

        
        for (let i in node_data_in_columnar_form.names){
            const new_node = {name: node_data_in_columnar_form.names[i],
            x: node_data_in_columnar_form.x[i],
            y: node_data_in_columnar_form.y[i],
            num_tips: node_data_in_columnar_form.num_tips[i],
            parent_id: node_data_in_columnar_form.parents[i],
            date: result.date_mapping[node_data_in_columnar_form.dates[i]],
            meta_Country: country_stuff.mapping[country_stuff.node_values[i]],
            meta_Lineage: lineage_stuff.mapping[lineage_stuff.node_values[i]],
            mutations: node_data_in_columnar_form.mutations[i].mutation ? node_data_in_columnar_form.mutations[i].mutation.map(x=> result.mutation_mapping[x]): []

          
        }
        nodes_initial.push(new_node)
        }
        //sort on y
        const node_indices = nodes_initial.map((x,i)=>i)
        const sorted_node_indices = node_indices.sort((a,b)=>nodes_initial[a].y-nodes_initial[b].y)
        const nodes = sorted_node_indices.map(x=>nodes_initial[x])
        const old_to_new_mapping = Object.fromEntries(sorted_node_indices.map((x,i)=>[x,i]))
        
        const scale_x = 35;
const scale_y = 9e7/nodes.length;

        nodes.forEach((node,i)=>{
            node.parent_id = old_to_new_mapping[node.parent_id]
            node.node_id = i

            node.x = node.x * scale_x;
            node.y = node.y * scale_y;

        })

        nodes.forEach((node,i)=>{
            node.parent_x = nodes[node.parent_id].x;
            node.parent_y = nodes[node.parent_id].y;
        })






        
        console.log("NODES is ", nodes)
    
        const y_positions = nodes.map((node) => node.y);

        const overallMaxY =  nodes.reduce((max, node) => {
            if (node.y > max) {
                return node.y;
            } else {
                return max;
            }
        }, nodes[0].y);

        const overallMinY
        = nodes.reduce((min, node) => {
            if (node.y < min) {
                return node.y;
            } else {
                return min;
            }
        }, nodes[0].y);

        const overallMaxX
        = nodes.reduce((max, node) => {
            if (node.x > max) {
                return node.x;
            } else {
                return max;
            }
        }, nodes[0].x);

        const overallMinX
        = nodes.reduce((min, node) => {
            if (node.x < min) {
                return node.x;
            } else {
                return min;
            }
        }, nodes[0].x);

        const output =  {nodes:nodes, overallMaxX, overallMaxY, overallMinX, overallMinY, y_positions}
        
        console.log("output is ", output)
        return output

        }
        

    
    , [proto, uploaded_data]);

    

    console.log("processedUploadedData", processedUploadedData)
    const {nodes, overallMaxX, overallMaxY, overallMinX, overallMinY, y_positions} = processedUploadedData;

    const queryNodes = useCallback(
        (boundsForQueries, setResult, setTriggerRefresh) => {
      
  const min_x = boundsForQueries.min_x;
  const max_x = boundsForQueries.max_x;
  let min_y = boundsForQueries.min_y !== undefined ? boundsForQueries.min_y : overallMinY;
  let max_y = boundsForQueries.max_y !== undefined ? boundsForQueries.max_y : overallMaxY;
  if (min_y < overallMinY) {
    min_y = overallMinY;
  }
  if (max_y > overallMaxY) {
    max_y = overallMaxY;
  }
  let result;
  console.log("filtering from",nodes)

  if (false && min_y === overallMinY && max_y === overallMaxY) {
    //disabled
    //result = cached_starting_values;

    console.log("Using cached values");
  } else {
    result = {nodes:filtering.getNodes(nodes, y_positions, min_y, max_y, min_x, max_x)};

  }
  console.log("result is ", result)
  setResult(result);
    //setTriggerRefresh({});
         
        },
        [nodes, overallMaxY, overallMinY, y_positions]
      );
    
      const singleSearch = useCallback(
        (singleSearch, boundsForQueries, setResult) => {
         
        },
        [processedUploadedData]
      );
    
      const getDetails = useCallback(
        (node_id, setResult) => {
          
        },
        [processedUploadedData]
      );
    
      const getConfig = useCallback(
        (setResult) => {

            const result = {"source":"INSDC","title":"Phylo","name_accessor":"name","keys_to_display":["genotype","meta_Lineage","meta_Country"],"overlay":"TODO","num_nodes":4766574,"initial_x":2000,"initial_y":563.171305,"initial_zoom":-3,"genes":["ORF7a","ORF1a","N","ORF8","ORF1b","S","M","ORF7b","ORF3a","ORF10","E","ORF6"]}
            setResult(result);
          
        },
        [processedUploadedData]
      );


    return useMemo(() => {
        return { queryNodes, singleSearch, getDetails, getConfig };
      }, [queryNodes, singleSearch, getDetails, getConfig]);
}

export default useLocalBackend