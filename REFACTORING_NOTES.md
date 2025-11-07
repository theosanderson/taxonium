# Settings and Config Refactoring

## Summary
Merged `useSettings` and `useConfig` into a single unified `useConfigSettings` hook to resolve architectural issues and enable config-driven default settings.

## Problem
- **useSettings** had hardcoded defaults that couldn't be overridden by config
- **useConfig** loaded from backend/files but couldn't influence settings
- The two systems were completely separate with no interaction
- Settings were mostly ephemeral (lost on refresh)
- Loading order made it impossible for config to provide setting defaults

## Solution
Created `useConfigSettings` that:
1. Loads config from multiple sources (backend → file → configDict)
2. Extracts setting defaults from config if provided
3. Initializes settings with these defaults
4. Maintains UI-settability for all settings
5. Returns both config and settings in a unified structure

## Loading Order
1. Hardcoded defaults (defined in `DEFAULT_SETTINGS`)
2. Backend config (`backend.getConfig()`)
3. Config from URL query parameter (`query.config`)
4. Config from external file (`query.configUrl`)
5. Config from props (`configDict` - highest priority)
6. UI overrides (user interactions)

## Config Can Now Specify Setting Defaults
You can now set defaults for any settings in your config file or configDict:

```json
{
  "title": "My Tree",
  "nodeSize": 5,
  "lineColor": [200, 100, 50],
  "opacity": 0.8,
  "minimapEnabled": false,
  "thresholdForDisplayingText": 3.5,
  "prettyStroke": {
    "enabled": true,
    "color": [100, 100, 100],
    "width": 2
  }
}
```

All settings properties that can be configured:
- `minimapEnabled` (boolean)
- `displayTextForInternalNodes` (boolean)
- `thresholdForDisplayingText` (number)
- `displaySearchesAsPoints` (boolean)
- `searchPointSize` (number)
- `opacity` (number)
- `nodeSize` (number)
- `terminalNodeLabelColor` (number[])
- `lineColor` (number[])
- `cladeLabelColor` (number[])
- `displayPointsForInternalNodes` (boolean)
- `maxCladeTexts` (number)
- `prettyStroke` (PrettyStroke object)

## Changes Made

### New File
- `src/hooks/useConfigSettings.tsx` - Unified hook combining config and settings logic

### Modified Files
- `src/Taxonium.tsx` - Updated to use new hook instead of separate useSettings/useConfig
- Added useEffect to handle initial viewport positioning from config

### Removed Files
- `src/hooks/useSettings.tsx` - Deprecated, replaced by useConfigSettings
- `src/hooks/useConfig.tsx` - Deprecated, replaced by useConfigSettings

### GISAID-Specific Code Removed
- Removed GISAID hover details handling from Taxonium.tsx
- Removed `enabled_by_gisaid` flag and branding from SearchPanel
- Removed automatic `enabled_by_gisaid` setting in processNextstrain.js
- Updated stories to use generic example data

### Demo Story
- Added `WithConfigDrivenSettings` story in `Taxonium.stories.tsx` demonstrating config-driven settings

## Breaking Changes
None - the API surface remains identical. Both `config` and `settings` objects have the same structure as before.

## Benefits
1. ✅ Config can now provide default values for settings
2. ✅ Single source of truth for configuration
3. ✅ Clearer loading order and precedence
4. ✅ Maintains backward compatibility
5. ✅ All settings remain UI-settable
6. ✅ Reduced code duplication
7. ✅ Eliminated architectural confusion

## Future Improvements
- Consider persisting some settings to localStorage
- Add validation for config/settings values
- Document which settings should be in config vs always UI-controlled
