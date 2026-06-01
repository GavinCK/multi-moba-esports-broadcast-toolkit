import type { SocketEnvelope } from "@mmbt/shared-types";
import { describe, expect, it } from "vitest";

import type { DashboardHealthResponse, DashboardRuntimeState } from "../client/types";
import {
  dashboardReducer,
  extractRuntimeState,
  initialDashboardState
} from "./dashboardState";

function createHealth(): DashboardHealthResponse {
  return {
    status: "OK",
    serverStartedAt: "2026-06-01T00:00:00.000Z",
    now: "2026-06-01T00:00:05.000Z",
    uptimeSeconds: 5,
    socketClients: [],
    loadedEventPackageId: "sample-event",
    currentProductionState: "PRE_SHOW",
    adapterStatus: {},
    assetStatus: {
      missingAssets: [],
      warnings: []
    },
    emergencyReady: true,
    lastStateUpdateAt: "2026-06-01T00:00:05.000Z"
  };
}

function createSnapshot(): DashboardRuntimeState {
  const health = createHealth();

  return {
    revision: 7,
    timestamp: "2026-06-01T00:00:05.000Z",
    eventPackageId: "sample-event",
    event: {
      id: "event_001",
      name: "Sample Invitational",
      timezone: "Asia/Hong_Kong",
      defaultLanguage: "en",
      gameCodes: ["generic-moba"]
    },
    matches: [],
    teams: [],
    players: [],
    sponsors: [],
    games: [],
    rulesets: [],
    themes: [],
    currentMatchId: null,
    currentGameId: null,
    drafts: {},
    production: {
      id: "production",
      status: "PRE_SHOW",
      activeMatchId: null,
      activeGameNumber: null,
      activeDraftId: null,
      graphicTakeState: {
        id: "graphic",
        graphicType: "DRAFT_OVERLAY",
        previewPayload: null,
        programPayload: null,
        status: "IDLE"
      },
      emergency: {
        active: false,
        message: null
      },
      overlaySafety: {
        readOnly: true,
        mutationAllowed: false
      },
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z"
    },
    adapters: [],
    adapterStatus: {},
    availableAdapterIds: [],
    validationWarnings: {
      eventPackage: [],
      adapters: []
    },
    health
  };
}

function createEnvelope<TPayload>(payload: TPayload): SocketEnvelope<TPayload> {
  return {
    type: "state:full",
    timestamp: "2026-06-01T00:00:06.000Z",
    payload
  };
}

describe("dashboardReducer", () => {
  it("stores REST health and state snapshots", () => {
    const snapshot = createSnapshot();
    const state = dashboardReducer(initialDashboardState, {
      type: "rest:success",
      health: snapshot.health,
      snapshot
    });

    expect(state.loadStatus).toBe("ready");
    expect(state.snapshot?.revision).toBe(7);
    expect(state.health?.loadedEventPackageId).toBe("sample-event");
  });

  it("applies implemented state:full socket snapshots", () => {
    const snapshot = createSnapshot();
    const state = dashboardReducer(initialDashboardState, {
      type: "socket:state-full",
      envelope: createEnvelope(snapshot)
    });

    expect(state.loadStatus).toBe("ready");
    expect(state.snapshot?.event?.name).toBe("Sample Invitational");
  });

  it("applies documented state:full socket payloads", () => {
    const snapshot = createSnapshot();
    const extracted = extractRuntimeState({
      revision: snapshot.revision,
      timestamp: snapshot.timestamp,
      state: snapshot
    });

    expect(extracted).toBe(snapshot);
  });
});
