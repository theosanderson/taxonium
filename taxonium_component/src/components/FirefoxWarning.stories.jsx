import FirefoxWarning from "./FirefoxWarning";

export default {
  title: "Taxonium/FirefoxWarning",
  component: FirefoxWarning,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const Default = {
  args: {
    className: "bg-yellow-100 p-4 rounded text-yellow-800 mb-4",
  },
};

// Note: This component currently always returns null as indicated in the implementation
// The story is provided for documentation purposes, but it won't render anything
export const WithCustomStyling = {
  args: {
    className: "bg-red-100 p-4 rounded text-red-800 mb-4 border border-red-300",
  },
};
