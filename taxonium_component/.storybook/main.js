import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    const dataHandling = path.resolve(
      __dirname,
      "../../taxonium_data_handling",
    );
    config.resolve = { ...config.resolve, preserveSymlinks: true };
    config.server = {
      ...(config.server || {}),
      fs: {
        ...(config.server?.fs || {}),
        allow: [...(config.server?.fs?.allow || []), dataHandling],
      },
      watch: {
        ...(config.server?.watch || {}),
        ignored: [
          ...(config.server?.watch?.ignored || []),
          `!${dataHandling}/**`,
        ],
      },
    };
    return config;
  },
};
export default config;
