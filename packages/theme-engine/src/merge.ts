import type { ThemeAssetConfig } from "@mmbt/shared-types";

import { DEFAULT_THEME_CONFIG } from "./constants.js";
import type {
  ResolvedThemeConfig,
  ThemeAssetOverride,
  ThemeConfigOverride,
  ThemeSpacingConfig
} from "./types.js";

function cloneSponsorSlots(
  sponsorSlots: ThemeAssetConfig["sponsorSlots"] | ThemeAssetOverride["sponsorSlots"]
): ThemeAssetConfig["sponsorSlots"] | undefined {
  if (!sponsorSlots) {
    return undefined;
  }

  return { ...sponsorSlots };
}

function mergeAssets(
  base: ThemeAssetConfig,
  override: ThemeAssetOverride | undefined
): ThemeAssetConfig {
  const mergedSponsorSlots = {
    ...cloneSponsorSlots(base.sponsorSlots),
    ...cloneSponsorSlots(override?.sponsorSlots)
  };

  return {
    ...base,
    ...override,
    sponsorSlots: Object.keys(mergedSponsorSlots).length > 0 ? mergedSponsorSlots : undefined
  };
}

export function createDefaultThemeConfig(): ResolvedThemeConfig {
  return {
    ...DEFAULT_THEME_CONFIG,
    colors: { ...DEFAULT_THEME_CONFIG.colors },
    typography: { ...DEFAULT_THEME_CONFIG.typography },
    layout: { ...DEFAULT_THEME_CONFIG.layout },
    spacing: { ...DEFAULT_THEME_CONFIG.spacing },
    assets: mergeAssets(DEFAULT_THEME_CONFIG.assets, undefined)
  };
}

export function mergeThemeWithDefaults(
  override: ThemeConfigOverride = {}
): ResolvedThemeConfig {
  const defaults = createDefaultThemeConfig();

  return {
    id: override.id ?? defaults.id,
    name: override.name ?? defaults.name,
    version: override.version ?? defaults.version,
    gameCode: override.gameCode ?? defaults.gameCode,
    colors: {
      ...defaults.colors,
      ...override.colors
    },
    typography: {
      ...defaults.typography,
      ...override.typography
    },
    layout: {
      ...defaults.layout,
      ...override.layout
    },
    spacing: {
      ...defaults.spacing,
      ...override.spacing
    } satisfies ThemeSpacingConfig,
    assets: mergeAssets(defaults.assets, override.assets)
  };
}

export function normalizeThemeConfig(
  themeConfig: ThemeConfigOverride
): ResolvedThemeConfig {
  return mergeThemeWithDefaults(themeConfig);
}
