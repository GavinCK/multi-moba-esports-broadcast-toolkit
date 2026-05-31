import type { JsonValue } from "@mmbt/shared-types";

export interface ProductionEngineError {
  code: string;
  message: string;
  details?: JsonValue;
}

export type ProductionEngineResult<TValue> =
  | {
      ok: true;
      value: TValue;
      error?: undefined;
    }
  | {
      ok: false;
      value?: undefined;
      error: ProductionEngineError;
    };

export function ok<TValue>(value: TValue): ProductionEngineResult<TValue> {
  return { ok: true, value };
}

export function fail<TValue>(
  error: ProductionEngineError
): ProductionEngineResult<TValue> {
  return { ok: false, error };
}
