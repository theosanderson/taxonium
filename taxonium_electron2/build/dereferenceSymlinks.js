const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const appDir = context.appOutDir;
  console.log('Dereferencing symlinks in:', appDir);
  
  // Also handle app.asar.unpacked if it exists
  const unpackedDir = path.join(appDir, 'Taxonium.app/Contents/Resources/app.asar.unpacked');
  
  function dereferenceSymlinks(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isSymbolicLink()) {
        try {
          const target = fs.readlinkSync(fullPath);
          const resolvedTarget = path.resolve(path.dirname(fullPath), target);
          
          // Check if this is a problematic node_modules symlink
          if (fullPath.includes('node_modules') && target.includes('..')) {
            console.log(`Removing problematic symlink: ${fullPath} -> ${target}`);
            fs.unlinkSync(fullPath);
          } else if (fs.existsSync(resolvedTarget)) {
            console.log(`Dereferencing symlink: ${fullPath} -> ${resolvedTarget}`);
            fs.unlinkSync(fullPath);
            
            const stats = fs.statSync(resolvedTarget);
            if (stats.isDirectory()) {
              copyDir(resolvedTarget, fullPath);
            } else {
              fs.copyFileSync(resolvedTarget, fullPath);
            }
          }
        } catch (err) {
          console.warn(`Could not dereference symlink ${fullPath}:`, err.message);
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        dereferenceSymlinks(fullPath);
      }
    }
  }
  
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  dereferenceSymlinks(appDir);
  
  // Also process the unpacked directory if it exists
  if (fs.existsSync(unpackedDir)) {
    console.log('Also dereferencing symlinks in unpacked dir:', unpackedDir);
    dereferenceSymlinks(unpackedDir);
  }
};