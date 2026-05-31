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
  cloneLoLSampleChampion,
  LOL_SAMPLE_CHAMPIONS,
  LOL_SAMPLE_DISPLAY_NAME,
  LOL_SAMPLE_GAME_CODE
} from "./data.js";
import { getLoLSampleDefaultRulesets } from "./rulesets.js";
import { validateLoLSampleDraftAction } from "./validation.js";

export const LOL_SAMPLE_SUPPORTED_DRAFT_MODES = ["manual-static-standard-5v5"] as const;

const CHAMPION_ASSET_FALLBACKS: Record<"HERO_ICON" | "HERO_SPLASH" | "HERO_SQUARE", string> = {
  HERO_ICON: "assets/lol-sample/fallbacks/champion-icon.svg",
  HERO_SPLASH: "assets/lol-sample/fallbacks/champion-splash.svg",
  HERO_SQUARE: "assets/lol-sample/fallbacks/champion-square.svg"
};

function findLoLSampleChampion(championId: string): Hero | null {
  const normalizedChampionId = championId.trim();
  const champion = LOL_SAMPLE_CHAMPIONS.find((item) => item.id === normalizedChampionId);

  return champion ? cloneLoLSampleChampion(champion) : null;
}

function searchableValues(champion: Hero): string[] {
  return [
    champion.id,
    champion.displayName,
    ...Object.values(champion.localizedNames ?? {}),
    ...(champion.roleTags ?? [])
  ];
}

function createValidationResult(issues: readonly DraftValidationIssue[]): DraftValidationResult {
  return issues.length === 0
    ? { valid: true }
    : {
        valid: false,
        reason: "LoL sample adapter validation failed.",
        issues: [...issues]
      };
}

function validateDraftActionForAdapter(
  state: DraftState,
  action: DraftAction
): DraftValidationResult {
  return createValidationResult(validateLoLSampleDraftAction(state, action).issues ?? []);
}

function getChampionAssetUrl(assetType: GameAssetType, id: string): string | null {
  if (assetType !== "HERO_ICON" && assetType !== "HERO_SPLASH" && assetType !== "HERO_SQUARE") {
    return null;
  }

  const champion = findLoLSampleChampion(id);

  if (!champion) {
    return CHAMPION_ASSET_FALLBACKS[assetType];
  }

  if (assetType === "HERO_ICON") {
    return champion.iconUrl ?? CHAMPION_ASSET_FALLBACKS.HERO_ICON;
  }

  if (assetType === "HERO_SPLASH") {
    return champion.splashUrl ?? CHAMPION_ASSET_FALLBACKS.HERO_SPLASH;
  }

  return champion.squareUrl ?? CHAMPION_ASSET_FALLBACKS.HERO_SQUARE;
}

export const lolSampleAdapter: GameAdapter = Object.freeze({
  gameCode: LOL_SAMPLE_GAME_CODE,
  displayName: LOL_SAMPLE_DISPLAY_NAME,
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
    return LOL_SAMPLE_CHAMPIONS.map((champion) => cloneLoLSampleChampion(champion));
  },
  async loadDefaultRulesets() {
    return getLoLSampleDefaultRulesets();
  },
  getHeroById(championId: string): Hero | null {
    return findLoLSampleChampion(championId);
  },
  searchHeroes(query: string): Hero[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery.length === 0) {
      return LOL_SAMPLE_CHAMPIONS.map((champion) => cloneLoLSampleChampion(champion));
    }

    return LOL_SAMPLE_CHAMPIONS.filter((champion) =>
      searchableValues(champion).some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
    ).map((champion) => cloneLoLSampleChampion(champion));
  },
  validateDraftAction: validateDraftActionForAdapter,
  getAssetUrl: getChampionAssetUrl
});
