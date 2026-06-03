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
  LOL_SAMPLE_GAME_CODE,
  LOL_CHAMPION_FALLBACK_ICON_PATH
} from "./data.js";
import { getLoLSampleDefaultRulesets } from "./rulesets.js";
import { validateLoLSampleDraftAction } from "./validation.js";

export const LOL_SAMPLE_SUPPORTED_DRAFT_MODES = ["manual-static-standard-5v5"] as const;

const CHAMPION_ASSET_FALLBACKS: Record<"HERO_ICON" | "HERO_SPLASH" | "HERO_SQUARE", string> = {
  HERO_ICON: LOL_CHAMPION_FALLBACK_ICON_PATH,
  HERO_SPLASH: LOL_CHAMPION_FALLBACK_ICON_PATH,
  HERO_SQUARE: LOL_CHAMPION_FALLBACK_ICON_PATH
};

const ROMAN_TO_NUMBER = new Map<string, string>([
  ["i", "1"],
  ["ii", "2"],
  ["iii", "3"],
  ["iv", "4"],
  ["v", "5"],
  ["vi", "6"],
  ["vii", "7"],
  ["viii", "8"],
  ["ix", "9"],
  ["x", "10"]
]);

const NUMBER_TO_ROMAN = new Map(Array.from(ROMAN_TO_NUMBER, ([roman, number]) => [number, roman]));

function findLoLSampleChampion(championId: string): Hero | null {
  const normalizedChampionId = championId.trim();
  const champion = LOL_SAMPLE_CHAMPIONS.find((item) => item.id === normalizedChampionId);

  return champion ? cloneLoLSampleChampion(champion) : null;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['\u2019`´.]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeLiteralSearchText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function replaceSearchWords(value: string, replacements: Map<string, string>): string {
  return value
    .split(" ")
    .map((part) => replacements.get(part) ?? part)
    .join(" ");
}

function createSearchVariants(value: string): string[] {
  const normalized = normalizeSearchText(value);
  const literal = normalizeLiteralSearchText(value);
  const variants = new Set<string>();

  if (literal) {
    variants.add(literal);
    variants.add(literal.replace(/\s+/g, ""));
  }

  if (!normalized) {
    return [...variants].filter((variant) => variant.length > 0);
  }

  variants.add(normalized);
  variants.add(normalized.replace(/\s+/g, ""));
  const withoutAnd = normalized.replace(/\band\b/g, " ").replace(/\s+/g, " ").trim();
  const romanAsNumbers = replaceSearchWords(normalized, ROMAN_TO_NUMBER);
  const numbersAsRoman = replaceSearchWords(normalized, NUMBER_TO_ROMAN);

  if (withoutAnd) {
    variants.add(withoutAnd);
    variants.add(withoutAnd.replace(/\s+/g, ""));
  }

  variants.add(romanAsNumbers);
  variants.add(romanAsNumbers.replace(/\s+/g, ""));
  variants.add(numbersAsRoman);
  variants.add(numbersAsRoman.replace(/\s+/g, ""));

  return [...variants].filter((variant) => variant.length > 0);
}

function searchableValues(champion: Hero): string[] {
  const aliases = Array.isArray(champion.metadata?.searchAliases)
    ? champion.metadata.searchAliases.filter((value): value is string => typeof value === "string")
    : [];
  const metadataValues = [
    champion.metadata?.dataDragonId,
    champion.metadata?.dataDragonKey,
    champion.metadata?.normalizedKey
  ].filter((value): value is string => typeof value === "string");

  return [
    champion.id,
    champion.displayName,
    ...Object.values(champion.localizedNames ?? {}),
    ...(champion.roleTags ?? []),
    ...aliases,
    ...metadataValues
  ];
}

function matchesChampionSearch(champion: Hero, queryVariants: readonly string[]): boolean {
  const championVariants = searchableValues(champion).flatMap((value) => createSearchVariants(value));

  return queryVariants.some((queryVariant) =>
    championVariants.some((championVariant) => championVariant.includes(queryVariant))
  );
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
    const queryVariants = createSearchVariants(query);

    if (queryVariants.length === 0) {
      return LOL_SAMPLE_CHAMPIONS.map((champion) => cloneLoLSampleChampion(champion));
    }

    return LOL_SAMPLE_CHAMPIONS.filter((champion) => matchesChampionSearch(champion, queryVariants)).map(
      (champion) => cloneLoLSampleChampion(champion)
    );
  },
  validateDraftAction: validateDraftActionForAdapter,
  getAssetUrl: getChampionAssetUrl
});
