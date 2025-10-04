import React, { useState, useEffect } from 'react';
import Taxonium from 'taxonium-component';
import './App.css';

function App() {
  const [backendUrl, setBackendUrl] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Example configuration
  const configDict = {
    title: "Taxonium Electron",
    showSidebar: true,
    showLegend: true,
    showMinimap: true,
    showTipLabels: true,
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

      window.electronAPI.onFileDropped((filePath) => {
        console.log('File dropped (confirmed):', filePath);
        setLoading(true);
        setStatus(`Loading file: ${filePath}`);
      });
    }

    // Cleanup listeners
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('backend-status');
        window.electronAPI.removeAllListeners('backend-url');
        window.electronAPI.removeAllListeners('file-dropped');
      }
    };
  }, []);

  useEffect(() => {
    // Listen for drag events from preload
    const handleDragEnter = () => {
      setDragOver(true);
    };
    
    const handleDragLeave = () => {
      setDragOver(false);
    };

    window.addEventListener('drag-enter', handleDragEnter);
    window.addEventListener('drag-leave', handleDragLeave);

    return () => {
      window.removeEventListener('drag-enter', handleDragEnter);
      window.removeEventListener('drag-leave', handleDragLeave);
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
        <div className={`controls ${dragOver ? 'drag-over' : ''}`}>
          <div className="drop-zone">
            <button onClick={handleOpenFile} disabled={loading}>
              {loading ? 'Loading...' : 'Open File'}
            </button>
            <div className="drop-text">
              or drag and drop a file onto this window
            </div>
            {status && <div className="status">{status}</div>}
          </div>
        </div>
      )}
      
      {backendUrl && (
        <div className="taxonium-container">
          <Taxonium
            configDict={configDict}
            backendUrl={backendUrl}
          />
        </div>
      )}
    </div>
  );
}

export default App;
