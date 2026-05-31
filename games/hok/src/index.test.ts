import { describe, expect, it } from "vitest";

import { createDraftState } from "@mmbt/core-draft";
import { createGameAdapterRegistry, getGameAdapter, validateGameAdapter } from "@mmbt/game-adapters";
import type { DraftAction, DraftState, Hero } from "@mmbt/shared-types";

import {
  HOK_SAMPLE_ADAPTER_METADATA,
  HOK_SAMPLE_DATA_SOURCE,
  HOK_SAMPLE_GAME_CODE,
  HOK_SAMPLE_GLOBAL_BP_RULESET,
  HOK_SAMPLE_GLOBAL_BP_RULESET_ID,
  HOK_SAMPLE_HEROES,
  hokSampleAdapter,
  normalizeHokSampleHero,
  validateHokSampleAdapterMetadata,
  validateHokSampleHero,
  validateHokSampleHeroes,
  validateHokSampleRulesetCompatibility
} from "./index";

function createDraftStateStub(overrides: Partial<DraftState> = {}): DraftState {
  return {
    id: "draft_hok-sample-test",
    gameId: "game_001",
    rulesetId: HOK_SAMPLE_GLOBAL_BP_RULESET_ID,
    gameCode: HOK_SAMPLE_GAME_CODE,
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
    id: "hok-ban-blue-1:slot-0",
    phaseId: "hok-ban-blue-1",
    type: "BAN",
    team: "BLUE",
    slotIndex: 0,
    heroId: "hok-arthur",
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

describe("HoK static manual sample adapter", () => {
  it("exposes static sample metadata and local-first capabilities", async () => {
    const heroes = await hokSampleAdapter.loadHeroes();
    const rulesets = await hokSampleAdapter.loadDefaultRulesets();

    expect(validateGameAdapter(hokSampleAdapter).valid).toBe(true);
    expect(validateHokSampleAdapterMetadata().valid).toBe(true);
    expect(hokSampleAdapter.gameCode).toBe(HOK_SAMPLE_GAME_CODE);
    expect(hokSampleAdapter.displayName).toContain("Static Manual Sample");
    expect(HOK_SAMPLE_ADAPTER_METADATA).toMatchObject({
      mode: "static-manual-sample",
      dataSource: HOK_SAMPLE_DATA_SOURCE
    });
    expect(hokSampleAdapter.capabilities).toMatchObject({
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false
    });
    expect(heroes).toHaveLength(20);
    expect(rulesets.map((ruleset) => ruleset.id)).toEqual([HOK_SAMPLE_GLOBAL_BP_RULESET_ID]);
  });

  it("validates the local static selectable entity pool", () => {
    const validHero = hokSampleAdapter.getHeroById("hok-arthur");
    const invalidHero = {
      id: "",
      gameCode: "other-game",
      displayName: "",
      iconUrl: ["bad", "://", "example.invalid", "/hero.svg"].join("")
    };

    expect(validateHokSampleHeroes().valid).toBe(true);
    expect(validateHokSampleHero(validHero).valid).toBe(true);
    expect(validateHokSampleHero(invalidHero).valid).toBe(false);
    expect(new Set(HOK_SAMPLE_HEROES.map((hero) => hero.id)).size).toBe(HOK_SAMPLE_HEROES.length);
  });

  it("registers and resolves through the shared adapter registry", () => {
    const registryResult = createGameAdapterRegistry([hokSampleAdapter]);

    expect(registryResult.ok).toBe(true);

    const registry = registryResult.ok ? registryResult.value : createGameAdapterRegistry([]).value;
    const adapterResult = registry ? getGameAdapter(registry, HOK_SAMPLE_GAME_CODE) : null;

    expect(adapterResult?.ok).toBe(true);
    expect(adapterResult?.ok ? adapterResult.value : null).toBe(hokSampleAdapter);
  });

  it("returns local placeholder asset references and fallbacks only", () => {
    expect(hokSampleAdapter.getAssetUrl("HERO_ICON", "hok-arthur")).toBe(
      "assets/hok-sample/hero-icons/hok-arthur.svg"
    );
    expect(hokSampleAdapter.getAssetUrl("HERO_ICON", "unknown")).toBe(
      "assets/hok-sample/fallbacks/hero-icon.svg"
    );
    expect(hokSampleAdapter.getAssetUrl("ITEM_ICON", "hok-arthur")).toBeNull();

    expectLocalAssetReference(hokSampleAdapter.getAssetUrl("HERO_ICON", "hok-arthur"));
    expectLocalAssetReference(hokSampleAdapter.getAssetUrl("HERO_SPLASH", "unknown"));
    expectLocalAssetReference(hokSampleAdapter.getAssetUrl("HERO_SQUARE", "unknown"));
  });

  it("validates the HoK-like manual ruleset against the universal draft engine", () => {
    const compatibility = validateHokSampleRulesetCompatibility(HOK_SAMPLE_GLOBAL_BP_RULESET);
    const draftResult = createDraftState({
      gameId: "game_001",
      ruleset: HOK_SAMPLE_GLOBAL_BP_RULESET,
      now: "2026-01-01T00:00:00.000Z"
    });
    const banSlots = HOK_SAMPLE_GLOBAL_BP_RULESET.phases
      .filter((phase) => phase.type === "BAN")
      .reduce((slotCount, phase) => slotCount + phase.count, 0);
    const pickSlots = HOK_SAMPLE_GLOBAL_BP_RULESET.phases
      .filter((phase) => phase.type === "PICK")
      .reduce((slotCount, phase) => slotCount + phase.count, 0);

    expect(compatibility.valid).toBe(true);
    expect(draftResult.ok).toBe(true);
    expect(draftResult.ok ? draftResult.value.actions : []).toHaveLength(18);
    expect(banSlots).toBe(8);
    expect(pickSlots).toBe(10);
    expect(HOK_SAMPLE_GLOBAL_BP_RULESET.globalBanAcrossSeries).toBe(true);
    expect(HOK_SAMPLE_GLOBAL_BP_RULESET.globalPickAcrossSeries).toBe(true);
  });

  it("rejects rulesets that are not compatible with the static sample pool", () => {
    const wrongGameRuleset = {
      ...HOK_SAMPLE_GLOBAL_BP_RULESET,
      gameCode: "other-game"
    };
    const oversizedRuleset = {
      ...HOK_SAMPLE_GLOBAL_BP_RULESET,
      phases: [
        ...HOK_SAMPLE_GLOBAL_BP_RULESET.phases,
        { id: "extra-pick-hok-1", type: "PICK", team: "BLUE", count: 3, timeSeconds: 30 }
      ]
    };

    expect(validateHokSampleRulesetCompatibility(wrongGameRuleset).valid).toBe(false);
    expect(validateHokSampleRulesetCompatibility(oversizedRuleset).valid).toBe(false);
  });

  it("returns cloned hero and ruleset data without mutating adapter constants", async () => {
    const heroes = await hokSampleAdapter.loadHeroes();
    const rulesets = await hokSampleAdapter.loadDefaultRulesets();

    heroes[0]!.displayName = "Changed";
    rulesets[0]!.phases[0]!.label = "Changed";

    const nextHeroes = await hokSampleAdapter.loadHeroes();
    const nextRulesets = await hokSampleAdapter.loadDefaultRulesets();

    expect(nextHeroes[0]!.displayName).toBe(HOK_SAMPLE_HEROES[0]!.displayName);
    expect(nextRulesets[0]!.phases[0]!.label).toBe("Blue Ban 1");
  });

  it("normalizes sample hero data without mutating the input object", () => {
    const hero = {
      id: " hok-test ",
      gameCode: " hok ",
      displayName: " Test Hero ",
      roleTags: [" Mage ", ""],
      metadata: {
        entityType: "hero",
        nested: { safe: true }
      }
    } satisfies Hero;
    const snapshot = structuredClone(hero);
    const normalized = normalizeHokSampleHero(hero);

    expect(hero).toEqual(snapshot);
    expect(normalized).toMatchObject({
      id: "hok-test",
      gameCode: HOK_SAMPLE_GAME_CODE,
      displayName: "Test Hero",
      roleTags: ["Mage"]
    });
    expect(normalized.metadata).not.toBe(hero.metadata);
  });

  it("searches sample selectable entities by name, id, and role tag", () => {
    expect(hokSampleAdapter.getHeroById("hok-arthur")?.displayName).toBe("Arthur");
    expect(hokSampleAdapter.getHeroById("unknown")).toBeNull();
    expect(hokSampleAdapter.searchHeroes("marksman").map((hero) => hero.id)).toEqual(
      expect.arrayContaining(["hok-hou-yi", "hok-luban-no-7", "hok-sun-shangxiang"])
    );
    expect(hokSampleAdapter.searchHeroes("daji").map((hero) => hero.id)).toEqual(["hok-daji"]);
  });

  it("validates draft actions against the static sample hero pool", () => {
    const state = createDraftStateStub();

    expect(hokSampleAdapter.validateDraftAction(state, createActionStub()).valid).toBe(true);
    expect(
      hokSampleAdapter.validateDraftAction(
        createDraftStateStub({ gameCode: "other-game" }),
        createActionStub()
      ).valid
    ).toBe(false);
    expect(
      hokSampleAdapter.validateDraftAction(
        state,
        createActionStub({ heroId: "unknown-hero" })
      ).valid
    ).toBe(false);
    expect(
      hokSampleAdapter.validateDraftAction(
        state,
        createActionStub({ team: "NONE" })
      ).valid
    ).toBe(false);
  });

  it("keeps future runtime capabilities disabled for v0.1", () => {
    expect(hokSampleAdapter.capabilities.supportsClientReader).toBe(false);
    expect(hokSampleAdapter.capabilities.supportsIngameHud).toBe(false);
    expect(hokSampleAdapter.capabilities.supportsPostGameStats).toBe(false);
    expect(hokSampleAdapter.capabilities.supportsAssetSync).toBe(false);
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
      metadata: HOK_SAMPLE_ADAPTER_METADATA,
      heroes: HOK_SAMPLE_HEROES,
      ruleset: HOK_SAMPLE_GLOBAL_BP_RULESET
    });

    expect(samplePayload).not.toContain(remoteScheme);
    forbiddenRuntimeTokens.forEach((token) => {
      expect(samplePayload).not.toContain(token);
    });
  });
});
