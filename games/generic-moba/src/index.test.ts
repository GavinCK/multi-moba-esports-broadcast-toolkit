import { describe, expect, it } from "vitest";

import type { DraftAction, DraftState, Hero } from "@mmbt/shared-types";

import {
  GENERIC_MOBA_GAME_CODE,
  GENERIC_MOBA_HEROES,
  GENERIC_MOBA_STANDARD_RULESET_ID,
  genericMobaAdapter,
  normalizeGenericMobaHero,
  validateGenericMobaHero,
  validateGenericMobaRulesetCompatibility
} from "./index";

function createDraftStateStub(overrides: Partial<DraftState> = {}): DraftState {
  return {
    id: "draft_generic-test",
    gameId: "game_001",
    rulesetId: GENERIC_MOBA_STANDARD_RULESET_ID,
    gameCode: GENERIC_MOBA_GAME_CODE,
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
    id: "ban-1-blue:slot-0",
    phaseId: "ban-1-blue",
    type: "BAN",
    team: "BLUE",
    slotIndex: 0,
    heroId: "generic-vanguard",
    status: "LOCKED",
    createdAt: "2026-01-01T00:00:00.000Z",
    lockedAt: "2026-01-01T00:00:10.000Z",
    ...overrides
  };
}

describe("Generic MOBA adapter", () => {
  it("exposes neutral metadata and local-first capabilities", async () => {
    const heroes = await genericMobaAdapter.loadHeroes();
    const rulesets = await genericMobaAdapter.loadDefaultRulesets();

    expect(genericMobaAdapter.gameCode).toBe(GENERIC_MOBA_GAME_CODE);
    expect(genericMobaAdapter.displayName).toBe("Generic MOBA");
    expect(genericMobaAdapter.capabilities).toMatchObject({
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false
    });
    expect(heroes).toHaveLength(10);
    expect(rulesets.map((ruleset) => ruleset.id)).toEqual([GENERIC_MOBA_STANDARD_RULESET_ID]);
  });

  it("returns cloned hero and ruleset data without mutating adapter constants", async () => {
    const heroes = await genericMobaAdapter.loadHeroes();
    const rulesets = await genericMobaAdapter.loadDefaultRulesets();

    heroes[0]!.displayName = "Changed";
    rulesets[0]!.phases[0]!.label = "Changed";

    const nextHeroes = await genericMobaAdapter.loadHeroes();
    const nextRulesets = await genericMobaAdapter.loadDefaultRulesets();

    expect(nextHeroes[0]!.displayName).toBe(GENERIC_MOBA_HEROES[0]!.displayName);
    expect(nextRulesets[0]!.phases[0]!.label).toBe("Blue Ban 1");
  });

  it("searches generic selectable entities by name, id, and role tag", () => {
    expect(genericMobaAdapter.getHeroById("generic-vanguard")?.displayName).toBe("Vanguard");
    expect(genericMobaAdapter.getHeroById("unknown")).toBeNull();
    expect(genericMobaAdapter.searchHeroes("frontline").map((hero) => hero.id)).toEqual(
      expect.arrayContaining(["generic-vanguard", "generic-warden", "generic-bastion"])
    );
    expect(genericMobaAdapter.searchHeroes("oracle").map((hero) => hero.id)).toEqual(["generic-oracle"]);
  });

  it("validates generic selectable entity data", () => {
    const validHero = genericMobaAdapter.getHeroById("generic-ranger");
    const invalidHero = {
      id: "",
      gameCode: "other-game",
      displayName: "",
      iconUrl: ["https", "://example.invalid/hero.svg"].join("")
    };

    expect(validateGenericMobaHero(validHero).valid).toBe(true);
    expect(validateGenericMobaHero(invalidHero).valid).toBe(false);
  });

  it("normalizes hero data without mutating the input object", () => {
    const hero = {
      id: " generic-test ",
      gameCode: " generic-moba ",
      displayName: " Test Hero ",
      roleTags: [" Mage ", ""],
      metadata: {
        entityType: "hero",
        nested: { safe: true }
      }
    } satisfies Hero;
    const snapshot = structuredClone(hero);
    const normalized = normalizeGenericMobaHero(hero);

    expect(hero).toEqual(snapshot);
    expect(normalized).toMatchObject({
      id: "generic-test",
      gameCode: GENERIC_MOBA_GAME_CODE,
      displayName: "Test Hero",
      roleTags: ["Mage"]
    });
    expect(normalized.metadata).not.toBe(hero.metadata);
  });

  it("validates Generic MOBA ruleset compatibility", async () => {
    const [ruleset] = await genericMobaAdapter.loadDefaultRulesets();
    const wrongGameRuleset = {
      ...ruleset!,
      gameCode: "other-game"
    };
    const unsupportedPhaseRuleset = {
      ...ruleset!,
      phases: [
        ...ruleset!.phases,
        { id: "break-1", type: "BREAK", team: "NONE", count: 1, timeSeconds: 10 }
      ]
    };

    expect(validateGenericMobaRulesetCompatibility(ruleset).valid).toBe(true);
    expect(validateGenericMobaRulesetCompatibility(wrongGameRuleset).valid).toBe(false);
    expect(validateGenericMobaRulesetCompatibility(unsupportedPhaseRuleset).valid).toBe(false);
  });

  it("validates draft action compatibility against the generic hero pool", () => {
    const state = createDraftStateStub();

    expect(genericMobaAdapter.validateDraftAction(state, createActionStub()).valid).toBe(true);
    expect(
      genericMobaAdapter.validateDraftAction(
        createDraftStateStub({ gameCode: "other-game" }),
        createActionStub()
      ).valid
    ).toBe(false);
    expect(
      genericMobaAdapter.validateDraftAction(
        state,
        createActionStub({ heroId: "unknown-hero" })
      ).valid
    ).toBe(false);
    expect(
      genericMobaAdapter.validateDraftAction(
        state,
        createActionStub({ team: "NONE" })
      ).valid
    ).toBe(false);
  });

  it("returns local fallback asset references for hero assets only", () => {
    expect(genericMobaAdapter.getAssetUrl("HERO_ICON", "generic-vanguard")).toBe(
      "assets/generic-moba/hero-icons/generic-vanguard.svg"
    );
    expect(genericMobaAdapter.getAssetUrl("HERO_ICON", "unknown")).toBe(
      "assets/generic-moba/fallbacks/hero-icon.svg"
    );
    expect(genericMobaAdapter.getAssetUrl("ITEM_ICON", "generic-vanguard")).toBeNull();
  });
});
