import type { Hero, JsonObject, JsonValue } from "@mmbt/shared-types";

export const AOV_SAMPLE_GAME_CODE = "aov" as const;
export const AOV_SAMPLE_DISPLAY_NAME = "AOV Static Manual Sample" as const;
export const AOV_SAMPLE_ENTITY_TYPE = "hero" as const;
export const AOV_SAMPLE_DATA_SOURCE = "local-static-sample" as const;

export const AOV_SAMPLE_ADAPTER_METADATA = Object.freeze({
  gameCode: AOV_SAMPLE_GAME_CODE,
  displayName: AOV_SAMPLE_DISPLAY_NAME,
  version: "0.1.0",
  mode: "static-manual-sample",
  dataSource: AOV_SAMPLE_DATA_SOURCE
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

export function cloneAovSampleHero(hero: Hero): Hero {
  return {
    ...hero,
    localizedNames: cloneStringRecord(hero.localizedNames),
    roleTags: hero.roleTags ? [...hero.roleTags] : undefined,
    metadata: cloneJsonObject(hero.metadata)
  };
}

export function normalizeAovSampleHero(hero: Hero): Hero {
  return {
    ...hero,
    id: hero.id.trim(),
    gameCode: hero.gameCode.trim(),
    displayName: hero.displayName.trim(),
    localizedNames: cloneStringRecord(hero.localizedNames),
    roleTags: normalizeRoleTags(hero.roleTags),
    iconUrl: hero.iconUrl?.trim(),
    splashUrl: hero.splashUrl?.trim(),
    squareUrl: hero.squareUrl?.trim(),
    metadata: cloneJsonObject(hero.metadata)
  };
}

function createSampleHero(slug: string, displayName: string, roleTags: readonly string[]): Hero {
  const id = `aov-${slug}`;

  return {
    id,
    gameCode: AOV_SAMPLE_GAME_CODE,
    displayName,
    roleTags: [...roleTags],
    iconUrl: `assets/aov-sample/hero-icons/${id}.svg`,
    splashUrl: `assets/aov-sample/hero-splashes/${id}.svg`,
    squareUrl: `assets/aov-sample/hero-squares/${id}.svg`,
    metadata: {
      entityType: AOV_SAMPLE_ENTITY_TYPE,
      sampleOnly: true,
      dataSource: AOV_SAMPLE_DATA_SOURCE
    }
  };
}

const rawAovSampleHeroes = [
  createSampleHero("valhein", "Valhein", ["Marksman", "Abyssal Dragon Lane"]),
  createSampleHero("krixi", "Krixi", ["Mage", "Mid"]),
  createSampleHero("maloch", "Maloch", ["Warrior", "Dark Slayer Lane"]),
  createSampleHero("violet", "Violet", ["Marksman", "Carry"]),
  createSampleHero("zephys", "Zephys", ["Warrior", "Jungle"]),
  createSampleHero("alice", "Alice", ["Support", "Control"]),
  createSampleHero("nakroth", "Nakroth", ["Assassin", "Jungle"]),
  createSampleHero("toro", "Toro", ["Tank", "Support"]),
  createSampleHero("mganga", "Mganga", ["Mage", "Sustain"]),
  createSampleHero("yorn", "Yorn", ["Marksman", "Damage"]),
  createSampleHero("butterfly", "Butterfly", ["Assassin", "Jungle"]),
  createSampleHero("thane", "Thane", ["Tank", "Support"]),
  createSampleHero("raz", "Raz", ["Mage", "Burst"]),
  createSampleHero("murad", "Murad", ["Assassin", "Jungle"]),
  createSampleHero("liliana", "Liliana", ["Mage", "Poke"]),
  createSampleHero("annette", "Annette", ["Support", "Utility"]),
  createSampleHero("florentino", "Florentino", ["Warrior", "Duelist"]),
  createSampleHero("hayate", "Hayate", ["Marksman", "Mobility"]),
  createSampleHero("enzo", "Enzo", ["Assassin", "Control"]),
  createSampleHero("laville", "Laville", ["Marksman", "Carry"])
] satisfies readonly Hero[];

export const AOV_SAMPLE_HEROES: readonly Hero[] = Object.freeze(
  rawAovSampleHeroes.map((hero) => Object.freeze(normalizeAovSampleHero(hero)))
);
