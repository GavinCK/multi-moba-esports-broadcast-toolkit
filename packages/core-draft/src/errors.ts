import type { JsonValue } from "@mmbt/shared-types";

export interface DraftEngineError {
  code: string;
  message: string;
  details?: JsonValue;
}

export type DraftEngineResult<TValue> =
  | {
      ok: true;
      value: TValue;
      error?: undefined;
    }
  | {
      ok: false;
      value?: undefined;
      error: DraftEngineError;
    };

export function ok<TValue>(value: TValue): DraftEngineResult<TValue> {
  return { ok: true, value };
}

export function fail<TValue>(error: DraftEngineError): DraftEngineResult<TValue> {
  return { ok: false, error };
}
