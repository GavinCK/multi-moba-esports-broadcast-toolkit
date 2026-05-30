import type { GameCode, SponsorSlot } from "./match";

export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  gameCode?: GameCode;
  colors: ThemeColorConfig;
  typography: ThemeTypographyConfig;
  layout: ThemeLayoutConfig;
  assets: ThemeAssetConfig;
}

export interface ThemeColorConfig {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  blueTeam: string;
  redTeam: string;
  textPrimary: string;
  textSecondary: string;
}

export interface ThemeTypographyConfig {
  headingFont: string;
  bodyFont: string;
  numberFont?: string;
}

export interface ThemeLayoutConfig {
  safeMarginPx: number;
  borderRadiusPx: number;
  animationSpeedMs: number;
}

export interface ThemeAssetConfig {
  background?: string;
  frame?: string;
  sponsorFrame?: string;
  sponsorSlots?: Partial<Record<SponsorSlot, string>>;
}
