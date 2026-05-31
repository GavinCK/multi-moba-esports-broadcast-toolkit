import { describe, expect, it } from "vitest";

import { createDraftState } from "@mmbt/core-draft";
import { createGameAdapterRegistry, getGameAdapter, validateGameAdapter } from "@mmbt/game-adapters";
import type { DraftAction, DraftState, Hero } from "@mmbt/shared-types";

import {
  LOL_SAMPLE_ADAPTER_METADATA,
  LOL_SAMPLE_CHAMPIONS,
  LOL_SAMPLE_DATA_SOURCE,
  LOL_SAMPLE_GAME_CODE,
  LOL_SAMPLE_STANDARD_RULESET,
  LOL_SAMPLE_STANDARD_RULESET_ID,
  lolSampleAdapter,
  normalizeLoLSampleChampion,
  validateLoLSampleAdapterMetadata,
  validateLoLSampleChampion,
  validateLoLSampleChampions,
  validateLoLSampleRulesetCompatibility
} from "./index";

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
    expect(lolSampleAdapter.displayName).toContain("Static Manual Sample");
    expect(LOL_SAMPLE_ADAPTER_METADATA).toMatchObject({
      mode: "static-manual-sample",
      dataSource: LOL_SAMPLE_DATA_SOURCE
    });
    expect(lolSampleAdapter.capabilities).toMatchObject({
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false
    });
    expect(heroes).toHaveLength(20);
    expect(rulesets.map((ruleset) => ruleset.id)).toEqual([LOL_SAMPLE_STANDARD_RULESET_ID]);
  });

  it("validates the local static selectable entity pool", () => {
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
      "assets/lol-sample/champion-icons/lol-ahri.svg"
    );
    expect(lolSampleAdapter.getAssetUrl("HERO_ICON", "unknown")).toBe(
      "assets/lol-sample/fallbacks/champion-icon.svg"
    );
    expect(lolSampleAdapter.getAssetUrl("ITEM_ICON", "lol-ahri")).toBeNull();

    expectLocalAssetReference(lolSampleAdapter.getAssetUrl("HERO_ICON", "lol-ahri"));
    expectLocalAssetReference(lolSampleAdapter.getAssetUrl("HERO_SPLASH", "unknown"));
    expectLocalAssetReference(lolSampleAdapter.getAssetUrl("HERO_SQUARE", "unknown"));
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

  it("rejects rulesets that are not compatible with the static sample pool", () => {
    const wrongGameRuleset = {
      ...LOL_SAMPLE_STANDARD_RULESET,
      gameCode: "other-game"
    };
    const oversizedRuleset = {
      ...LOL_SAMPLE_STANDARD_RULESET,
      phases: [
        ...LOL_SAMPLE_STANDARD_RULESET.phases,
        { id: "extra-pick", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30 }
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

  it("searches sample selectable entities by name, id, and role tag", () => {
    expect(lolSampleAdapter.getHeroById("lol-ahri")?.displayName).toBe("Ahri");
    expect(lolSampleAdapter.getHeroById("unknown")).toBeNull();
    expect(lolSampleAdapter.searchHeroes("marksman").map((champion) => champion.id)).toEqual(
      expect.arrayContaining(["lol-ashe", "lol-caitlyn", "lol-ezreal"])
    );
    expect(lolSampleAdapter.searchHeroes("orianna").map((champion) => champion.id)).toEqual([
      "lol-orianna"
    ]);
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

  it("does not embed external service or client-reader runtime hooks in sample data", () => {
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
});
