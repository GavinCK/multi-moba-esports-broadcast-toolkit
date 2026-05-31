import { describe, expect, it } from "vitest";

import {
  createDefaultThemeConfig,
  isLocalThemeAssetReference,
  loadThemeConfig,
  mergeThemeWithDefaults,
  resolveThemeAssetPath,
  validateThemeConfig
} from "./index";
import type { ThemeConfigOverride } from "./index";

const validTheme = {
  id: "event-theme",
  name: "Event Theme",
  version: "0.1.0",
  colors: {
    background: "#000000",
    primary: "#ffffff",
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
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40
  },
  assets: {
    background: "assets/backgrounds/default-background.svg",
    frame: "assets/frames/default-frame.svg",
    sponsorFrame: "assets/frames/sponsor-frame.svg",
    sponsorSlots: {
      DRAFT: "assets/sponsor-logos/draft-sponsor.svg",
      SCORE_BUG: "score_bug_sponsor"
    }
  }
} satisfies ThemeConfigOverride;

describe("theme engine", () => {
  it("accepts a valid local-first theme config", () => {
    const result = validateThemeConfig(validTheme);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects invalid theme config values with explicit issues", () => {
    const result = validateThemeConfig({
      ...validTheme,
      colors: {
        ...validTheme.colors,
        accent: "gold"
      },
      layout: {
        ...validTheme.layout,
        safeMarginPx: 240
      }
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["theme-color-invalid", "theme-number-out-of-range"])
    );
  });

  it("generates a complete default theme without shared object references", () => {
    const first = createDefaultThemeConfig();
    const second = createDefaultThemeConfig();

    expect(first.id).toBe("default-theme");
    expect(first.layout.safeMarginPx).toBe(64);
    expect(first.spacing.md).toBe(16);
    expect(first).not.toBe(second);
    expect(first.colors).not.toBe(second.colors);
    expect(first.spacing).not.toBe(second.spacing);
  });

  it("merges partial overrides while preserving default fallbacks", () => {
    const merged = mergeThemeWithDefaults({
      id: "client-night",
      colors: {
        accent: "#22c55e"
      },
      spacing: {
        lg: 32
      },
      assets: {
        sponsorSlots: {
          DRAFT: "draft_sponsor"
        }
      }
    });

    expect(merged.id).toBe("client-night");
    expect(merged.colors.accent).toBe("#22c55e");
    expect(merged.colors.blueTeam).toBe("#2563eb");
    expect(merged.spacing.lg).toBe(32);
    expect(merged.spacing.md).toBe(16);
    expect(merged.assets.sponsorSlots?.DRAFT).toBe("draft_sponsor");
  });

  it("rejects external asset references without performing lookup", () => {
    const remoteReference = ["https", "://example.test/logo.svg"].join("");
    const result = validateThemeConfig({
      ...validTheme,
      assets: {
        background: remoteReference
      }
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("theme-asset-external");
  });

  it("accepts local asset references and asset IDs", () => {
    const localPath = resolveThemeAssetPath("assets/frames/default-frame.svg");
    const assetId = resolveThemeAssetPath("sponsor_presented-by");

    expect(localPath.ok).toBe(true);
    expect(localPath.ok ? localPath.value.kind : undefined).toBe("local-path");
    expect(assetId.ok).toBe(true);
    expect(assetId.ok ? assetId.value.kind : undefined).toBe("asset-id");
    expect(isLocalThemeAssetReference("assets/team-logos/blue-meteors.svg")).toBe(true);
  });

  it("does not mutate input objects when loading or merging", () => {
    const override = {
      colors: {
        accent: "#38bdf8"
      },
      typography: {
        headingFont: "Arial"
      },
      assets: {
        sponsorSlots: {
          PRESENTED_BY: "assets/sponsor-logos/presented-by.svg"
        }
      }
    } satisfies ThemeConfigOverride;
    const snapshot = structuredClone(override);

    const merged = mergeThemeWithDefaults(override);
    const loaded = loadThemeConfig(override, { allowPartial: true });

    expect(override).toEqual(snapshot);
    expect(merged.colors).not.toBe(override.colors);
    expect(merged.typography).not.toBe(override.typography);
    expect(loaded.ok).toBe(true);
    expect(override).toEqual(snapshot);
  });
});
