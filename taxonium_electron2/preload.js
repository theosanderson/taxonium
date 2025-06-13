const { contextBridge, ipcRenderer, webUtils } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // Backend communication
  onBackendStatus: (callback) => {
    ipcRenderer.on('backend-status', (event, data) => callback(data));
  },
  
  onBackendUrl: (callback) => {
    ipcRenderer.on('backend-url', (event, url) => callback(url));
  },
  
  onFileDropped: (callback) => {
    ipcRenderer.on('file-dropped', (event, filePath) => callback(filePath));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Handle file drops
let dragCounter = 0;

window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter++;
  
  if (dragCounter === 1) {
    // Notify renderer that drag started
    window.dispatchEvent(new CustomEvent('drag-enter'));
  }
});

window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter--;
  
  if (dragCounter === 0) {
    // Notify renderer that drag ended
    window.dispatchEvent(new CustomEvent('drag-leave'));
  }
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

window.addEventListener('drop', (e) => {
  console.log('Drop event triggered in preload');
  e.preventDefault();
  e.stopPropagation();
  
  dragCounter = 0;
  // Notify renderer that drag ended
  window.dispatchEvent(new CustomEvent('drag-leave'));

  const files = e.dataTransfer.files;
  console.log('Number of files dropped:', files.length);

  if (files.length > 0) {
    const file = files[0];
    console.log('File name:', file.name);
    
    // Use webUtils to get the actual file path
    try {
      const filePath = webUtils.getPathForFile(file);
      console.log('File path from webUtils:', filePath);
      
      if (filePath) {
        console.log('Sending file path to main process:', filePath);
        ipcRenderer.send('ondragstart', filePath);
      } else {
        console.log('webUtils returned empty path');
      }
    } catch (error) {
      console.error('Error getting file path:', error);
    }
  }
});

console.log('Preload script loaded - drag and drop handlers attached');