const {fork, spawn} = require('child_process');
const path = require('path');
const {ipcRenderer} = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fork-renderer').addEventListener('click', () => {
    const p = fork(path.join(__dirname, 'child.js'), ['hello'], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });
    p.stdout.on('data', (d) => {
      writeData('[stdout-renderer-fork] ' + d.toString());
    });
    p.stderr.on('data', (d) => {
      writeData('[stderr-renderer-fork] ' + d.toString());
    });
    p.send('hello');
    p.on('message', (m) => {
      writeData('[ipc-main-fork] ' + m);
    });
  });

  document.getElementById('fork-main').addEventListener('click', () => {
    ipcRenderer.send('fork');
  });

  const output = document.getElementById('output');
  ipcRenderer.on('data', (e, data) => {
    writeData(data);
  });

  function writeData(data) {
    output.innerText = output.innerText + '\n' + data;
  }
});