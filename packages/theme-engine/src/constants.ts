import type { ResolvedThemeConfig, ThemeSpacingConfig } from "./types";

export const THEME_COLOR_KEYS = [
  "background",
  "primary",
  "secondary",
  "accent",
  "blueTeam",
  "redTeam",
  "textPrimary",
  "textSecondary"
] as const;

export const THEME_TYPOGRAPHY_KEYS = [
  "headingFont",
  "bodyFont",
  "numberFont"
] as const;

export const THEME_LAYOUT_KEYS = [
  "safeMarginPx",
  "borderRadiusPx",
  "animationSpeedMs"
] as const;

export const THEME_SPACING_KEYS = ["xs", "sm", "md", "lg", "xl"] as const;

export const THEME_ASSET_KEYS = [
  "background",
  "frame",
  "sponsorFrame"
] as const;

export const SPONSOR_SLOT_KEYS = [
  "PRESENTED_BY",
  "DRAFT",
  "SCORE_BUG",
  "LOWER_THIRD",
  "REPLAY",
  "OBJECTIVE",
  "MVP",
  "BREAK_SCREEN"
] as const;

export const DEFAULT_THEME_SPACING: ThemeSpacingConfig = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40
};

export const DEFAULT_THEME_CONFIG: ResolvedThemeConfig = {
  id: "default-theme",
  name: "Default Local Theme",
  version: "0.1.0",
  colors: {
    background: "transparent",
    primary: "#f8fafc",
    secondary: "#94a3b8",
    accent: "#facc15",
    blueTeam: "#2563eb",
    redTeam: "#dc2626",
    textPrimary: "#ffffff",
    textSecondary: "#d4d4d8"
  },
  typography: {
    headingFont: "system-ui, sans-serif",
    bodyFont: "system-ui, sans-serif",
    numberFont: "system-ui, sans-serif"
  },
  layout: {
    safeMarginPx: 64,
    borderRadiusPx: 16,
    animationSpeedMs: 300
  },
  spacing: DEFAULT_THEME_SPACING,
  assets: {}
};

export const THEME_LAYOUT_LIMITS = {
  safeMarginPx: { min: 0, max: 200 },
  borderRadiusPx: { min: 0, max: 80 },
  animationSpeedMs: { min: 0, max: 3000 }
} as const;

export const THEME_SPACING_LIMITS = {
  min: 0,
  max: 200
} as const;

