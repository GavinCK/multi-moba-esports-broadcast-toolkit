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
  cloneHero,
  GENERIC_MOBA_DISPLAY_NAME,
  GENERIC_MOBA_GAME_CODE,
  GENERIC_MOBA_HEROES
} from "./data.js";
import { getGenericMobaDefaultRulesets } from "./rulesets.js";
import { validateGenericMobaDraftAction } from "./validation.js";

export const GENERIC_MOBA_SUPPORTED_DRAFT_MODES = ["manual-standard-5v5"] as const;

const HERO_ASSET_FALLBACKS: Record<"HERO_ICON" | "HERO_SPLASH" | "HERO_SQUARE", string> = {
  HERO_ICON: "assets/generic-moba/fallbacks/hero-icon.svg",
  HERO_SPLASH: "assets/generic-moba/fallbacks/hero-splash.svg",
  HERO_SQUARE: "assets/generic-moba/fallbacks/hero-square.svg"
};

function findGenericMobaHero(heroId: string): Hero | null {
  const normalizedHeroId = heroId.trim();
  const hero = GENERIC_MOBA_HEROES.find((item) => item.id === normalizedHeroId);

  return hero ? cloneHero(hero) : null;
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
        reason: "Generic MOBA adapter validation failed.",
        issues: [...issues]
      };
}

function validateDraftActionForAdapter(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  return createValidationResult(validateGenericMobaDraftAction(state, action).issues ?? []);
}

function getHeroAssetUrl(assetType: GameAssetType, id: string): string | null {
  if (assetType !== "HERO_ICON" && assetType !== "HERO_SPLASH" && assetType !== "HERO_SQUARE") {
    return null;
  }

  const hero = findGenericMobaHero(id);

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

export const genericMobaAdapter: GameAdapter = Object.freeze({
  gameCode: GENERIC_MOBA_GAME_CODE,
  displayName: GENERIC_MOBA_DISPLAY_NAME,
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
    return GENERIC_MOBA_HEROES.map((hero) => cloneHero(hero));
  },
  async loadDefaultRulesets() {
    return getGenericMobaDefaultRulesets();
  },
  getHeroById(heroId: string): Hero | null {
    return findGenericMobaHero(heroId);
  },
  searchHeroes(query: string): Hero[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery.length === 0) {
      return GENERIC_MOBA_HEROES.map((hero) => cloneHero(hero));
    }

    return GENERIC_MOBA_HEROES.filter((hero) =>
      searchableValues(hero).some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
    ).map((hero) => cloneHero(hero));
  },
  validateDraftAction: validateDraftActionForAdapter,
  getAssetUrl: getHeroAssetUrl
});
