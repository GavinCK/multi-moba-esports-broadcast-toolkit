import { describe, expect, it } from "vitest";

import type {
  DraftAction,
  DraftState,
  DraftValidationResult,
  GameAdapter,
  GameAssetType,
  Hero
} from "@mmbt/shared-types";

import {
  createEmptyGameAdapterRegistry,
  createGameAdapterRegistry,
  getGameAdapter,
  listGameAdapters,
  loadGameAdapters,
  registerGameAdapter,
  resolveGameAdapterForGame,
  resolveGameAdapterForMatch,
  validateGameAdapter
} from "./index";

function createAdapter(gameCode: string, displayName = gameCode): GameAdapter {
  const heroes: Hero[] = [
    {
      id: `${gameCode}-hero`,
      gameCode,
      displayName: `${displayName} Hero`
    }
  ];
  const valid: DraftValidationResult = { valid: true };

  return {
    gameCode,
    displayName,
    capabilities: {
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false
    },
    async loadHeroes() {
      return heroes.map((hero) => ({ ...hero }));
    },
    async loadDefaultRulesets() {
      return [];
    },
    getHeroById(heroId: string) {
      const hero = heroes.find((item) => item.id === heroId);

      return hero ? { ...hero } : null;
    },
    searchHeroes(query: string) {
      const normalizedQuery = query.trim().toLocaleLowerCase();

      return heroes
        .filter((hero) => hero.displayName.toLocaleLowerCase().includes(normalizedQuery))
        .map((hero) => ({ ...hero }));
    },
    validateDraftAction(_state: DraftState, _action: DraftAction) {
      return valid;
    },
    getAssetUrl(_assetType: GameAssetType, _id: string) {
      return null;
    }
  };
}

describe("game adapter registry", () => {
  it("registers a valid adapter without mutating the previous registry", () => {
    const adapter = createAdapter("generic-moba", "Generic MOBA");
    const emptyRegistry = createEmptyGameAdapterRegistry();
    const result = registerGameAdapter(emptyRegistry, adapter);

    expect(result.ok).toBe(true);
    expect(emptyRegistry.adapters.size).toBe(0);
    expect(result.ok ? result.value.adapters.size : 0).toBe(1);
    expect(result.ok ? result.value.adapters.get("generic-moba") : null).toBe(adapter);
  });

  it("rejects invalid adapter data", () => {
    const result = validateGameAdapter({
      gameCode: "",
      displayName: "",
      capabilities: {
        supportsManualDraft: true
      }
    });
    const registryResult = registerGameAdapter(
      createEmptyGameAdapterRegistry(),
      {
        ...createAdapter("broken"),
        gameCode: ""
      }
    );

    expect(result.valid).toBe(false);
    expect(registryResult.ok).toBe(false);
    expect(registryResult.ok ? undefined : registryResult.error.code).toBe("adapter-invalid");
  });

  it("lists adapters deterministically by game code", () => {
    const result = createGameAdapterRegistry([
      createAdapter("zeta"),
      createAdapter("generic-moba"),
      createAdapter("alpha")
    ]);

    expect(result.ok).toBe(true);
    expect(result.ok ? listGameAdapters(result.value).map((adapter) => adapter.gameCode) : []).toEqual([
      "alpha",
      "generic-moba",
      "zeta"
    ]);
  });

  it("resolves existing adapters by direct game code, match, and game instance", () => {
    const adapter = createAdapter("generic-moba", "Generic MOBA");
    const registryResult = loadGameAdapters([adapter]);

    expect(registryResult.ok).toBe(true);

    const registry = registryResult.ok ? registryResult.value : createEmptyGameAdapterRegistry();

    expect(getGameAdapter(registry, "generic-moba").ok).toBe(true);
    expect(resolveGameAdapterForMatch(registry, { gameCode: "generic-moba" }).ok).toBe(true);
    expect(resolveGameAdapterForGame(registry, { gameCode: "generic-moba" }).ok).toBe(true);
  });

  it("returns an explicit error for unknown adapter IDs", () => {
    const registryResult = createGameAdapterRegistry([createAdapter("generic-moba")]);
    const registry = registryResult.ok ? registryResult.value : createEmptyGameAdapterRegistry();
    const result = getGameAdapter(registry, "unknown-game");

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe("adapter-not-loaded");
  });

  it("rejects duplicate game codes", () => {
    const result = createGameAdapterRegistry([
      createAdapter("generic-moba", "Generic MOBA"),
      createAdapter("generic-moba", "Generic MOBA Duplicate")
    ]);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe("adapter-duplicate-game-code");
  });
});
