import type { DraftFinalLineupState, SocketEnvelope } from "@mmbt/shared-types";

import type {
  OverlayClientState,
  OverlayHealthResponse,
  OverlayHealthUpdatePayload,
  OverlayRealtimeDraftPayload,
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
      type: "socket:draft-updated";
      envelope: SocketEnvelope<OverlayRealtimeDraftPayload>;
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
  const previousDrafts = state.snapshot?.drafts ?? {};
  const drafts = Object.fromEntries(
    Object.entries(snapshot.drafts).map(([draftId, draft]) => {
      const previousDraft = previousDrafts[draftId];

      return [
        draftId,
        previousDraft?.actions
          ? {
              ...draft,
              actions: previousDraft.actions
            }
          : draft
      ];
    })
  );

  return {
    ...state,
    snapshot: {
      ...snapshot,
      drafts
    },
    health,
    lastUpdatedAt: snapshot.timestamp,
    socketMessage: null
  };
}

function cloneFinalLineup(
  finalLineup: DraftFinalLineupState | undefined
): DraftFinalLineupState | undefined {
  return finalLineup
    ? {
        status: finalLineup.status,
        finalLineupBySide: {
          BLUE: finalLineup.finalLineupBySide.BLUE
            ? [...finalLineup.finalLineupBySide.BLUE]
            : undefined,
          RED: finalLineup.finalLineupBySide.RED
            ? [...finalLineup.finalLineupBySide.RED]
            : undefined
        },
        lineupPhaseStartedAt: finalLineup.lineupPhaseStartedAt,
        lineupConfirmedAt: finalLineup.lineupConfirmedAt,
        confirmedByOperatorId: finalLineup.confirmedByOperatorId,
        updatedAt: finalLineup.updatedAt
      }
    : undefined;
}

function applyDraftUpdate(
  state: OverlayClientState,
  envelope: SocketEnvelope<OverlayRealtimeDraftPayload>
): OverlayClientState {
  if (!state.snapshot) {
    return state;
  }

  const payload = envelope.payload;
  const draftId = payload.draftId;
  const summary = payload.draft.summary;
  const draft = payload.draft.draft;

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      revision:
        typeof payload.revision === "number"
          ? Math.max(state.snapshot.revision, payload.revision)
          : state.snapshot.revision,
      timestamp: envelope.timestamp,
      drafts: {
        ...state.snapshot.drafts,
        [draftId]: {
          ...summary,
          status: draft.status,
          currentPhaseIndex: draft.currentPhaseIndex,
          timer: { ...draft.timer },
          lockedHeroIds: [...draft.lockedHeroIds],
          bannedHeroIds: [...draft.bannedHeroIds],
          pickedHeroIds: [...draft.pickedHeroIds],
          finalLineup: cloneFinalLineup(draft.finalLineup ?? summary.finalLineup),
          actions: draft.actions.map((action) => ({ ...action })),
          updatedAt: draft.updatedAt ?? envelope.timestamp
        }
      }
    },
    lastUpdatedAt: envelope.timestamp
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
    case "socket:draft-updated":
      return applyDraftUpdate(state, action.envelope);
    case "socket:error":
      return {
        ...state,
        socketMessage: action.message
      };
    default:
      return state;
  }
}
