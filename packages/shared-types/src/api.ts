import type { JsonValue } from "./json";

export interface ApiError {
  code: string;
  message: string;
  details?: JsonValue;
}

export interface ApiResponse<TData = JsonValue> {
  ok: boolean;
  data?: TData;
  error?: ApiError;
}

export interface SocketEnvelope<TPayload = JsonValue> {
  type: string;
  timestamp: string;
  operatorId?: string;
  payload: TPayload;
}
