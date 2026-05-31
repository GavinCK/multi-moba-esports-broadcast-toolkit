import type { Hero, JsonObject, JsonValue } from "@mmbt/shared-types";

export const HOK_SAMPLE_GAME_CODE = "hok" as const;
export const HOK_SAMPLE_DISPLAY_NAME = "HoK Static Manual Sample" as const;
export const HOK_SAMPLE_ENTITY_TYPE = "hero" as const;
export const HOK_SAMPLE_DATA_SOURCE = "local-static-sample" as const;

export const HOK_SAMPLE_ADAPTER_METADATA = Object.freeze({
  gameCode: HOK_SAMPLE_GAME_CODE,
  displayName: HOK_SAMPLE_DISPLAY_NAME,
  version: "0.1.0",
  mode: "static-manual-sample",
  dataSource: HOK_SAMPLE_DATA_SOURCE
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

export function cloneHokSampleHero(hero: Hero): Hero {
  return {
    ...hero,
    localizedNames: cloneStringRecord(hero.localizedNames),
    roleTags: hero.roleTags ? [...hero.roleTags] : undefined,
    metadata: cloneJsonObject(hero.metadata)
  };
}

export function normalizeHokSampleHero(hero: Hero): Hero {
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
  const id = `hok-${slug}`;

  return {
    id,
    gameCode: HOK_SAMPLE_GAME_CODE,
    displayName,
    roleTags: [...roleTags],
    iconUrl: `assets/hok-sample/hero-icons/${id}.svg`,
    splashUrl: `assets/hok-sample/hero-splashes/${id}.svg`,
    squareUrl: `assets/hok-sample/hero-squares/${id}.svg`,
    metadata: {
      entityType: HOK_SAMPLE_ENTITY_TYPE,
      sampleOnly: true,
      dataSource: HOK_SAMPLE_DATA_SOURCE
    }
  };
}

const rawHokSampleHeroes = [
  createSampleHero("arthur", "Arthur", ["Fighter", "Clash Lane"]),
  createSampleHero("daji", "Daji", ["Mage", "Mid"]),
  createSampleHero("hou-yi", "Hou Yi", ["Marksman", "Farm Lane"]),
  createSampleHero("angela", "Angela", ["Mage", "Burst"]),
  createSampleHero("diaochan", "Diaochan", ["Mage", "Control"]),
  createSampleHero("mulan", "Mulan", ["Fighter", "Duelist"]),
  createSampleHero("li-bai", "Li Bai", ["Assassin", "Jungle"]),
  createSampleHero("luban-no-7", "Luban No. 7", ["Marksman", "Damage"]),
  createSampleHero("sun-shangxiang", "Sun Shangxiang", ["Marksman", "Mobility"]),
  createSampleHero("zhao-yun", "Zhao Yun", ["Fighter", "Jungle"]),
  createSampleHero("zhang-fei", "Zhang Fei", ["Support", "Tank"]),
  createSampleHero("han-xin", "Han Xin", ["Assassin", "Jungle"]),
  createSampleHero("baili-shouyue", "Baili Shouyue", ["Marksman", "Poke"]),
  createSampleHero("gongsun-li", "Gongsun Li", ["Marksman", "Mobility"]),
  createSampleHero("yao", "Yao", ["Support", "Utility"]),
  createSampleHero("ming-shiyin", "Ming Shiyin", ["Support", "Amplifier"]),
  createSampleHero("shangguan-waner", "Shangguan Waner", ["Mage", "Assassin"]),
  createSampleHero("pei-qinhu", "Pei Qinhu", ["Fighter", "Jungle"]),
  createSampleHero("xiahou-dun", "Xiahou Dun", ["Tank", "Clash Lane"]),
  createSampleHero("cai-wenji", "Cai Wenji", ["Support", "Sustain"])
] satisfies readonly Hero[];

export const HOK_SAMPLE_HEROES: readonly Hero[] = Object.freeze(
  rawHokSampleHeroes.map((hero) => Object.freeze(normalizeHokSampleHero(hero)))
);
