import type { SocketEnvelope } from "@mmbt/shared-types";

import type {
  DashboardClientError,
  DashboardHealthResponse,
  DashboardHealthUpdatePayload,
  DashboardRuntimeState,
  DashboardStateFullPayload
} from "../client/types";

export type DashboardLoadStatus = "idle" | "loading" | "ready" | "error";
export type DashboardSocketStatus =
  | "disabled"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface DashboardClientState {
  loadStatus: DashboardLoadStatus;
  socketStatus: DashboardSocketStatus;
  snapshot: DashboardRuntimeState | null;
  health: DashboardHealthResponse | null;
  error: DashboardClientError | null;
  socketError: string | null;
  lastUpdatedAt: string | null;
}

export type DashboardAction =
  | { type: "rest:loading" }
  | {
      type: "rest:success";
      health: DashboardHealthResponse;
      snapshot: DashboardRuntimeState;
    }
  | { type: "rest:error"; error: DashboardClientError }
  | {
      type: "socket:status";
      status: DashboardSocketStatus;
      message?: string;
    }
  | {
      type: "socket:state-full";
      envelope: SocketEnvelope<DashboardStateFullPayload>;
    }
  | {
      type: "socket:health-update";
      envelope: SocketEnvelope<DashboardHealthUpdatePayload>;
    }
  | {
      type: "socket:error";
      message: string;
    };

export const initialDashboardState: DashboardClientState = {
  loadStatus: "idle",
  socketStatus: "disabled",
  snapshot: null,
  health: null,
  error: null,
  socketError: null,
  lastUpdatedAt: null
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeRuntimeState(value: unknown): value is DashboardRuntimeState {
  return (
    isRecord(value) &&
    typeof value.revision === "number" &&
    typeof value.timestamp === "string" &&
    isRecord(value.production) &&
    isRecord(value.health)
  );
}

export function extractRuntimeState(
  payload: DashboardStateFullPayload
): DashboardRuntimeState {
  if (looksLikeRuntimeState(payload)) {
    return payload;
  }

  if (isRecord(payload) && looksLikeRuntimeState(payload.state)) {
    return payload.state;
  }

  throw new Error("state:full payload did not contain a dashboard runtime state.");
}

function applySnapshot(
  state: DashboardClientState,
  snapshot: DashboardRuntimeState,
  health: DashboardHealthResponse = snapshot.health
): DashboardClientState {
  return {
    ...state,
    loadStatus: "ready",
    snapshot,
    health,
    error: null,
    lastUpdatedAt: snapshot.timestamp
  };
}

export function dashboardReducer(
  state: DashboardClientState,
  action: DashboardAction
): DashboardClientState {
  switch (action.type) {
    case "rest:loading":
      return {
        ...state,
        loadStatus: state.snapshot ? "ready" : "loading",
        error: null
      };
    case "rest:success":
      return applySnapshot(state, action.snapshot, action.health);
    case "rest:error":
      return {
        ...state,
        loadStatus: state.snapshot ? "ready" : "error",
        error: action.error
      };
    case "socket:status":
      return {
        ...state,
        socketStatus: action.status,
        socketError: action.status === "error" ? action.message ?? null : null
      };
    case "socket:state-full": {
      const snapshot = extractRuntimeState(action.envelope.payload);

      return applySnapshot(state, snapshot);
    }
    case "socket:health-update":
      return {
        ...state,
        health: action.envelope.payload.health,
        snapshot: state.snapshot
          ? {
              ...state.snapshot,
              health: action.envelope.payload.health
            }
          : state.snapshot
      };
    case "socket:error":
      return {
        ...state,
        socketError: action.message
      };
    default:
      return state;
  }
}
