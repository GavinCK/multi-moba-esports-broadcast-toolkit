import type {
  DraftAction,
  DraftState,
  DraftValidationIssue,
  DraftValidationResult,
  GameAdapter,
  GameAssetType,
  Hero
} from "@mmbt/shared-types";

import {
  AOV_SAMPLE_DISPLAY_NAME,
  AOV_SAMPLE_GAME_CODE,
  AOV_SAMPLE_HEROES,
  cloneAovSampleHero
} from "./data.js";
import { getAovSampleDefaultRulesets } from "./rulesets.js";
import { validateAovSampleDraftAction } from "./validation.js";

export const AOV_SAMPLE_SUPPORTED_DRAFT_MODES = ["manual-static-standard-5v5"] as const;

const HERO_ASSET_FALLBACKS: Record<"HERO_ICON" | "HERO_SPLASH" | "HERO_SQUARE", string> = {
  HERO_ICON: "assets/aov-sample/fallbacks/hero-icon.svg",
  HERO_SPLASH: "assets/aov-sample/fallbacks/hero-splash.svg",
  HERO_SQUARE: "assets/aov-sample/fallbacks/hero-square.svg"
};

function findAovSampleHero(heroId: string): Hero | null {
  const normalizedHeroId = heroId.trim();
  const hero = AOV_SAMPLE_HEROES.find((item) => item.id === normalizedHeroId);

  return hero ? cloneAovSampleHero(hero) : null;
}

function searchableValues(hero: Hero): string[] {
  return [
    hero.id,
    hero.displayName,
    ...Object.values(hero.localizedNames ?? {}),
    ...(hero.roleTags ?? [])
  ];
}

function createValidationResult(issues: readonly DraftValidationIssue[]): DraftValidationResult {
  return issues.length === 0
    ? { valid: true }
    : {
        valid: false,
        reason: "AOV sample adapter validation failed.",
        issues: [...issues]
      };
}

function validateDraftActionForAdapter(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  return createValidationResult(validateAovSampleDraftAction(state, action).issues ?? []);
}

function getHeroAssetUrl(assetType: GameAssetType, id: string): string | null {
  if (assetType !== "HERO_ICON" && assetType !== "HERO_SPLASH" && assetType !== "HERO_SQUARE") {
    return null;
  }

  const hero = findAovSampleHero(id);

  if (!hero) {
    return HERO_ASSET_FALLBACKS[assetType];
  }

  if (assetType === "HERO_ICON") {
    return hero.iconUrl ?? HERO_ASSET_FALLBACKS.HERO_ICON;
  }

  if (assetType === "HERO_SPLASH") {
    return hero.splashUrl ?? HERO_ASSET_FALLBACKS.HERO_SPLASH;
  }

  return hero.squareUrl ?? HERO_ASSET_FALLBACKS.HERO_SQUARE;
}

export const aovSampleAdapter: GameAdapter = Object.freeze({
  gameCode: AOV_SAMPLE_GAME_CODE,
  displayName: AOV_SAMPLE_DISPLAY_NAME,
  version: "0.1.0",
  capabilities: Object.freeze({
    supportsManualDraft: true,
    supportsClientReader: false,
    supportsIngameHud: false,
    supportsPostGameStats: false,
    supportsAssetSync: false,
    supportsLocalization: true,
    supportsCustomRulesets: true
  }),
  async loadHeroes(): Promise<Hero[]> {
    return AOV_SAMPLE_HEROES.map((hero) => cloneAovSampleHero(hero));
  },
  async loadDefaultRulesets() {
    return getAovSampleDefaultRulesets();
  },
  getHeroById(heroId: string): Hero | null {
    return findAovSampleHero(heroId);
  },
  searchHeroes(query: string): Hero[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery.length === 0) {
      return AOV_SAMPLE_HEROES.map((hero) => cloneAovSampleHero(hero));
    }

    return AOV_SAMPLE_HEROES.filter((hero) =>
      searchableValues(hero).some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
    ).map((hero) => cloneAovSampleHero(hero));
  },
  validateDraftAction: validateDraftActionForAdapter,
  getAssetUrl: getHeroAssetUrl
});
