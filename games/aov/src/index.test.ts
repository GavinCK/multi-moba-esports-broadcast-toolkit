import { describe, expect, it } from "vitest";

import { createDraftState } from "@mmbt/core-draft";
import { createGameAdapterRegistry, getGameAdapter, validateGameAdapter } from "@mmbt/game-adapters";
import type { DraftAction, DraftState, Hero } from "@mmbt/shared-types";

import {
  AOV_SAMPLE_ADAPTER_METADATA,
  AOV_SAMPLE_DATA_SOURCE,
  AOV_SAMPLE_GAME_CODE,
  AOV_SAMPLE_HEROES,
  AOV_SAMPLE_STANDARD_RULESET,
  AOV_SAMPLE_STANDARD_RULESET_ID,
  aovSampleAdapter,
  normalizeAovSampleHero,
  validateAovSampleAdapterMetadata,
  validateAovSampleHero,
  validateAovSampleHeroes,
  validateAovSampleRulesetCompatibility
} from "./index";

function createDraftStateStub(overrides: Partial<DraftState> = {}): DraftState {
  return {
    id: "draft_aov-sample-test",
    gameId: "game_001",
    rulesetId: AOV_SAMPLE_STANDARD_RULESET_ID,
    gameCode: AOV_SAMPLE_GAME_CODE,
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
    id: "aov-ban-blue-1:slot-0",
    phaseId: "aov-ban-blue-1",
    type: "BAN",
    team: "BLUE",
    slotIndex: 0,
    heroId: "aov-valhein",
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

describe("AOV static manual sample adapter", () => {
  it("exposes static sample metadata and local-first capabilities", async () => {
    const heroes = await aovSampleAdapter.loadHeroes();
    const rulesets = await aovSampleAdapter.loadDefaultRulesets();

    expect(validateGameAdapter(aovSampleAdapter).valid).toBe(true);
    expect(validateAovSampleAdapterMetadata().valid).toBe(true);
    expect(aovSampleAdapter.gameCode).toBe(AOV_SAMPLE_GAME_CODE);
    expect(aovSampleAdapter.displayName).toContain("Static Manual Sample");
    expect(AOV_SAMPLE_ADAPTER_METADATA).toMatchObject({
      mode: "static-manual-sample",
      dataSource: AOV_SAMPLE_DATA_SOURCE
    });
    expect(aovSampleAdapter.capabilities).toMatchObject({
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false
    });
    expect(heroes).toHaveLength(20);
    expect(rulesets.map((ruleset) => ruleset.id)).toEqual([AOV_SAMPLE_STANDARD_RULESET_ID]);
  });

  it("validates the local static selectable entity pool", () => {
    const validHero = aovSampleAdapter.getHeroById("aov-valhein");
    const invalidHero = {
      id: "",
      gameCode: "other-game",
      displayName: "",
      iconUrl: ["bad", "://", "example.invalid", "/hero.svg"].join("")
    };

    expect(validateAovSampleHeroes().valid).toBe(true);
    expect(validateAovSampleHero(validHero).valid).toBe(true);
    expect(validateAovSampleHero(invalidHero).valid).toBe(false);
    expect(new Set(AOV_SAMPLE_HEROES.map((hero) => hero.id)).size).toBe(AOV_SAMPLE_HEROES.length);
  });

  it("registers and resolves through the shared adapter registry", () => {
    const registryResult = createGameAdapterRegistry([aovSampleAdapter]);

    expect(registryResult.ok).toBe(true);

    const registry = registryResult.ok ? registryResult.value : createGameAdapterRegistry([]).value;
    const adapterResult = registry ? getGameAdapter(registry, AOV_SAMPLE_GAME_CODE) : null;

    expect(adapterResult?.ok).toBe(true);
    expect(adapterResult?.ok ? adapterResult.value : null).toBe(aovSampleAdapter);
  });

  it("returns local placeholder asset references and fallbacks only", () => {
    expect(aovSampleAdapter.getAssetUrl("HERO_ICON", "aov-valhein")).toBe(
      "assets/aov-sample/hero-icons/aov-valhein.svg"
    );
    expect(aovSampleAdapter.getAssetUrl("HERO_ICON", "unknown")).toBe(
      "assets/aov-sample/fallbacks/hero-icon.svg"
    );
    expect(aovSampleAdapter.getAssetUrl("ITEM_ICON", "aov-valhein")).toBeNull();

    expectLocalAssetReference(aovSampleAdapter.getAssetUrl("HERO_ICON", "aov-valhein"));
    expectLocalAssetReference(aovSampleAdapter.getAssetUrl("HERO_SPLASH", "unknown"));
    expectLocalAssetReference(aovSampleAdapter.getAssetUrl("HERO_SQUARE", "unknown"));
  });

  it("validates the AOV-like manual ruleset against the universal draft engine", () => {
    const compatibility = validateAovSampleRulesetCompatibility(AOV_SAMPLE_STANDARD_RULESET);
    const draftResult = createDraftState({
      gameId: "game_001",
      ruleset: AOV_SAMPLE_STANDARD_RULESET,
      now: "2026-01-01T00:00:00.000Z"
    });
    const banSlots = AOV_SAMPLE_STANDARD_RULESET.phases
      .filter((phase) => phase.type === "BAN")
      .reduce((slotCount, phase) => slotCount + phase.count, 0);
    const pickSlots = AOV_SAMPLE_STANDARD_RULESET.phases
      .filter((phase) => phase.type === "PICK")
      .reduce((slotCount, phase) => slotCount + phase.count, 0);

    expect(compatibility.valid).toBe(true);
    expect(draftResult.ok).toBe(true);
    expect(draftResult.ok ? draftResult.value.actions : []).toHaveLength(18);
    expect(banSlots).toBe(8);
    expect(pickSlots).toBe(10);
  });

  it("rejects rulesets that are not compatible with the static sample pool", () => {
    const wrongGameRuleset = {
      ...AOV_SAMPLE_STANDARD_RULESET,
      gameCode: "other-game"
    };
    const oversizedRuleset = {
      ...AOV_SAMPLE_STANDARD_RULESET,
      phases: [
        ...AOV_SAMPLE_STANDARD_RULESET.phases,
        { id: "extra-pick-aov-1", type: "PICK", team: "BLUE", count: 3, timeSeconds: 30 }
      ]
    };

    expect(validateAovSampleRulesetCompatibility(wrongGameRuleset).valid).toBe(false);
    expect(validateAovSampleRulesetCompatibility(oversizedRuleset).valid).toBe(false);
  });

  it("returns cloned hero and ruleset data without mutating adapter constants", async () => {
    const heroes = await aovSampleAdapter.loadHeroes();
    const rulesets = await aovSampleAdapter.loadDefaultRulesets();

    heroes[0]!.displayName = "Changed";
    rulesets[0]!.phases[0]!.label = "Changed";

    const nextHeroes = await aovSampleAdapter.loadHeroes();
    const nextRulesets = await aovSampleAdapter.loadDefaultRulesets();

    expect(nextHeroes[0]!.displayName).toBe(AOV_SAMPLE_HEROES[0]!.displayName);
    expect(nextRulesets[0]!.phases[0]!.label).toBe("Blue Ban 1");
  });

  it("normalizes sample hero data without mutating the input object", () => {
    const hero = {
      id: " aov-test ",
      gameCode: " aov ",
      displayName: " Test Hero ",
      roleTags: [" Mage ", ""],
      metadata: {
        entityType: "hero",
        nested: { safe: true }
      }
    } satisfies Hero;
    const snapshot = structuredClone(hero);
    const normalized = normalizeAovSampleHero(hero);

    expect(hero).toEqual(snapshot);
    expect(normalized).toMatchObject({
      id: "aov-test",
      gameCode: AOV_SAMPLE_GAME_CODE,
      displayName: "Test Hero",
      roleTags: ["Mage"]
    });
    expect(normalized.metadata).not.toBe(hero.metadata);
  });

  it("searches sample selectable entities by name, id, and role tag", () => {
    expect(aovSampleAdapter.getHeroById("aov-valhein")?.displayName).toBe("Valhein");
    expect(aovSampleAdapter.getHeroById("unknown")).toBeNull();
    expect(aovSampleAdapter.searchHeroes("marksman").map((hero) => hero.id)).toEqual(
      expect.arrayContaining(["aov-valhein", "aov-violet", "aov-yorn"])
    );
    expect(aovSampleAdapter.searchHeroes("krixi").map((hero) => hero.id)).toEqual(["aov-krixi"]);
  });

  it("validates draft actions against the static sample hero pool", () => {
    const state = createDraftStateStub();

    expect(aovSampleAdapter.validateDraftAction(state, createActionStub()).valid).toBe(true);
    expect(
      aovSampleAdapter.validateDraftAction(
        createDraftStateStub({ gameCode: "other-game" }),
        createActionStub()
      ).valid
    ).toBe(false);
    expect(
      aovSampleAdapter.validateDraftAction(
        state,
        createActionStub({ heroId: "unknown-hero" })
      ).valid
    ).toBe(false);
    expect(
      aovSampleAdapter.validateDraftAction(
        state,
        createActionStub({ team: "NONE" })
      ).valid
    ).toBe(false);
  });

  it("keeps future runtime capabilities disabled for v0.1", () => {
    expect(aovSampleAdapter.capabilities.supportsClientReader).toBe(false);
    expect(aovSampleAdapter.capabilities.supportsIngameHud).toBe(false);
    expect(aovSampleAdapter.capabilities.supportsPostGameStats).toBe(false);
    expect(aovSampleAdapter.capabilities.supportsAssetSync).toBe(false);
  });

  it("does not embed external service or client-reader runtime hooks in sample data", () => {
    const remoteScheme = ["http", "://"].join("");
    const forbiddenRuntimeTokens = [
      ["Garena", " API"].join(""),
      ["Tencent", " API"].join(""),
      ["Ti", "Mi", " API"].join(""),
      ["live", " client"].join(""),
      ["official", " client"].join(""),
      ["spectator", " API"].join(""),
      ["external", " CDN"].join(""),
      ["Web", "Socket"].join(""),
      ["Socket", ".IO"].join(""),
      ["O", "BS"].join(""),
      ["v", "Mix"].join(""),
      ["Pris", "ma"].join(""),
      ["SQL", "ite"].join(""),
      ["cl", "oud"].join("")
    ];
    const samplePayload = JSON.stringify({
      metadata: AOV_SAMPLE_ADAPTER_METADATA,
      heroes: AOV_SAMPLE_HEROES,
      ruleset: AOV_SAMPLE_STANDARD_RULESET
    });

    expect(samplePayload).not.toContain(remoteScheme);
    forbiddenRuntimeTokens.forEach((token) => {
      expect(samplePayload).not.toContain(token);
    });
  });
});
