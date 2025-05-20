export interface PrettifyConfig {
  customNames?: Record<string, string>;
}

const prettifyName = (name: string, config?: PrettifyConfig): string => {
  if (config?.customNames && name in config.customNames) {
    return config.customNames[name];
  }
  if (name === "num_tips") {
    return "Number of descendants";
  }
  const newName = name.replace("meta_", "").replace("_", " ");
  return newName.charAt(0).toUpperCase() + newName.slice(1);
};

export default prettifyName;
