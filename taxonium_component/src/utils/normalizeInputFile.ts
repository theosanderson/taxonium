import type { InputFile, MetadataFile, NewickFile } from "../types/newick";

/**
 * Normalizes an InputFile by inferring missing fields with smart defaults.
 *
 * Rules:
 * - If status is not provided, infer it:
 *   - If data is present -> "loaded"
 *   - If filename looks like a URL (starts with http/https) -> "url_supplied"
 *   - Otherwise -> "loaded"
 * - If filename is not provided:
 *   - For "loaded" status -> use a default name based on filetype
 *   - For "url_supplied" status -> filename is required (throw error)
 */
export function normalizeInputFile<T extends InputFile>(file: T): T & { status: "url_supplied" | "loaded"; filename: string } {
  const normalized = { ...file };

  // Infer status if not provided
  if (!normalized.status) {
    if (normalized.data !== undefined) {
      // If data is provided, it's loaded
      normalized.status = "loaded";
    } else if (normalized.filename && isUrl(normalized.filename)) {
      // If filename looks like a URL, treat as url_supplied
      normalized.status = "url_supplied";
    } else {
      // Default to loaded
      normalized.status = "loaded";
    }
  }

  // Infer filename if not provided
  if (!normalized.filename) {
    if (normalized.status === "url_supplied") {
      throw new Error("filename is required when status is 'url_supplied' or when no data is provided");
    }
    // Generate a default filename based on filetype
    const filetype = (normalized as any).filetype || "data";
    normalized.filename = `data.${filetype}`;
  }

  return normalized as T & { status: "url_supplied" | "loaded"; filename: string };
}

/**
 * Checks if a string looks like a URL
 */
function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

/**
 * Normalizes a NewickFile and its nested metadata
 */
export function normalizeNewickFile(file: NewickFile): NewickFile & { status: "url_supplied" | "loaded"; filename: string } {
  const normalized = normalizeInputFile(file);

  // Also normalize metadata if present
  if (normalized.metadata) {
    normalized.metadata = normalizeInputFile(normalized.metadata as MetadataFile);
  }

  return normalized;
}

/**
 * Normalizes any sourceData object (including non-InputFile formats)
 * This is a more lenient version for the Taxonium component's SourceData interface
 */
export function normalizeSourceData<T extends Record<string, any>>(sourceData: T): T {
  if (!sourceData) return sourceData;

  const normalized: any = { ...sourceData };

  // Infer status if not provided
  if (!normalized.status) {
    if (normalized.data !== undefined) {
      normalized.status = "loaded";
    } else if (normalized.filename && isUrl(normalized.filename)) {
      normalized.status = "url_supplied";
    } else {
      normalized.status = "loaded";
    }
  }

  // Infer filename if not provided
  if (!normalized.filename) {
    if (normalized.status === "url_supplied" && !normalized.data) {
      throw new Error("filename is required when status is 'url_supplied' or when no data is provided");
    }
    // Generate a default filename based on filetype
    const filetype = normalized.filetype || "data";
    const ext = getExtensionForFiletype(filetype);
    normalized.filename = `data.${ext}`;
  }

  // Also normalize metadata if present
  if (normalized.metadata && typeof normalized.metadata === "object") {
    normalized.metadata = normalizeSourceData(normalized.metadata);
  }

  return normalized as T;
}

/**
 * Gets the file extension for a given filetype
 */
function getExtensionForFiletype(filetype: string): string {
  const extensions: Record<string, string> = {
    'nwk': 'nwk',
    'nexus': 'nex',
    'jsonl': 'jsonl',
    'meta_csv': 'csv',
    'meta_tsv': 'tsv',
    'nextstrain': 'json',
  };
  return extensions[filetype] || filetype;
}
