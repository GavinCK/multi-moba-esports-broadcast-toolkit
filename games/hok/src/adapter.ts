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
  HOK_SAMPLE_DISPLAY_NAME,
  HOK_SAMPLE_GAME_CODE,
  HOK_SAMPLE_HEROES,
  cloneHokSampleHero
} from "./data.js";
import { getHokSampleDefaultRulesets } from "./rulesets.js";
import { validateHokSampleDraftAction } from "./validation.js";

export const HOK_SAMPLE_SUPPORTED_DRAFT_MODES = ["manual-static-global-bp-5v5"] as const;

const HERO_ASSET_FALLBACKS: Record<"HERO_ICON" | "HERO_SPLASH" | "HERO_SQUARE", string> = {
  HERO_ICON: "assets/hok-sample/fallbacks/hero-icon.svg",
  HERO_SPLASH: "assets/hok-sample/fallbacks/hero-splash.svg",
  HERO_SQUARE: "assets/hok-sample/fallbacks/hero-square.svg"
};

function findHokSampleHero(heroId: string): Hero | null {
  const normalizedHeroId = heroId.trim();
  const hero = HOK_SAMPLE_HEROES.find((item) => item.id === normalizedHeroId);

  return hero ? cloneHokSampleHero(hero) : null;
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
        reason: "HoK sample adapter validation failed.",
        issues: [...issues]
      };
}

function validateDraftActionForAdapter(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  return createValidationResult(validateHokSampleDraftAction(state, action).issues ?? []);
}

function getHeroAssetUrl(assetType: GameAssetType, id: string): string | null {
  if (assetType !== "HERO_ICON" && assetType !== "HERO_SPLASH" && assetType !== "HERO_SQUARE") {
    return null;
  }

  const hero = findHokSampleHero(id);

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

export const hokSampleAdapter: GameAdapter = Object.freeze({
  gameCode: HOK_SAMPLE_GAME_CODE,
  displayName: HOK_SAMPLE_DISPLAY_NAME,
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
    return HOK_SAMPLE_HEROES.map((hero) => cloneHokSampleHero(hero));
  },
  async loadDefaultRulesets() {
    return getHokSampleDefaultRulesets();
  },
  getHeroById(heroId: string): Hero | null {
    return findHokSampleHero(heroId);
  },
  searchHeroes(query: string): Hero[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery.length === 0) {
      return HOK_SAMPLE_HEROES.map((hero) => cloneHokSampleHero(hero));
    }

    return HOK_SAMPLE_HEROES.filter((hero) =>
      searchableValues(hero).some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
    ).map((hero) => cloneHokSampleHero(hero));
  },
  validateDraftAction: validateDraftActionForAdapter,
  getAssetUrl: getHeroAssetUrl
});
