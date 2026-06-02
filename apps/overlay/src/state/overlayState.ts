import type { SocketEnvelope } from "@mmbt/shared-types";

import type {
  OverlayClientState,
  OverlayHealthResponse,
  OverlayHealthUpdatePayload,
  OverlayRuntimeState,
  OverlaySocketStatus,
  OverlayStateFullPayload
} from "../client/types";

export type OverlayAction =
  | {
      type: "socket:status";
      status: OverlaySocketStatus;
      message?: string;
    }
  | {
      type: "socket:state-full";
      envelope: SocketEnvelope<OverlayStateFullPayload>;
    }
  | {
      type: "socket:health-update";
      envelope: SocketEnvelope<OverlayHealthUpdatePayload>;
    }
  | {
      type: "socket:error";
      message: string;
    };

export const initialOverlayClientState: OverlayClientState = {
  socketStatus: "connecting",
  snapshot: null,
  health: null,
  lastUpdatedAt: null,
  socketMessage: null
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeRuntimeState(value: unknown): value is OverlayRuntimeState {
  return (
    isRecord(value) &&
    typeof value.revision === "number" &&
    typeof value.timestamp === "string" &&
    Array.isArray(value.matches) &&
    isRecord(value.production) &&
    isRecord(value.health)
  );
}

export function extractOverlayRuntimeState(
  payload: OverlayStateFullPayload
): OverlayRuntimeState {
  if (looksLikeRuntimeState(payload)) {
    return payload;
  }

  if (isRecord(payload) && looksLikeRuntimeState(payload.state)) {
    return payload.state;
  }

  throw new Error("state:full payload did not contain an overlay runtime state.");
}

function applySnapshot(
  state: OverlayClientState,
  snapshot: OverlayRuntimeState,
  health: OverlayHealthResponse = snapshot.health
): OverlayClientState {
  return {
    ...state,
    snapshot,
    health,
    lastUpdatedAt: snapshot.timestamp,
    socketMessage: null
  };
}

export function overlayReducer(
  state: OverlayClientState,
  action: OverlayAction
): OverlayClientState {
  switch (action.type) {
    case "socket:status":
      return {
        ...state,
        socketStatus: action.status,
        socketMessage: action.status === "error" ? action.message ?? null : null
      };
    case "socket:state-full": {
      const snapshot = extractOverlayRuntimeState(action.envelope.payload);

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
        socketMessage: action.message
      };
    default:
      return state;
  }
}
