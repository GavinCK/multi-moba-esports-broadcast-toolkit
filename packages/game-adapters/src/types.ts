import type { GameAdapter, GameCode, JsonValue } from "@mmbt/shared-types";

export interface GameAdapterRegistry {
  readonly adapters: ReadonlyMap<GameCode, GameAdapter>;
}

export interface GameAdapterRegistryError {
  code: string;
  message: string;
  details?: JsonValue;
}

export type GameAdapterRegistryResult<TValue> =
  | {
      ok: true;
      value: TValue;
      error?: undefined;
    }
  | {
      ok: false;
      value?: undefined;
      error: GameAdapterRegistryError;
    };

export function ok<TValue>(value: TValue): GameAdapterRegistryResult<TValue> {
  return { ok: true, value };
}

export function fail<TValue>(
  error: GameAdapterRegistryError
): GameAdapterRegistryResult<TValue> {
  return { ok: false, error };
}
