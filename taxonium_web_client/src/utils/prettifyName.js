const prettifyName = (name, config) => {
  if (config && config.customNames && config.customNames[name]) {
    return config.customNames[name];
  }
  if (name === "num_tips") {
    return "Number of descendants";
  }
  const new_name = name.replace("meta_", "").replace("_", " ");
  return new_name.charAt(0).toUpperCase() + new_name.slice(1);
};

export default prettifyName;
