// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const Os = require("os");

const path = require("path");

// find out total os memory, then set the max memory to 3/4 of that
const os = require("os");
const totalMemory = os.totalmem();
const maxMemory = (totalMemory * 3) / 4;
const bytesToMb = (bytes) => {
  return Math.round(bytes / 1024 / 1024);
};

//get random port
const port = Math.floor(Math.random() * 10000) + 10000;
let fork_id = 0;
// store command line arguments
let args = process.argv.slice(1);

let isPackaged = false;

if (
  process.mainModule &&
  process.mainModule.filename.indexOf("app.asar") !== -1
) {
  isPackaged = true;
} else if (
  process.argv.filter((a) => a.indexOf("app.asar") !== -1).length > 0
) {
  isPackaged = true;
}

let binaryFilename = "";
if (process.platform === "win32") {
  binaryFilename = "node18.exe";
} else if (process.platform === "linux") {
  binaryFilename = "node18_x64linux";
} else if (process.platform === "darwin") {
  // we need to check if we are on an M1 mac
  if (Os.arch() === "arm64") {
    binaryFilename = "node18_arm64mac";
  } else {
    binaryFilename = "node18_x64mac";
  }
}

let binaryDirectory = "";

// if we are packaged then we need to use the resources path
// otherwise we can use the current directory
if (isPackaged) {
  binaryDirectory = path.join(process.resourcesPath, "binaries");
} else {
  binaryDirectory = path.join(__dirname, "../binaries");
}

const { spawn, fork } = require("child_process");

const setup = (mainWindow, args) => {
  binaryPath = path.join(binaryDirectory, binaryFilename);
  scriptPath = path.join(
    __dirname,
    "../node_modules/taxonium_backend/server.js",
  );

  max_old_space_arg = "--max-old-space-size=" + bytesToMb(maxMemory);

  // do it with spawn instead

  const p = spawn(binaryPath, [max_old_space_arg, scriptPath, ...args], {
    stdio: ["pipe", "pipe", "pipe", "ipc"],
  });

  console.log("Executing", binaryPath, [
    max_old_space_arg,
    scriptPath,
    ...args,
  ]);
  fork_id = p.pid;

  setTimeout(() => {
    console.log("sending message");
    // close mainWindow

    mainWindow.webContents.send("message", "hello from main");
  }, 5000);

  console.log("Forked process", p.pid);

  // log the output from the child process
  p.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  // log the output from the child process
  p.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
  });

  //log events from the child process
  p.on("message", (data) => {
    console.log(`message: ${data}`);
    console.log(data);
    mainWindow.webContents.send("status", data);
  });
};

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  //setup(mainWindow);

  //mainWindow.toggleDevTools();
  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // provide the port to the renderer process
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("port", port);
  });

  // listen for 'open-file' event from the renderer process
  ipcMain.on("open-file", (event, arg) => {
    console.log(arg); // prints "ping"
    console.log("opening file");
    setup(mainWindow, ["--data_file", arg, "--port", port]);
    event.reply("asynchronous-reply", "pong");

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// when receive "close-window" quit
ipcMain.on("close-window", (event, arg) => {
  console.log("closing window");
  if (fork_id) {
    process.kill(fork_id);
  }
  app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
