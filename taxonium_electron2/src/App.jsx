import React, { useState } from 'react';
import Taxonium from 'taxonium-component';
import './App.css';

function App() {
  const [query, setQuery] = useState({});
  
  // Example configuration - you can customize this
  const configDict = {
    title: "Taxonium Electron",
    showSidebar: true,
    showLegend: true,
    showMinimap: true,
    showTipLabels: true,
  };

  // Sample tree data in Newick format
  const nwk = `((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);`;

  // Sample metadata
  const metadata_text = `Node,Name,Species
A,Bob,Cow
B,Jim,Cow
C,Joe,Fish
D,John,Fish`;

  // Metadata object
  const metadata = {
    filename: "test.csv",
    data: metadata_text,
    status: "loaded",
    filetype: "meta_csv",
  };

  // Source data object
  const sourceData = {
    status: "loaded",
    filename: "test.nwk",
    data: nwk,
    filetype: "nwk",
    metadata: metadata,
  };

  return (
    <div className="App">
      <div className="taxonium-container">
        <Taxonium
          configDict={configDict}
          query={query}
          updateQuery={setQuery}
          sourceData={sourceData}
        />
      </div>
    </div>
  );
}

export default App;