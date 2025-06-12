const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let backendPort;

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

  return path.join(binaryDirectory, binaryFilename);
}

// Spawn backend server
function spawnBackend(filePath) {
  if (backendProcess) {
    backendProcess.kill();
  }

  backendPort = getRandomPort();
  const binaryPath = getNodeBinaryPath();
  const scriptPath = path.join(__dirname, 'node_modules/taxonium_backend/server.js');
  const maxOldSpaceArg = `--max-old-space-size=${bytesToMb(maxMemory)}`;

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
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  // Send backend URL to renderer once it's ready
  setTimeout(() => {
    const backendUrl = `http://localhost:${backendPort}`;
    mainWindow.webContents.send('backend-url', backendUrl);
  }, 2000);
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
      webSecurity: true
    },
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
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
    properties: ['openFile'],
    filters: [
      { name: 'Tree Files', extensions: ['nwk', 'newick', 'tree', 'nex', 'nexus'] },
      { name: 'JSON Files', extensions: ['json', 'jsonl'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    spawnBackend(filePath);
    return filePath;
  }
  return null;
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