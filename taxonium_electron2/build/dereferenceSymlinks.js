const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const appDir = context.appOutDir;
  console.log('Cleaning up problematic directories in:', appDir);
  
  // Path to the problematic taxonium_data_handling directory
  const problematicPath = path.join(
    appDir, 
    'Taxonium.app/Contents/Resources/app.asar.unpacked/node_modules/'
  );
  
  // Check if it exists (could be a symlink or directory)
  try {
    const stats = fs.lstatSync(problematicPath);
    if (stats.isSymbolicLink()) {
      console.log('Removing problematic symlink:', problematicPath);
      fs.unlinkSync(problematicPath);
      console.log('Successfully removed taxonium_data_handling symlink');
    } else if (stats.isDirectory()) {
      console.log('Removing problematic directory:', problematicPath);
      fs.rmSync(problematicPath, { recursive: true, force: true });
      console.log('Successfully removed taxonium_data_handling directory');
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error handling problematic path:', err);
    }
  }
};