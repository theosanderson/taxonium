
console.log('ExecPath', process.execPath);

process.on('message', (m) => {
  console.log('Got message:', m);
  const rev = m.split('').reverse().join('');
  process.send(`Reversed: ${rev}`);
});