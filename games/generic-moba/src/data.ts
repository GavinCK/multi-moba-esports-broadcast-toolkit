import type { Hero, JsonObject, JsonValue } from "@mmbt/shared-types";

export const GENERIC_MOBA_GAME_CODE = "generic-moba" as const;
export const GENERIC_MOBA_DISPLAY_NAME = "Generic MOBA" as const;
export const GENERIC_MOBA_ENTITY_TYPE = "hero" as const;

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

export function cloneHero(hero: Hero): Hero {
  return {
    ...hero,
    localizedNames: cloneStringRecord(hero.localizedNames),
    roleTags: hero.roleTags ? [...hero.roleTags] : undefined,
    metadata: cloneJsonObject(hero.metadata)
  };
}

export function normalizeGenericMobaHero(hero: Hero): Hero {
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

const rawGenericMobaHeroes = [
  {
    id: "generic-vanguard",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Vanguard",
    roleTags: ["Frontline", "Initiator"],
    iconUrl: "assets/generic-moba/hero-icons/generic-vanguard.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-vanguard.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-warden",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Warden",
    roleTags: ["Frontline", "Support"],
    iconUrl: "assets/generic-moba/hero-icons/generic-warden.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-warden.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-oracle",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Oracle",
    roleTags: ["Mage", "Support"],
    iconUrl: "assets/generic-moba/hero-icons/generic-oracle.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-oracle.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-ranger",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Ranger",
    roleTags: ["Marksman"],
    iconUrl: "assets/generic-moba/hero-icons/generic-ranger.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-ranger.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-shade",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Shade",
    roleTags: ["Assassin"],
    iconUrl: "assets/generic-moba/hero-icons/generic-shade.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-shade.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-tempest",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Tempest",
    roleTags: ["Mage", "Controller"],
    iconUrl: "assets/generic-moba/hero-icons/generic-tempest.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-tempest.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-sentinel",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Sentinel",
    roleTags: ["Support", "Controller"],
    iconUrl: "assets/generic-moba/hero-icons/generic-sentinel.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-sentinel.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-bastion",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Bastion",
    roleTags: ["Frontline"],
    iconUrl: "assets/generic-moba/hero-icons/generic-bastion.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-bastion.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-ember",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Ember",
    roleTags: ["Mage", "Damage"],
    iconUrl: "assets/generic-moba/hero-icons/generic-ember.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-ember.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  },
  {
    id: "generic-striker",
    gameCode: GENERIC_MOBA_GAME_CODE,
    displayName: "Striker",
    roleTags: ["Fighter", "Damage"],
    iconUrl: "assets/generic-moba/hero-icons/generic-striker.svg",
    squareUrl: "assets/generic-moba/hero-squares/generic-striker.svg",
    metadata: { entityType: GENERIC_MOBA_ENTITY_TYPE }
  }
] satisfies readonly Hero[];

export const GENERIC_MOBA_HEROES: readonly Hero[] = Object.freeze(
  rawGenericMobaHeroes.map((hero) => Object.freeze(normalizeGenericMobaHero(hero)))
);
