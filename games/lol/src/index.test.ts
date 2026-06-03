import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDraftState } from "@mmbt/core-draft";
import { createGameAdapterRegistry, getGameAdapter, validateGameAdapter } from "@mmbt/game-adapters";
import type { DraftAction, DraftState, Hero } from "@mmbt/shared-types";

import {
  LOL_SAMPLE_ADAPTER_METADATA,
  LOL_SAMPLE_CHAMPIONS,
  LOL_SAMPLE_DATA_SOURCE,
  LOL_SAMPLE_GAME_CODE,
  LOL_GENERATED_CHAMPION_RECORDS,
  LOL_GENERATED_CHAMPION_SOURCE,
  LOL_SAMPLE_STANDARD_RULESET,
  LOL_SAMPLE_STANDARD_RULESET_ID,
  lolSampleAdapter,
  normalizeLoLSampleChampion,
  validateLoLSampleAdapterMetadata,
  validateLoLSampleChampion,
  validateLoLSampleChampions,
  validateLoLSampleRulesetCompatibility
} from "./index";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));

const DIFFICULT_LOL_CHAMPION_NAMES = [
  "Kai'Sa",
  "Kha'Zix",
  "Cho'Gath",
  "Dr. Mundo",
  "Nunu & Willump",
  "Miss Fortune",
  "Twisted Fate",
  "Jarvan IV",
  "Aurelion Sol",
  "Wukong",
  "Renata Glasc"
] as const;

function createDraftStateStub(overrides: Partial<DraftState> = {}): DraftState {
  return {
    id: "draft_lol-sample-test",
    gameId: "game_001",
    rulesetId: LOL_SAMPLE_STANDARD_RULESET_ID,
    gameCode: LOL_SAMPLE_GAME_CODE,
    status: "LIVE",
    currentPhaseIndex: 0,
    timer: {
      isRunning: true,
      phaseStartedAt: "2026-01-01T00:00:00.000Z",
      remainingSeconds: 30,
      originalSeconds: 30
    },
    actions: [],
    lockedHeroIds: [],
    bannedHeroIds: [],
    pickedHeroIds: [],
    history: [],
    ...overrides
  };
}

function createActionStub(overrides: Partial<DraftAction> = {}): DraftAction {
  return {
    id: "ban-blue-1:slot-0",
    phaseId: "ban-blue-1",
    type: "BAN",
    team: "BLUE",
    slotIndex: 0,
    heroId: "lol-ahri",
    status: "LOCKED",
    createdAt: "2026-01-01T00:00:00.000Z",
    lockedAt: "2026-01-01T00:00:10.000Z",
    ...overrides
  };
}

function expectLocalAssetReference(reference: string | null): void {
  expect(reference).toBeTypeOf("string");
  expect(reference).not.toContain("://");
  expect(reference).not.toContain("..");
  expect(reference).not.toContain("?");
  expect(reference).not.toContain("#");
}

describe("LoL static manual sample adapter", () => {
  it("exposes static sample metadata and local-first capabilities", async () => {
    const heroes = await lolSampleAdapter.loadHeroes();
    const rulesets = await lolSampleAdapter.loadDefaultRulesets();

    expect(validateGameAdapter(lolSampleAdapter).valid).toBe(true);
    expect(validateLoLSampleAdapterMetadata().valid).toBe(true);
    expect(lolSampleAdapter.gameCode).toBe(LOL_SAMPLE_GAME_CODE);
    expect(lolSampleAdapter.displayName).toBe("LoL Local Static Roster");
    expect(LOL_SAMPLE_ADAPTER_METADATA).toMatchObject({
      mode: "static-manual-roster",
      dataSource: LOL_SAMPLE_DATA_SOURCE,
      dataDragonVersion: LOL_GENERATED_CHAMPION_SOURCE.dataDragonVersion,
      approvedArtworkIncluded: false
    });
    expect(LOL_GENERATED_CHAMPION_SOURCE.localizedNameCoverage["zh-TW"]).toBe(
      LOL_GENERATED_CHAMPION_RECORDS.length
    );
    expect(lolSampleAdapter.capabilities).toMatchObject({
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false
    });
    expect(heroes.length).toBeGreaterThan(160);
    expect(heroes).toHaveLength(LOL_GENERATED_CHAMPION_RECORDS.length);
    expect(heroes).not.toHaveLength(20);
    expect(rulesets.map((ruleset) => ruleset.id)).toEqual([LOL_SAMPLE_STANDARD_RULESET_ID]);
  });

  it("validates the local static champion roster", () => {
    const validChampion = lolSampleAdapter.getHeroById("lol-ahri");
    const invalidChampion = {
      id: "",
      gameCode: "other-game",
      displayName: "",
      iconUrl: ["bad", "://", "example.invalid", "/champion.svg"].join("")
    };

    expect(validateLoLSampleChampions().valid).toBe(true);
    expect(validateLoLSampleChampion(validChampion).valid).toBe(true);
    expect(validateLoLSampleChampion(invalidChampion).valid).toBe(false);
    expect(new Set(LOL_SAMPLE_CHAMPIONS.map((champion) => champion.id)).size).toBe(
      LOL_SAMPLE_CHAMPIONS.length
    );
  });

  it("includes known LoL champions from the generated static roster", async () => {
    const heroes = await lolSampleAdapter.loadHeroes();
    const byName = new Map(heroes.map((champion) => [champion.displayName, champion]));

    [
      ["Aatrox", "lol-aatrox"],
      ["Ahri", "lol-ahri"],
      ["Akali", "lol-akali"],
      ["Annie", "lol-annie"],
      ["Lee Sin", "lol-lee-sin"],
      ["Lux", "lol-lux"],
      ["Yasuo", "lol-yasuo"],
      ["Zed", "lol-zed"],
      ["Jinx", "lol-jinx"],
      ["Thresh", "lol-thresh"]
    ].forEach(([displayName, id]) => {
      expect(byName.get(displayName)?.id).toBe(id);
    });
    DIFFICULT_LOL_CHAMPION_NAMES.forEach((displayName) => {
      expect(byName.has(displayName)).toBe(true);
    });
  });

  it("includes zh-TW localized names from generated static Data Dragon metadata", async () => {
    const heroes = await lolSampleAdapter.loadHeroes();
    const localizedHeroes = heroes.filter((champion) => {
      const localizedName = champion.localizedNames?.["zh-TW"];

      return typeof localizedName === "string" && localizedName.trim().length > 0;
    });
    const representative = heroes.find((champion) => champion.displayName === "Ahri") ?? heroes[0];
    const representativeLocalizedName = representative?.localizedNames?.["zh-TW"];

    expect(localizedHeroes).toHaveLength(heroes.length);
    expect(representativeLocalizedName).toEqual(expect.any(String));
    expect(representativeLocalizedName?.trim().length).toBeGreaterThan(0);
    expect(lolSampleAdapter.searchHeroes(representativeLocalizedName ?? "").map((champion) => champion.id)).toContain(
      representative?.id
    );
  });

  it("does not expose generic MOBA placeholder heroes in the LoL roster", async () => {
    const heroes = await lolSampleAdapter.loadHeroes();
    const heroNames = new Set(heroes.map((champion) => champion.displayName));
    const heroIds = new Set(heroes.map((champion) => champion.id));

    [
      ["generic-vanguard", "Vanguard"],
      ["generic-warden", "Warden"],
      ["generic-oracle", "Oracle"],
      ["generic-ranger", "Ranger"],
      ["generic-shade", "Shade"],
      ["generic-tempest", "Tempest"],
      ["generic-sentinel", "Sentinel"],
      ["generic-bastion", "Bastion"],
      ["generic-ember", "Ember"],
      ["generic-striker", "Striker"]
    ].forEach(([id, displayName]) => {
      expect(heroIds.has(id)).toBe(false);
      expect(heroNames.has(displayName)).toBe(false);
    });
  });

  it("keeps champion ids, display names, and fallback metadata stable and non-empty", async () => {
    const heroes = await lolSampleAdapter.loadHeroes();

    heroes.forEach((champion) => {
      expect(champion.id).toMatch(/^lol-[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(champion.displayName.trim().length).toBeGreaterThan(0);
      expect(champion.metadata?.entityType).toBe("champion");
      expect(champion.metadata?.dataDragonId).toEqual(expect.any(String));
      expect(champion.metadata?.fallbackLabel).toEqual(expect.any(String));
      expect(champion.metadata?.imageState).toBe("local-artwork-not-packaged");
    });
  });

  it("registers and resolves through the shared adapter registry", () => {
    const registryResult = createGameAdapterRegistry([lolSampleAdapter]);

    expect(registryResult.ok).toBe(true);

    const registry = registryResult.ok ? registryResult.value : createGameAdapterRegistry([]).value;
    const adapterResult = registry ? getGameAdapter(registry, LOL_SAMPLE_GAME_CODE) : null;

    expect(adapterResult?.ok).toBe(true);
    expect(adapterResult?.ok ? adapterResult.value : null).toBe(lolSampleAdapter);
  });

  it("returns local placeholder asset references and fallbacks only", () => {
    expect(lolSampleAdapter.getAssetUrl("HERO_ICON", "lol-ahri")).toBe(
      "assets/hero-icons/lol/Ahri.png"
    );
    expect(lolSampleAdapter.getAssetUrl("HERO_ICON", "unknown")).toBe(
      "assets/fallbacks/hero-icon.svg"
    );
    expect(lolSampleAdapter.getAssetUrl("ITEM_ICON", "lol-ahri")).toBeNull();

    expectLocalAssetReference(lolSampleAdapter.getAssetUrl("HERO_ICON", "lol-ahri"));
    expectLocalAssetReference(lolSampleAdapter.getAssetUrl("HERO_SPLASH", "unknown"));
    expectLocalAssetReference(lolSampleAdapter.getAssetUrl("HERO_SQUARE", "unknown"));
  });

  it("uses Data Dragon champion IDs for representative local icon paths", async () => {
    const heroes = await lolSampleAdapter.loadHeroes();
    const heroByName = new Map(heroes.map((hero) => [hero.displayName, hero]));
    const expectedIconPaths = [
      ["Kai'Sa", "assets/hero-icons/lol/Kaisa.png"],
      ["Kha'Zix", "assets/hero-icons/lol/Khazix.png"],
      ["Cho'Gath", "assets/hero-icons/lol/Chogath.png"],
      ["Dr. Mundo", "assets/hero-icons/lol/DrMundo.png"],
      ["Nunu & Willump", "assets/hero-icons/lol/Nunu.png"],
      ["Jarvan IV", "assets/hero-icons/lol/JarvanIV.png"],
      ["Aurelion Sol", "assets/hero-icons/lol/AurelionSol.png"],
      ["Wukong", "assets/hero-icons/lol/MonkeyKing.png"],
      ["Renata Glasc", "assets/hero-icons/lol/Renata.png"],
      ["K'Sante", "assets/hero-icons/lol/KSante.png"]
    ] as const;

    expectedIconPaths.forEach(([displayName, iconUrl]) => {
      const hero = heroByName.get(displayName);

      expect(hero?.iconUrl).toBe(iconUrl);
      expect(hero?.squareUrl).toBe(iconUrl);
      expect(hero?.metadata?.localIconPath).toBe(iconUrl);
      expectLocalAssetReference(iconUrl);
    });
  });

  it("validates the LoL-like manual ruleset against the universal draft engine", () => {
    const compatibility = validateLoLSampleRulesetCompatibility(LOL_SAMPLE_STANDARD_RULESET);
    const draftResult = createDraftState({
      gameId: "game_001",
      ruleset: LOL_SAMPLE_STANDARD_RULESET,
      now: "2026-01-01T00:00:00.000Z"
    });
    const banSlots = LOL_SAMPLE_STANDARD_RULESET.phases
      .filter((phase) => phase.type === "BAN")
      .reduce((slotCount, phase) => slotCount + phase.count, 0);
    const pickSlots = LOL_SAMPLE_STANDARD_RULESET.phases
      .filter((phase) => phase.type === "PICK")
      .reduce((slotCount, phase) => slotCount + phase.count, 0);

    expect(compatibility.valid).toBe(true);
    expect(draftResult.ok).toBe(true);
    expect(draftResult.ok ? draftResult.value.actions : []).toHaveLength(20);
    expect(banSlots).toBe(10);
    expect(pickSlots).toBe(10);
  });

  it("keeps every normal LoL pick phase at 30 seconds even when the phase has multiple picks", () => {
    const pickPhases = LOL_SAMPLE_STANDARD_RULESET.phases.filter((phase) => phase.type === "PICK");
    const multiPickPhases = pickPhases.filter((phase) => phase.count > 1);

    expect(pickPhases).toHaveLength(7);
    expect(multiPickPhases.map((phase) => phase.id)).toEqual([
      "pick-red-1-2",
      "pick-blue-2-3",
      "pick-blue-4-5"
    ]);
    expect(pickPhases.every((phase) => phase.timeSeconds === 30)).toBe(true);
    expect(multiPickPhases.every((phase) => phase.timeSeconds === 30)).toBe(true);
  });

  it("rejects rulesets that are not compatible with the static sample pool", () => {
    const wrongGameRuleset = {
      ...LOL_SAMPLE_STANDARD_RULESET,
      gameCode: "other-game"
    };
    const oversizedRuleset = {
      ...LOL_SAMPLE_STANDARD_RULESET,
      phases: [
        ...LOL_SAMPLE_STANDARD_RULESET.phases,
        {
          id: "extra-pick",
          type: "PICK",
          team: "BLUE",
          count: LOL_SAMPLE_CHAMPIONS.length,
          timeSeconds: 30
        }
      ]
    };

    expect(validateLoLSampleRulesetCompatibility(wrongGameRuleset).valid).toBe(false);
    expect(validateLoLSampleRulesetCompatibility(oversizedRuleset).valid).toBe(false);
  });

  it("returns cloned hero and ruleset data without mutating adapter constants", async () => {
    const heroes = await lolSampleAdapter.loadHeroes();
    const rulesets = await lolSampleAdapter.loadDefaultRulesets();

    heroes[0]!.displayName = "Changed";
    rulesets[0]!.phases[0]!.label = "Changed";

    const nextHeroes = await lolSampleAdapter.loadHeroes();
    const nextRulesets = await lolSampleAdapter.loadDefaultRulesets();

    expect(nextHeroes[0]!.displayName).toBe(LOL_SAMPLE_CHAMPIONS[0]!.displayName);
    expect(nextRulesets[0]!.phases[0]!.label).toBe("Blue Ban 1");
  });

  it("normalizes sample champion data without mutating the input object", () => {
    const champion = {
      id: " lol-test ",
      gameCode: " lol ",
      displayName: " Test Champion ",
      roleTags: [" Mage ", ""],
      metadata: {
        entityType: "champion",
        nested: { safe: true }
      }
    } satisfies Hero;
    const snapshot = structuredClone(champion);
    const normalized = normalizeLoLSampleChampion(champion);

    expect(champion).toEqual(snapshot);
    expect(normalized).toMatchObject({
      id: "lol-test",
      gameCode: LOL_SAMPLE_GAME_CODE,
      displayName: "Test Champion",
      roleTags: ["Mage"]
    });
    expect(normalized.metadata).not.toBe(champion.metadata);
  });

  it("searches sample selectable entities by name, id, role tag, punctuation, and aliases", () => {
    expect(lolSampleAdapter.getHeroById("lol-ahri")?.displayName).toBe("Ahri");
    expect(lolSampleAdapter.getHeroById("unknown")).toBeNull();
    expect(lolSampleAdapter.searchHeroes("marksman").map((champion) => champion.id)).toEqual(
      expect.arrayContaining(["lol-ashe", "lol-caitlyn", "lol-ezreal"])
    );
    expect(lolSampleAdapter.searchHeroes("orianna").map((champion) => champion.id)).toEqual(["lol-orianna"]);
    expect(lolSampleAdapter.searchHeroes("LeeSin").map((champion) => champion.id)).toEqual(["lol-lee-sin"]);
    expect(lolSampleAdapter.searchHeroes("monkey king").map((champion) => champion.id)).toEqual(["lol-wukong"]);

    [
      ["Kai'Sa", "lol-kaisa"],
      ["kaisa", "lol-kaisa"],
      ["Kha Zix", "lol-khazix"],
      ["ChoGath", "lol-chogath"],
      ["Dr Mundo", "lol-dr-mundo"],
      ["Mundo", "lol-dr-mundo"],
      ["Nunu and Willump", "lol-nunu-and-willump"],
      ["MF", "lol-miss-fortune"],
      ["missfortune", "lol-miss-fortune"],
      ["TF", "lol-twisted-fate"],
      ["twistedfate", "lol-twisted-fate"],
      ["Jarvan 4", "lol-jarvan-iv"],
      ["aurelionsol", "lol-aurelion-sol"],
      ["Renata Glasc", "lol-renata-glasc"]
    ].forEach(([query, expectedId]) => {
      expect(lolSampleAdapter.searchHeroes(query).map((champion) => champion.id)).toContain(expectedId);
    });
  });

  it("validates draft actions against the static sample champion pool", () => {
    const state = createDraftStateStub();

    expect(lolSampleAdapter.validateDraftAction(state, createActionStub()).valid).toBe(true);
    expect(
      lolSampleAdapter.validateDraftAction(
        createDraftStateStub({ gameCode: "other-game" }),
        createActionStub()
      ).valid
    ).toBe(false);
    expect(
      lolSampleAdapter.validateDraftAction(
        state,
        createActionStub({ heroId: "unknown-champion" })
      ).valid
    ).toBe(false);
    expect(
      lolSampleAdapter.validateDraftAction(
        state,
        createActionStub({ team: "NONE" })
      ).valid
    ).toBe(false);
  });

  it("keeps future runtime capabilities disabled for v0.1", () => {
    expect(lolSampleAdapter.capabilities.supportsClientReader).toBe(false);
    expect(lolSampleAdapter.capabilities.supportsIngameHud).toBe(false);
    expect(lolSampleAdapter.capabilities.supportsPostGameStats).toBe(false);
    expect(lolSampleAdapter.capabilities.supportsAssetSync).toBe(false);
  });

  it("does not embed external service or client-reader runtime hooks in runtime data", () => {
    const remoteScheme = ["http", "://"].join("");
    const forbiddenRuntimeTokens = [
      ["L", "CU"].join(""),
      ["Data", "Dragon"].join(""),
      ["Riot", " API"].join(""),
      ["champion", "-select"].join(""),
      ["spectator", " API"].join(""),
      ["live", " client"].join("")
    ];
    const samplePayload = JSON.stringify({
      metadata: LOL_SAMPLE_ADAPTER_METADATA,
      champions: LOL_SAMPLE_CHAMPIONS,
      ruleset: LOL_SAMPLE_STANDARD_RULESET
    });

    expect(samplePayload).not.toContain(remoteScheme);
    forbiddenRuntimeTokens.forEach((token) => {
      expect(samplePayload).not.toContain(token);
    });
  });

  it("keeps runtime source free of remote fetches and remote asset URLs", () => {
    const runtimeSource = [
      "adapter.ts",
      "data.ts",
      "generated-champions.ts",
      "validation.ts"
    ].map((fileName) => readFileSync(join(sourceDirectory, fileName), "utf8")).join("\n");

    [
      "fetch(",
      "Invoke-RestMethod",
      "axios",
      "riotgames.com/cdn",
      "ddragon.leagueoflegends.com",
      "cdn.communitydragon.org"
    ].forEach((token) => {
      expect(runtimeSource).not.toContain(token);
    });
  });
});
