const path = require('path');

module.exports = {
  packagerConfig: {
    icon: path.join(__dirname, 'build', 'icon'),
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: {} },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32']
    }
  ]
};
