import type {
  GameCode,
  SponsorSlot,
  ThemeAssetConfig,
  ThemeColorConfig,
  ThemeConfig,
  ThemeLayoutConfig,
  ThemeTypographyConfig
} from "@mmbt/shared-types";

export type ThemeValidationSeverity = "error" | "warning";

export interface ThemeValidationIssue {
  path: string;
  code: string;
  message: string;
  severity: ThemeValidationSeverity;
}

export interface ThemeValidationResult {
  valid: boolean;
  issues: ThemeValidationIssue[];
}

export interface ThemeEngineError {
  code: string;
  message: string;
  issues: ThemeValidationIssue[];
}

export type ThemeEngineResult<TValue> =
  | {
      ok: true;
      value: TValue;
      error?: undefined;
    }
  | {
      ok: false;
      value?: undefined;
      error: ThemeEngineError;
    };

export interface ThemeSpacingConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ResolvedThemeConfig extends ThemeConfig {
  spacing: ThemeSpacingConfig;
}

export type ThemeColorOverride = Partial<ThemeColorConfig>;
export type ThemeTypographyOverride = Partial<ThemeTypographyConfig>;
export type ThemeLayoutOverride = Partial<ThemeLayoutConfig>;
export type ThemeSpacingOverride = Partial<ThemeSpacingConfig>;
export type ThemeAssetOverride = Partial<Omit<ThemeAssetConfig, "sponsorSlots">> & {
  sponsorSlots?: Partial<Record<SponsorSlot, string | undefined>>;
};

export interface ThemeConfigOverride {
  id?: string;
  name?: string;
  version?: string;
  gameCode?: GameCode;
  colors?: ThemeColorOverride;
  typography?: ThemeTypographyOverride;
  layout?: ThemeLayoutOverride;
  spacing?: ThemeSpacingOverride;
  assets?: ThemeAssetOverride;
}

export interface ThemeValidationOptions {
  path?: string;
  allowPartial?: boolean;
}

export type ThemeAssetReferenceKind = "asset-id" | "local-path";

export interface ResolvedThemeAssetPath {
  reference: string;
  kind: ThemeAssetReferenceKind;
}

export interface ThemeAssetResolutionOptions {
  path?: string;
}

