import type { Hero, JsonObject, JsonValue } from "@mmbt/shared-types";

import {
  LOL_GENERATED_CHAMPION_RECORDS,
  LOL_GENERATED_CHAMPION_SOURCE,
  type LoLGeneratedChampionRecord
} from "./generated-champions.js";

export const LOL_SAMPLE_GAME_CODE = "lol" as const;
export const LOL_SAMPLE_DISPLAY_NAME = "LoL Local Static Roster" as const;
export const LOL_SAMPLE_ENTITY_TYPE = "champion" as const;
export const LOL_SAMPLE_DATA_SOURCE = "local-static-data-dragon-import" as const;
export const LOL_CHAMPION_ICON_ASSET_BASE_PATH = "assets/hero-icons/lol" as const;
export const LOL_CHAMPION_FALLBACK_ICON_PATH = "assets/fallbacks/hero-icon.svg" as const;

export const LOL_SAMPLE_ADAPTER_METADATA = Object.freeze({
  gameCode: LOL_SAMPLE_GAME_CODE,
  displayName: LOL_SAMPLE_DISPLAY_NAME,
  version: "0.1.0",
  mode: "static-manual-roster",
  dataSource: LOL_SAMPLE_DATA_SOURCE,
  dataDragonVersion: LOL_GENERATED_CHAMPION_SOURCE.dataDragonVersion,
  localIconPathConvention: LOL_GENERATED_CHAMPION_SOURCE.localIconPathConvention,
  approvedArtworkIncluded: LOL_GENERATED_CHAMPION_SOURCE.approvedArtworkIncluded
});

function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneJsonValue(item)])
    ) as JsonObject;
  }

  return value;
}

function cloneJsonObject(value: JsonObject | undefined): JsonObject | undefined {
  return value === undefined ? undefined : (cloneJsonValue(value) as JsonObject);
}

function cloneStringRecord(
  value: Record<string, string> | undefined
): Record<string, string> | undefined {
  return value === undefined ? undefined : { ...value };
}

function normalizeRoleTags(roleTags: readonly string[] | undefined): string[] | undefined {
  const normalized = (roleTags ?? [])
    .map((roleTag) => roleTag.trim())
    .filter((roleTag) => roleTag.length > 0);

  return normalized.length > 0 ? normalized : undefined;
}

export function cloneLoLSampleChampion(champion: Hero): Hero {
  return {
    ...champion,
    localizedNames: cloneStringRecord(champion.localizedNames),
    roleTags: champion.roleTags ? [...champion.roleTags] : undefined,
    metadata: cloneJsonObject(champion.metadata)
  };
}

export function normalizeLoLSampleChampion(champion: Hero): Hero {
  return {
    ...champion,
    id: champion.id.trim(),
    gameCode: champion.gameCode.trim(),
    displayName: champion.displayName.trim(),
    localizedNames: cloneStringRecord(champion.localizedNames),
    roleTags: normalizeRoleTags(champion.roleTags),
    iconUrl: champion.iconUrl?.trim(),
    splashUrl: champion.splashUrl?.trim(),
    squareUrl: champion.squareUrl?.trim(),
    metadata: cloneJsonObject(champion.metadata)
  };
}

function slugifyChampionName(displayName: string): string {
  return displayName
    .normalize("NFKD")
    .replace(/['.]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLocaleLowerCase();
}

function createChampionInitials(displayName: string): string {
  const initials = displayName
    .replace(/['.]/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || displayName.slice(0, 2).toUpperCase();
}

function createSearchAliases(record: LoLGeneratedChampionRecord, slug: string): string[] {
  const aliases = new Set<string>([
    record.dataDragonId,
    record.dataDragonId.toLocaleLowerCase(),
    record.displayName,
    slug,
    slug.replace(/-/g, " ")
  ]);

  if (record.displayName === "Wukong") {
    aliases.add("MonkeyKing");
    aliases.add("monkey king");
  }

  if (record.displayName === "Nunu & Willump") {
    aliases.add("Nunu");
    aliases.add("Willump");
  }

  if (record.displayName === "Dr. Mundo") {
    aliases.add("Mundo");
  }

  if (record.displayName === "Miss Fortune") {
    aliases.add("MF");
  }

  if (record.displayName === "Twisted Fate") {
    aliases.add("TF");
  }

  if (record.displayName === "Jarvan IV") {
    aliases.add("Jarvan 4");
  }

  if (record.displayName === "Renata Glasc") {
    aliases.add("Renata");
  }

  return [...aliases].filter((alias) => alias.trim().length > 0);
}

function createChampion(record: LoLGeneratedChampionRecord): Hero {
  const slug = slugifyChampionName(record.displayName);
  const id = `lol-${slug}`;
  const localIconPath = `${LOL_CHAMPION_ICON_ASSET_BASE_PATH}/${record.dataDragonId}.png`;

  return {
    id,
    gameCode: LOL_SAMPLE_GAME_CODE,
    displayName: record.displayName,
    localizedNames: record.localizedNames ? { ...record.localizedNames } : undefined,
    roleTags: [...record.tags],
    iconUrl: localIconPath,
    squareUrl: localIconPath,
    metadata: {
      entityType: LOL_SAMPLE_ENTITY_TYPE,
      dataSource: LOL_SAMPLE_DATA_SOURCE,
      dataDragonId: record.dataDragonId,
      dataDragonKey: record.riotKey,
      dataDragonVersion: LOL_GENERATED_CHAMPION_SOURCE.dataDragonVersion,
      normalizedKey: slug,
      searchAliases: createSearchAliases(record, slug),
      localIconPath,
      fallbackIconPath: LOL_CHAMPION_FALLBACK_ICON_PATH,
      fallbackLabel: createChampionInitials(record.displayName),
      approvedArtworkIncluded: LOL_GENERATED_CHAMPION_SOURCE.approvedArtworkIncluded,
      imageState: LOL_GENERATED_CHAMPION_SOURCE.approvedArtworkIncluded
        ? "local-artwork-expected"
        : "local-artwork-not-packaged"
    }
  };
}

const rawLoLSampleChampions = LOL_GENERATED_CHAMPION_RECORDS.map((record) =>
  createChampion(record)
) satisfies readonly Hero[];

export const LOL_SAMPLE_CHAMPIONS: readonly Hero[] = Object.freeze(
  rawLoLSampleChampions.map((champion) => Object.freeze(normalizeLoLSampleChampion(champion)))
);
