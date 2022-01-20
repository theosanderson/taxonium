import { useEffect, useState } from "react";
import protobuf from "protobufjs";
import getRawfile from "../utils/getRawfile";

const useLoadStaticData = (protoUrl, uploadedData) => {
  const [mainData, setMainData] = useState({
    status: "not_attempted",
  });

  useEffect(() => {
    if (mainData.status === "not_attempted") {
      console.log("starting dl");
      setMainData({
        status: "loading",
        progress: 0,
        data: { node_data: { ids: [] } },
      });

      protobuf.load("./taxonium.proto").then(function (root) {
        getRawfile(protoUrl, uploadedData, setMainData).then(function (buffer) {
          console.log("buffer loaded");
          try {
            var NodeList = root.lookupType("AllData");

            var message = NodeList.decode(new Uint8Array(buffer));
            var result = NodeList.toObject(message);
          } catch (e) {
            console.log(e);
            window.alert(
              "Error loading input file. Please check the file supplied is a valid taxonium file."
            );
          }

          if (result.node_data.metadata_singles) {
            result.node_data.metadata_singles.forEach((x) => {
              x.metadata_name = x.metadata_name.toLowerCase();
            });
          }

          if (!result.node_data.metadata_singles) {
            result.node_data.metadata_singles = [
              {
                metadata_name: "country",
                mapping: result.country_mapping,
                node_values: result.node_data.countries,
              },
              {
                metadata_name: "lineage",
                mapping: result.lineage_mapping,
                node_values: result.node_data.lineages,
              },
            ];
          }

          result.node_data.ids = [...Array(result.node_data.x.length).keys()];

          const all_genes = new Set();
          result.mutation_mapping = result.mutation_mapping.map((x, i) => {
            const mutation_array = {};

            const [gene, rest] = x.split(":");
            if (rest) {
              const [orig_res, position, final_res] = rest.split("_");
              mutation_array.gene = gene;
              mutation_array.position = position;
              mutation_array.orig_res = orig_res;
              mutation_array.final_res = final_res;
              all_genes.add(gene);
            }
            mutation_array.id = i;
            return mutation_array;
          });

          result.all_genes = Array.from(all_genes).sort();
          setMainData({ status: "loaded", data: result });
          console.log("DONE");
        });
      });
    }
  }, [protoUrl, uploadedData, mainData.status, setMainData]);
  return mainData;
};

export default useLoadStaticData;
