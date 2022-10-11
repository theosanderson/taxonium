// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const {fork, spawn} = require('child_process');
const path = require('path');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on('fork', (e) => {
  const p = fork(path.join(__dirname, 'child.js'), ['hello'], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });
  p.stdout.on('data', (d) => {
    e.reply('data', '[stdout-main-fork] ' + d.toString());
  });
  p.stderr.on('data', (d) => {
    e.reply('data', '[stderr-main-fork] ' + d.toString());
  });
  p.send('hello');
  p.on('message', (m) => {
    e.reply('data', '[ipc-main-fork] ' + m);
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.