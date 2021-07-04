import React from "react";
import SearchItem from "./SearchItem";
import { FaSearch } from "react-icons/fa";
import { RiAddCircleLine } from "react-icons/ri";
import { BiPalette } from "react-icons/bi";
import { BsInfoCircle } from "react-icons/bs";


function SearchPanel({ searchItems, setSearchItems, colourBy, setColourBy ,selectedNode,data}) {
 const node_data = data.node_data
  return (
    <div>
      <div className="border-b border-gray-300">
        <h2 className="text-xl mt-5 mb-4 text-gray-700">
          <FaSearch className="inline-block mr-2" />
          Search
        </h2>
        {searchItems.map(function (item, index) {
          return (
            <SearchItem
              key={item.id}
              id={item.id}
              category={item.category}
              value={item.value}
              setThis={(mapping) => {
                searchItems[index] = { ...searchItems[index], ...mapping };
                setSearchItems([...searchItems]);
              }}
              removeItem={(id) => {
                console.log("remove", id);
                setSearchItems(searchItems.filter((x) => x.id !== id));
              }}
              enabled={item.enabled}
            ></SearchItem>
          );
        })}

        <button
          className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
          onClick={() =>
            setSearchItems([
              ...searchItems,
              {
                id: Math.random(),
                category: "name",
                value: null,
                enabled: true,
              },
            ])
          }
        >
          <RiAddCircleLine className="inline-block mr-2" />
          Add a new search
        </button>
      </div>
      <div className="border-b border-gray-300 pb-3">
        <h2 className="text-xl mt-5 mb-4 text-gray-700">
          <BiPalette className="inline-block mr-2" />
          Colour by
        </h2>

        <select
          className="border py-2 px-3 text-grey-darkest"
          value={colourBy}
          onChange={(event) => setColourBy(event.target.value)}
        >
          <option value="lineage">Lineage</option>
          <option value="country">Country</option>
          <option value="none">None</option>
        </select>
      </div>
      <div>
        
        {selectedNode&& <div className="text-gray-500"><h2 className="text-xl mt-5 mb-4 text-gray-700">
          <BsInfoCircle className="inline-block mr-2" />
          Node info
        </h2>
       
        <div className="font-bold">
        {node_data.names[selectedNode]}
        </div>
        <div>
        {data.date_mapping[node_data.dates[selectedNode]]}
        </div>
        <div>
        {data.lineage_mapping[node_data.lineages[selectedNode]]}
        </div>
        <div>
        {data.country_mapping[node_data.countries[selectedNode]]}
        </div>
        <div className="text-xs mr-5">
            {
              
              node_data.mutations[selectedNode].mutation&&node_data.mutations[selectedNode].mutation.map(x=>data.mutation_mapping[x]).join(", ") //TODO assign the top thing to a constant and use it again
            }
          </div></div>
          }
        </div>
    </div>
  );
}

export default SearchPanel;
