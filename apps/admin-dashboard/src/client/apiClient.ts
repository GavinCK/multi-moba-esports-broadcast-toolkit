import type { ApiResponse } from "@mmbt/shared-types";

import type {
  DashboardHealthResponse,
  DashboardRuntimeState
} from "./types";

export interface DashboardApiClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export class DashboardApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(input: {
    code: string;
    message: string;
    status?: number;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "DashboardApiError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return isRecord(value) && typeof value.ok === "boolean";
}

function createUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl || baseUrl.length === 0) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new DashboardApiError({
      code: "INVALID_RESPONSE",
      message: "Server response was not valid JSON.",
      status: response.status
    });
  }
}

export interface DashboardApiClient {
  get<TData>(path: string): Promise<TData>;
  post<TData>(path: string, body: Record<string, unknown>): Promise<TData>;
  patch<TData>(path: string, body: Record<string, unknown>): Promise<TData>;
  getHealth(): Promise<DashboardHealthResponse>;
  getState(): Promise<DashboardRuntimeState>;
}

export function createDashboardApiClient(
  options: DashboardApiClientOptions = {}
): DashboardApiClient {
  const fetchFn = options.fetchFn ?? fetch;

  async function request<TData>(
    path: string,
    init: RequestInit
  ): Promise<TData> {
    const response = await fetchFn(createUrl(options.baseUrl, path), init);
    const body = await readResponseJson(response);

    if (!isApiResponse(body)) {
      throw new DashboardApiError({
        code: "INVALID_RESPONSE",
        message: "Server response did not use the ApiResponse envelope.",
        status: response.status
      });
    }

    if (!body.ok) {
      throw new DashboardApiError({
        code: body.error?.code ?? "API_ERROR",
        message: body.error?.message ?? "Server returned an API error.",
        status: response.status,
        details: body.error?.details
      });
    }

    return body.data as TData;
  }

  return {
    get(path) {
      return request(path, {
        headers: {
          Accept: "application/json"
        }
      });
    },
    post(path, body) {
      return request(path, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    },
    patch(path, body) {
      return request(path, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    },
    getHealth() {
      return request<DashboardHealthResponse>("/api/health", {
        headers: {
          Accept: "application/json"
        }
      });
    },
    getState() {
      return request<DashboardRuntimeState>("/api/state", {
        headers: {
          Accept: "application/json"
        }
      });
    }
  };
}

export function toDashboardApiError(error: unknown): DashboardApiError {
  if (error instanceof DashboardApiError) {
    return error;
  }

  return new DashboardApiError({
    code: "NETWORK_ERROR",
    message: error instanceof Error ? error.message : "Dashboard request failed."
  });
}
