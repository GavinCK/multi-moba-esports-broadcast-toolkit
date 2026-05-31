import type { SponsorSlot } from "@mmbt/shared-types";

import {
  SPONSOR_SLOT_KEYS,
  THEME_ASSET_KEYS,
  THEME_COLOR_KEYS,
  THEME_LAYOUT_KEYS,
  THEME_LAYOUT_LIMITS,
  THEME_SPACING_KEYS,
  THEME_SPACING_LIMITS,
  THEME_TYPOGRAPHY_KEYS
} from "./constants";
import { resolveThemeAssetPath } from "./asset-references";
import { mergeThemeWithDefaults } from "./merge";
import type {
  ResolvedThemeConfig,
  ThemeConfigOverride,
  ThemeEngineResult,
  ThemeValidationIssue,
  ThemeValidationOptions,
  ThemeValidationResult
} from "./types";

const COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const UNSAFE_TEXT_PATTERN = /(?:<|>|{|}|;|@import|url\s*\(|javascript\s*:)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: ThemeValidationIssue[],
  path: string,
  code: string,
  message: string,
  severity: ThemeValidationIssue["severity"] = "error"
): void {
  issues.push({ path, code, message, severity });
}

function isValidColor(value: string): boolean {
  return value === "transparent" || COLOR_PATTERN.test(value);
}

function validateStringField(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ThemeValidationIssue[],
  options: { required: boolean; safeText?: boolean }
): void {
  const value = record[field];

  if (value === undefined) {
    if (options.required) {
      addIssue(issues, path, "theme-required-string", `${path} must be a non-empty string.`);
    }
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    addIssue(issues, path, "theme-invalid-string", `${path} must be a non-empty string.`);
    return;
  }

  if (options.safeText && UNSAFE_TEXT_PATTERN.test(value)) {
    addIssue(issues, path, "theme-unsafe-text", `${path} must not contain markup, script, or remote style syntax.`);
  }
}

function validateColorFields(
  themeRecord: Record<string, unknown>,
  path: string,
  required: boolean,
  issues: ThemeValidationIssue[]
): void {
  const colors = themeRecord.colors;
  const colorsPath = `${path}.colors`;

  if (colors === undefined) {
    if (required) {
      addIssue(issues, colorsPath, "theme-colors-required", `${colorsPath} must be an object.`);
    }
    return;
  }

  if (!isRecord(colors)) {
    addIssue(issues, colorsPath, "theme-colors-invalid", `${colorsPath} must be an object.`);
    return;
  }

  THEME_COLOR_KEYS.forEach((key) => {
    const value = colors[key];
    const colorPath = `${colorsPath}.${key}`;

    if (value === undefined) {
      if (required) {
        addIssue(issues, colorPath, "theme-color-required", `${colorPath} must be provided.`);
      }
      return;
    }

    if (typeof value !== "string" || !isValidColor(value)) {
      addIssue(
        issues,
        colorPath,
        "theme-color-invalid",
        `${colorPath} must be transparent or a hex color string.`
      );
    }
  });
}

function validateTypographyFields(
  themeRecord: Record<string, unknown>,
  path: string,
  required: boolean,
  issues: ThemeValidationIssue[]
): void {
  const typography = themeRecord.typography;
  const typographyPath = `${path}.typography`;

  if (typography === undefined) {
    if (required) {
      addIssue(issues, typographyPath, "theme-typography-required", `${typographyPath} must be an object.`);
    }
    return;
  }

  if (!isRecord(typography)) {
    addIssue(issues, typographyPath, "theme-typography-invalid", `${typographyPath} must be an object.`);
    return;
  }

  THEME_TYPOGRAPHY_KEYS.forEach((key) => {
    validateStringField(typography, key, `${typographyPath}.${key}`, issues, {
      required: required && key !== "numberFont",
      safeText: true
    });
  });
}

function validateIntegerRange(
  value: unknown,
  path: string,
  min: number,
  max: number,
  issues: ThemeValidationIssue[]
): void {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    addIssue(issues, path, "theme-number-out-of-range", `${path} must be an integer from ${min} to ${max}.`);
  }
}

function validateLayoutFields(
  themeRecord: Record<string, unknown>,
  path: string,
  required: boolean,
  issues: ThemeValidationIssue[]
): void {
  const layout = themeRecord.layout;
  const layoutPath = `${path}.layout`;

  if (layout === undefined) {
    if (required) {
      addIssue(issues, layoutPath, "theme-layout-required", `${layoutPath} must be an object.`);
    }
    return;
  }

  if (!isRecord(layout)) {
    addIssue(issues, layoutPath, "theme-layout-invalid", `${layoutPath} must be an object.`);
    return;
  }

  THEME_LAYOUT_KEYS.forEach((key) => {
    const value = layout[key];
    const valuePath = `${layoutPath}.${key}`;

    if (value === undefined) {
      if (required) {
        addIssue(issues, valuePath, "theme-layout-value-required", `${valuePath} must be provided.`);
      }
      return;
    }

    const limit = THEME_LAYOUT_LIMITS[key];
    validateIntegerRange(value, valuePath, limit.min, limit.max, issues);
  });
}

function validateSpacingFields(
  themeRecord: Record<string, unknown>,
  path: string,
  issues: ThemeValidationIssue[]
): void {
  const spacing = themeRecord.spacing;
  const spacingPath = `${path}.spacing`;

  if (spacing === undefined) {
    return;
  }

  if (!isRecord(spacing)) {
    addIssue(issues, spacingPath, "theme-spacing-invalid", `${spacingPath} must be an object when provided.`);
    return;
  }

  THEME_SPACING_KEYS.forEach((key) => {
    const value = spacing[key];

    if (value !== undefined) {
      validateIntegerRange(value, `${spacingPath}.${key}`, THEME_SPACING_LIMITS.min, THEME_SPACING_LIMITS.max, issues);
    }
  });
}

function validateSponsorSlotKey(
  key: string,
  path: string,
  issues: ThemeValidationIssue[]
): key is SponsorSlot {
  if (!(SPONSOR_SLOT_KEYS as readonly string[]).includes(key)) {
    addIssue(issues, path, "theme-sponsor-slot-invalid", `${path} must be a supported sponsor slot key.`);
    return false;
  }

  return true;
}

function validateAssetsFields(
  themeRecord: Record<string, unknown>,
  path: string,
  required: boolean,
  issues: ThemeValidationIssue[]
): void {
  const assets = themeRecord.assets;
  const assetsPath = `${path}.assets`;

  if (assets === undefined) {
    if (required) {
      addIssue(issues, assetsPath, "theme-assets-required", `${assetsPath} must be an object.`);
    }
    return;
  }

  if (!isRecord(assets)) {
    addIssue(issues, assetsPath, "theme-assets-invalid", `${assetsPath} must be an object.`);
    return;
  }

  THEME_ASSET_KEYS.forEach((key) => {
    const value = assets[key];
    const valuePath = `${assetsPath}.${key}`;

    if (value === undefined) {
      return;
    }

    if (typeof value !== "string") {
      addIssue(issues, valuePath, "theme-asset-invalid", `${valuePath} must be a string asset reference.`);
      return;
    }

    const result = resolveThemeAssetPath(value, { path: valuePath });
    if (!result.ok) {
      issues.push(...result.error.issues);
    }
  });

  if (assets.sponsorSlots !== undefined) {
    if (!isRecord(assets.sponsorSlots)) {
      addIssue(issues, `${assetsPath}.sponsorSlots`, "theme-sponsor-slots-invalid", `${assetsPath}.sponsorSlots must be an object.`);
      return;
    }

    Object.entries(assets.sponsorSlots).forEach(([slot, value]) => {
      const valuePath = `${assetsPath}.sponsorSlots.${slot}`;
      validateSponsorSlotKey(slot, valuePath, issues);

      if (value === undefined) {
        return;
      }

      if (typeof value !== "string") {
        addIssue(issues, valuePath, "theme-sponsor-slot-asset-invalid", `${valuePath} must be a string asset reference.`);
        return;
      }

      const result = resolveThemeAssetPath(value, { path: valuePath });
      if (!result.ok) {
        issues.push(...result.error.issues);
      }
    });
  }
}

function validateUnsafeKeys(
  value: unknown,
  path: string,
  issues: ThemeValidationIssue[]
): void {
  if (!isRecord(value)) {
    return;
  }

  Object.entries(value).forEach(([key, childValue]) => {
    const keyPath = `${path}.${key}`;
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.includes("script") ||
      normalizedKey.includes("html") ||
      normalizedKey === "cssurl" ||
      normalizedKey === "fonturl" ||
      normalizedKey === "remoteurl" ||
      normalizedKey.startsWith("on")
    ) {
      addIssue(issues, keyPath, "theme-unsafe-field", `${keyPath} is not a supported theme field.`);
    }

    validateUnsafeKeys(childValue, keyPath, issues);
  });
}

export function validateThemeConfig(
  themeConfig: unknown,
  options: ThemeValidationOptions = {}
): ThemeValidationResult {
  const path = options.path ?? "theme";
  const required = options.allowPartial !== true;
  const issues: ThemeValidationIssue[] = [];

  if (!isRecord(themeConfig)) {
    addIssue(issues, path, "theme-required-object", `${path} must be a theme config object.`);
    return { valid: false, issues };
  }

  validateUnsafeKeys(themeConfig, path, issues);
  validateStringField(themeConfig, "id", `${path}.id`, issues, { required });
  validateStringField(themeConfig, "name", `${path}.name`, issues, { required });
  validateStringField(themeConfig, "version", `${path}.version`, issues, { required });
  validateStringField(themeConfig, "gameCode", `${path}.gameCode`, issues, { required: false });
  validateColorFields(themeConfig, path, required, issues);
  validateTypographyFields(themeConfig, path, required, issues);
  validateLayoutFields(themeConfig, path, required, issues);
  validateSpacingFields(themeConfig, path, issues);
  validateAssetsFields(themeConfig, path, required, issues);

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues
  };
}

export function loadThemeConfig(
  themeConfig: unknown,
  options: ThemeValidationOptions = {}
): ThemeEngineResult<ResolvedThemeConfig> {
  const validation = validateThemeConfig(themeConfig, options);

  if (!validation.valid) {
    return {
      ok: false,
      error: {
        code: "theme-config-invalid",
        message: "Theme config failed validation.",
        issues: validation.issues
      }
    };
  }

  return {
    ok: true,
    value: mergeThemeWithDefaults(themeConfig as ThemeConfigOverride)
  };
}

