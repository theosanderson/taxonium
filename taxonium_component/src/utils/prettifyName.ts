import type { Config as BackendConfig } from "../types/backend";

// prettifyName only relies on the optional `customNames` field.
// Extend the imported Config type with this field while making the
// remainder of the properties optional so callers don't need to
// construct a full backend Config just for this helper.
interface PrettifyNameConfig extends Partial<BackendConfig> {
  customNames?: Record<string, string>;
}

const prettifyName = (name: string, config?: PrettifyNameConfig) => {
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
