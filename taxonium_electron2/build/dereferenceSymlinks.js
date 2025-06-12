const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const appDir = context.appOutDir;
  console.log('Cleaning up problematic directories in:', appDir);
  
  // Path to the problematic taxonium_data_handling directory
  const problematicPath = path.join(
    appDir, 
    'Taxonium.app/Contents/Resources/app.asar.unpacked/node_modules/taxonium-component/node_modules/taxonium_data_handling'
  );
  
  // Check if it exists and remove it
  if (fs.existsSync(problematicPath)) {
    console.log('Removing problematic directory:', problematicPath);
    try {
      fs.rmSync(problematicPath, { recursive: true, force: true });
      console.log('Successfully removed taxonium_data_handling directory');
    } catch (err) {
      console.error('Error removing directory:', err);
    }
  }
};