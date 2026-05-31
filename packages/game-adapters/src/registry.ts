import type { GameAdapter, GameCode, GameInstance, Match } from "@mmbt/shared-types";

import { fail, ok, type GameAdapterRegistry, type GameAdapterRegistryResult } from "./types";
import { validateGameAdapter } from "./validation";

function toSerializableValidationIssues(validation: ReturnType<typeof validateGameAdapter>) {
  return (validation.issues ?? []).map((issue) => ({
    code: issue.code,
    message: issue.message,
    details: issue.details ?? null
  }));
}

function createRegistryFromMap(adapters: ReadonlyMap<GameCode, GameAdapter>): GameAdapterRegistry {
  return Object.freeze({ adapters });
}

function normalizeGameCode(gameCode: GameCode): GameCode {
  return gameCode.trim();
}

function invalidGameCodeResult<TValue>(
  gameCode: GameCode
): GameAdapterRegistryResult<TValue> {
  return fail({
    code: "adapter-game-code-invalid",
    message: "Game adapter resolution requires a non-empty game code.",
    details: { gameCode }
  });
}

export function createEmptyGameAdapterRegistry(): GameAdapterRegistry {
  return createRegistryFromMap(new Map<GameCode, GameAdapter>());
}

export function registerGameAdapter(
  registry: GameAdapterRegistry,
  adapter: GameAdapter
): GameAdapterRegistryResult<GameAdapterRegistry> {
  const validation = validateGameAdapter(adapter);

  if (!validation.valid) {
    return fail({
      code: "adapter-invalid",
      message: validation.reason ?? "Game adapter is invalid.",
      details: { issues: toSerializableValidationIssues(validation) }
    });
  }

  const gameCode = normalizeGameCode(adapter.gameCode);

  if (gameCode.length === 0) {
    return invalidGameCodeResult(gameCode);
  }

  if (registry.adapters.has(gameCode)) {
    return fail({
      code: "adapter-duplicate-game-code",
      message: "A game adapter is already registered for this game code.",
      details: { gameCode }
    });
  }

  const adapters = new Map(registry.adapters);
  adapters.set(gameCode, adapter);

  return ok(createRegistryFromMap(adapters));
}

export function createGameAdapterRegistry(
  adapters: readonly GameAdapter[] = []
): GameAdapterRegistryResult<GameAdapterRegistry> {
  let registry = createEmptyGameAdapterRegistry();

  for (const adapter of adapters) {
    const result = registerGameAdapter(registry, adapter);

    if (!result.ok) {
      return result;
    }

    registry = result.value;
  }

  return ok(registry);
}

export function loadGameAdapters(
  adapters: readonly GameAdapter[]
): GameAdapterRegistryResult<GameAdapterRegistry> {
  return createGameAdapterRegistry(adapters);
}

export function getGameAdapter(
  registry: GameAdapterRegistry,
  gameCode: GameCode
): GameAdapterRegistryResult<GameAdapter> {
  const normalizedGameCode = normalizeGameCode(gameCode);

  if (normalizedGameCode.length === 0) {
    return invalidGameCodeResult(normalizedGameCode);
  }

  const adapter = registry.adapters.get(normalizedGameCode);

  if (!adapter) {
    return fail({
      code: "adapter-not-loaded",
      message: "No game adapter is registered for this game code.",
      details: { gameCode: normalizedGameCode }
    });
  }

  return ok(adapter);
}

export function listGameAdapters(registry: GameAdapterRegistry): GameAdapter[] {
  return [...registry.adapters.values()].sort((firstAdapter, secondAdapter) =>
    firstAdapter.gameCode.localeCompare(secondAdapter.gameCode)
  );
}

export function resolveGameAdapterForMatch(
  registry: GameAdapterRegistry,
  match: Pick<Match, "gameCode">
): GameAdapterRegistryResult<GameAdapter> {
  return getGameAdapter(registry, match.gameCode);
}

export function resolveGameAdapterForGame(
  registry: GameAdapterRegistry,
  game: Pick<GameInstance, "gameCode">
): GameAdapterRegistryResult<GameAdapter> {
  return getGameAdapter(registry, game.gameCode);
}
