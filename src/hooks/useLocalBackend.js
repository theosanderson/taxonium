import { useCallback, useMemo } from "react";
var protobuf = require("protobufjs");



function useLocalBackend(uploaded_data){
    console.log("local backend:", uploaded_data)

    const processedUploadedData = useMemo(() => {
        

        protobuf.load("./taxonium.proto").then(function (proto) {
        

        console.log("Processing uploaded data")
        const NodeList = proto.lookupType("AllData");
        const message = NodeList.decode(new Uint8Array(uploaded_data.data));
        const result = NodeList.toObject(message);
        window.result = result;
        console.log(result)
        
        const node_data_in_columnar_form = result.node_data;

        const country_stuff = node_data_in_columnar_form.metadata_singles.find(x=>x.metadata_name==="Country")
        const lineage_stuff = node_data_in_columnar_form.metadata_singles.find(x=>x.metadata_name==="Lineage")
        const nodes = []
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
        nodes.push(new_node)
        }

        console.log("nodes", nodes)

        })
        

    }
    , [uploaded_data]);

    const queryNodes = useCallback(
        (boundsForQueries, setResult, setTriggerRefresh) => {
         
        },
        [processedUploadedData]
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
          
        },
        [processedUploadedData]
      );


    return useMemo(() => {
        return { queryNodes, singleSearch, getDetails, getConfig };
      }, [queryNodes, singleSearch, getDetails, getConfig]);
}

export default useLocalBackend