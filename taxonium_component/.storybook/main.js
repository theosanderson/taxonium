import path from 'path';

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    // Watch taxonium_data_handling for changes
    config.server = config.server || {};
    config.server.watch = config.server.watch || {};
    config.server.watch.ignored = (file) => {
      // Don't ignore taxonium_data_handling even though it's in node_modules
      if (file.includes('taxonium_data_handling')) {
        return false;
      }
      return file.includes('node_modules');
    };
    
    // Exclude from optimization so changes are picked up
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.exclude = config.optimizeDeps.exclude || [];
    config.optimizeDeps.exclude.push('taxonium_data_handling');
    
    // Add to fs.allow but keep the default paths
    config.server.fs = config.server.fs || {};
    config.server.fs.allow = [
      // Default searchForWorkspaceRoot behavior
      path.join(process.cwd(), '..'),
      // Add taxonium_data_handling
      path.resolve(__dirname, '../../taxonium_data_handling')
    ];
    
    return config;
  },
};
export default config;
