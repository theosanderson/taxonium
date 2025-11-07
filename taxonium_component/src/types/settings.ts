/**
 * @deprecated This file is deprecated. Use ConfigSettings from ./configSettings instead.
 * Settings and Config have been merged into a single unified type.
 */

import type { ConfigSettings, PrettyStroke as PS } from "./configSettings";

export type { PS as PrettyStroke };

/**
 * @deprecated Use ConfigSettings instead. Settings have been merged with Config.
 */
export type Settings = ConfigSettings;

