const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let backendPort;

// Create a small window showing the backend URL
function showBackendUrlWindow(url) {
  const infoWindow = new BrowserWindow({
    width: 500,
    height: 150,
    title: 'Backend URL',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const encoded = encodeURIComponent(url);
  const html = `<!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <p>Backend server running at:</p>
        <p><a href="${url}">${url}</a></p>
        <p><a href="https://taxonium.org?backend=${encoded}">taxonium.org?backend=${encoded}</a></p>
      </body>
    </html>`;

  infoWindow.loadURL('data:text/html,' + encodeURIComponent(html));
}


// Calculate max memory for backend (3/4 of system memory)
const totalMemory = os.totalmem();
const maxMemory = (totalMemory * 3) / 4;
const bytesToMb = (bytes) => Math.round(bytes / 1024 / 1024);

// Get random port for backend
const getRandomPort = () => Math.floor(Math.random() * 10000) + 10000;

// Determine if app is packaged
const isPackaged = app.isPackaged || 
  (process.mainModule && process.mainModule.filename.indexOf('app.asar') !== -1) ||
  (process.argv.filter(a => a.indexOf('app.asar') !== -1).length > 0);

// Get Node binary path based on platform
function getNodeBinaryPath() {
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('isPackaged:', isPackaged);
  
  let binaryFilename = '';
  if (process.platform === 'win32') {
    binaryFilename = 'node18.exe';
  } else if (process.platform === 'linux') {
    binaryFilename = 'node18_x64linux';
  } else if (process.platform === 'darwin') {
    binaryFilename = os.arch() === 'arm64' ? 'node18_arm64mac' : 'node18_x64mac';
  }

  const binaryDirectory = isPackaged 
    ? path.join(process.resourcesPath, 'binaries')
    : path.join(__dirname, 'binaries');

  console.log('Binary directory:', binaryDirectory);
  console.log('Binary filename:', binaryFilename);
  
  const fullPath = path.join(binaryDirectory, binaryFilename);
  console.log('Full binary path:', fullPath);
  
  return fullPath;
}

// Spawn backend server
function spawnBackend(filePath) {
  if (backendProcess) {
    backendProcess.kill();
  }

  backendPort = getRandomPort();
  const binaryPath = getNodeBinaryPath();
  
  // Handle path differently when in asar archive
  let scriptPath;
  if (isPackaged && __dirname.includes('app.asar')) {
    // When packaged, the unpacked files are in app.asar.unpacked
    scriptPath = path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'node_modules/taxonium_backend/server.js');
  } else {
    scriptPath = path.join(__dirname, 'node_modules/taxonium_backend/server.js');
  }
  
  const maxOldSpaceArg = `--max-old-space-size=${bytesToMb(maxMemory)}`;
  
  console.log('Script path:', scriptPath);
  console.log('File to load:', filePath);
  console.log('Is packaged:', isPackaged);
  console.log('__dirname:', __dirname);

  const args = [maxOldSpaceArg, scriptPath, '--data_file', filePath, '--port', backendPort];

  console.log('Spawning backend:', binaryPath, args);

  backendProcess = spawn(binaryPath, args, {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.log(`Backend stderr: ${data}`);
  });

  backendProcess.on('message', (data) => {
    console.log('Backend message:', data);
    mainWindow.webContents.send('backend-status', data);
    
    // Check if backend has finished loading
    if (data.status === 'loaded') {
      const backendUrl = `http://localhost:${backendPort}`;
      console.log('Backend loaded, sending URL:', backendUrl);
      mainWindow.webContents.send('backend-url', backendUrl);
      showBackendUrlWindow(backendUrl);
    }
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      // Enable file drag and drop
      webviewTag: false,
      // This might help with file paths
      experimentalFeatures: true
    },
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle file drops from preload
  ipcMain.on('ondragstart', (event, filePath) => {
    console.log('Main process received file drop:', filePath);
    spawnBackend(filePath);
    mainWindow.webContents.send('file-dropped', filePath);
  });
  
  // Log that IPC handler is set up
  console.log('IPC handler for ondragstart is registered');

  // In development, load from Vite dev server
  if (!isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    if (backendProcess) {
      backendProcess.kill();
    }
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    spawnBackend(filePath);
    return filePath;
  }
  return null;
});

ipcMain.handle('open-file', async (event, filePath) => {
  console.log('Opening file from drag and drop:', filePath);
  spawnBackend(filePath);
  return filePath;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});