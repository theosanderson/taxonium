// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain}= require('electron')

// find out total os memory, then set the max memory to 3/4 of that
const os = require('os');
const totalMemory = os.totalmem();
const maxMemory = totalMemory * 3 / 4;
const bytesToMb = (bytes) => {
  return Math.round(bytes / 1024 / 1024);
}

// store command line arguments
let args = process.argv.slice(1);




const {fork} = require('child_process');
app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${bytesToMb(maxMemory)}`);
const path = require('path')

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.



const p = fork(path.join(__dirname, 'node_modules/taxonium_backend/server.js'),args, {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
});

console.log("Forked process", p.pid);

// log the output from the child process
p.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});


// log the output from the child process
p.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
}
);