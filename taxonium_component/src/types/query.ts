export interface Query {
  /** JSON string of search specifications */
  srch?: string;
  /** JSON string mapping search keys to enabled flag */
  enabled?: string;
  /** Backend URL to use */
  backend?: string;
  /** Session identifier */
  sid?: string;
  /** Axis type for the x dimension */
  xType?: string;
  /** JSON string mapping mutation types to enabled flag */
  mutationTypesEnabled?: string;
  /** Whether the treenome browser is enabled (boolean encoded as string) */
  treenomeEnabled?: string | boolean;
  /** JSON string describing color-by state */
  color?: string;
  /** JSON string containing config overrides */
  config?: string;
  /** URL to fetch config from */
  configUrl?: string;
  /** Index of search to zoom to on load */
  zoomToSearch?: number;
  [key: string]: unknown;
}
