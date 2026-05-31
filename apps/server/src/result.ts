import type { ApiResponse, JsonValue } from "@mmbt/shared-types";

export interface AppError {
  code: string;
  message: string;
  httpStatus: number;
  details?: unknown;
}

export type AppResult<TValue> =
  | {
      ok: true;
      value: TValue;
      error?: undefined;
    }
  | {
      ok: false;
      value?: undefined;
      error: AppError;
    };

export function ok<TValue>(value: TValue): AppResult<TValue> {
  return { ok: true, value };
}

export function fail<TValue>(error: AppError): AppResult<TValue> {
  return { ok: false, error };
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function apiSuccess<TData>(data: TData): ApiResponse<TData> {
  return { ok: true, data };
}

export function apiError(error: AppError): ApiResponse<never> {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details === undefined ? undefined : toJsonValue(error.details)
    }
  };
}
