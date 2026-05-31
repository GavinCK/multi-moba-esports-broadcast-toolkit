import type { Hero, JsonObject, JsonValue } from "@mmbt/shared-types";

export const LOL_SAMPLE_GAME_CODE = "lol" as const;
export const LOL_SAMPLE_DISPLAY_NAME = "LoL Static Manual Sample" as const;
export const LOL_SAMPLE_ENTITY_TYPE = "champion" as const;
export const LOL_SAMPLE_DATA_SOURCE = "local-static-sample" as const;

export const LOL_SAMPLE_ADAPTER_METADATA = Object.freeze({
  gameCode: LOL_SAMPLE_GAME_CODE,
  displayName: LOL_SAMPLE_DISPLAY_NAME,
  version: "0.1.0",
  mode: "static-manual-sample",
  dataSource: LOL_SAMPLE_DATA_SOURCE
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

function createSampleChampion(slug: string, displayName: string, roleTags: readonly string[]): Hero {
  const id = `lol-${slug}`;

  return {
    id,
    gameCode: LOL_SAMPLE_GAME_CODE,
    displayName,
    roleTags: [...roleTags],
    iconUrl: `assets/lol-sample/champion-icons/${id}.svg`,
    splashUrl: `assets/lol-sample/champion-splashes/${id}.svg`,
    squareUrl: `assets/lol-sample/champion-squares/${id}.svg`,
    metadata: {
      entityType: LOL_SAMPLE_ENTITY_TYPE,
      sampleOnly: true,
      dataSource: LOL_SAMPLE_DATA_SOURCE
    }
  };
}

const rawLoLSampleChampions = [
  createSampleChampion("aatrox", "Aatrox", ["Fighter", "Top"]),
  createSampleChampion("ahri", "Ahri", ["Mage", "Mid"]),
  createSampleChampion("akali", "Akali", ["Assassin", "Mid"]),
  createSampleChampion("amumu", "Amumu", ["Tank", "Jungle"]),
  createSampleChampion("annie", "Annie", ["Mage", "Mid"]),
  createSampleChampion("ashe", "Ashe", ["Marksman", "Bot"]),
  createSampleChampion("braum", "Braum", ["Support", "Tank"]),
  createSampleChampion("caitlyn", "Caitlyn", ["Marksman", "Bot"]),
  createSampleChampion("darius", "Darius", ["Fighter", "Top"]),
  createSampleChampion("ezreal", "Ezreal", ["Marksman", "Bot"]),
  createSampleChampion("garen", "Garen", ["Fighter", "Top"]),
  createSampleChampion("jinx", "Jinx", ["Marksman", "Bot"]),
  createSampleChampion("lee-sin", "Lee Sin", ["Fighter", "Jungle"]),
  createSampleChampion("leona", "Leona", ["Support", "Tank"]),
  createSampleChampion("lux", "Lux", ["Mage", "Support"]),
  createSampleChampion("malphite", "Malphite", ["Tank", "Top"]),
  createSampleChampion("miss-fortune", "Miss Fortune", ["Marksman", "Bot"]),
  createSampleChampion("morgana", "Morgana", ["Mage", "Support"]),
  createSampleChampion("orianna", "Orianna", ["Mage", "Mid"]),
  createSampleChampion("thresh", "Thresh", ["Support", "Controller"])
] satisfies readonly Hero[];

export const LOL_SAMPLE_CHAMPIONS: readonly Hero[] = Object.freeze(
  rawLoLSampleChampions.map((champion) => Object.freeze(normalizeLoLSampleChampion(champion)))
);
