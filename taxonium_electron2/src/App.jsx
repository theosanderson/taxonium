import React, { useState, useEffect } from 'react';
import Taxonium from 'taxonium-component';
import './App.css';

function App() {
  const [query, setQuery] = useState({});
  const [backendUrl, setBackendUrl] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Example configuration
  const configDict = {
    title: "Taxonium Electron",
    showSidebar: true,
    showLegend: true,
    showMinimap: true,
    showTipLabels: true,
  };

  // Sample data for initial display
  const nwk = `((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);`;
  const metadata_text = `Node,Name,Species
A,Bob,Cow
B,Jim,Cow
C,Joe,Fish
D,John,Fish`;

  const metadata = {
    filename: "test.csv",
    data: metadata_text,
    status: "loaded",
    filetype: "meta_csv",
  };

  const sourceData = {
    status: "loaded",
    filename: "test.nwk",
    data: nwk,
    filetype: "nwk",
    metadata: metadata,
  };

  useEffect(() => {
    // Listen for backend status updates
    if (window.electronAPI) {
      window.electronAPI.onBackendStatus((data) => {
        console.log('Backend status:', data);
        setStatus(data.status || JSON.stringify(data));
      });

      window.electronAPI.onBackendUrl((url) => {
        console.log('Backend URL:', url);
        setBackendUrl(url);
        setLoading(false);
      });
    }

    // Cleanup listeners
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('backend-status');
        window.electronAPI.removeAllListeners('backend-url');
      }
    };
  }, []);

  const handleOpenFile = async () => {
    if (window.electronAPI) {
      setLoading(true);
      setStatus('Opening file dialog...');
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        setStatus(`Loading file: ${filePath}`);
      } else {
        setLoading(false);
        setStatus('');
      }
    }
  };

  return (
    <div className="App">
      {!backendUrl && (
        <div className="controls">
          <button onClick={handleOpenFile} disabled={loading}>
            {loading ? 'Loading...' : 'Open File'}
          </button>
          {status && <div className="status">{status}</div>}
          <div className="info">
            Or view sample data below:
          </div>
        </div>
      )}
      
      <div className="taxonium-container">
        <Taxonium
          configDict={configDict}
          query={query}
          updateQuery={setQuery}
          sourceData={!backendUrl ? sourceData : undefined}
          backendUrl={backendUrl}
        />
      </div>
    </div>
  );
}

export default App;