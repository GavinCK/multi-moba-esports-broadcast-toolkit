import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardView } from "./App";
import type { DashboardRuntimeState } from "./client/types";
import type { DashboardClientState } from "./state/dashboardState";
import { initialDashboardState } from "./state/dashboardState";

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;

let mountedRoot: Root | null = null;
let mountedContainer: HTMLDivElement | null = null;

function createSnapshot(): DashboardRuntimeState {
  const health = {
    status: "OK" as const,
    serverStartedAt: "2026-06-01T00:00:00.000Z",
    now: "2026-06-01T00:00:05.000Z",
    uptimeSeconds: 5,
    socketClients: [],
    loadedEventPackageId: "sample-event",
    currentProductionState: "PRE_SHOW" as const,
    adapterStatus: {
      "generic-moba": {
        loaded: true,
        displayName: "Generic MOBA",
        heroCount: 10,
        rulesetCount: 1
      }
    },
    assetStatus: {
      missingAssets: [],
      warnings: []
    },
    emergencyReady: true,
    lastStateUpdateAt: "2026-06-01T00:00:05.000Z"
  };

  return {
    revision: 3,
    timestamp: "2026-06-01T00:00:05.000Z",
    eventPackageId: "sample-event",
    eventPackage: {
      packageId: "sample-event",
      packagePath: "event-packages/sample-event",
      schemaVersion: "0.1",
      defaults: {
        matchId: "match_grand-final",
        gameCode: "generic-moba",
        themeId: "default-theme",
        rulesetByGameCode: {
          "generic-moba": "generic-standard"
        },
        productionLogPath: "logs/production-log.jsonl"
      }
    },
    event: {
      id: "event_001",
      name: "Sample Invitational",
      timezone: "Asia/Hong_Kong",
      defaultLanguage: "en",
      gameCodes: ["generic-moba", "lol", "aov", "hok"]
    },
    teams: [
      {
        id: "team_blue",
        name: "Blue Meteors",
        shortName: "BLU"
      },
      {
        id: "team_red",
        name: "Red Titans",
        shortName: "RED"
      }
    ],
    players: [],
    sponsors: [],
    games: [
      {
        id: "game_001",
        matchId: "match_grand-final",
        gameNumber: 1,
        gameCode: "generic-moba",
        blueTeamId: "team_blue",
        redTeamId: "team_red",
        draftId: "draft_generic-001",
        rulesetId: "generic-standard",
        status: "DRAFT_READY"
      }
    ],
    matches: [
      {
        id: "match_grand-final",
        eventId: "event_001",
        gameCode: "generic-moba",
        title: "Grand Final",
        format: "BO3",
        teams: {
          blue: "team_blue",
          red: "team_red"
        },
        score: {
          blue: 0,
          red: 0
        },
        currentGameNumber: 1,
        status: "READY",
        games: [
          {
            id: "game_001",
            matchId: "match_grand-final",
            gameNumber: 1,
            gameCode: "generic-moba",
            blueTeamId: "team_blue",
            redTeamId: "team_red",
            draftId: "draft_generic-001",
            rulesetId: "generic-standard",
            status: "DRAFT_READY"
          }
        ]
      }
    ],
    rulesets: [
      {
        id: "generic-standard",
        gameCode: "generic-moba",
        name: "Generic Standard"
      }
    ],
    themes: [
      {
        id: "default-theme",
        name: "Default"
      }
    ],
    currentMatchId: "match_grand-final",
    currentGameId: "game_001",
    drafts: {
      "draft_generic-001": {
        id: "draft_generic-001",
        matchId: "match_grand-final",
        gameId: "game_001",
        gameNumber: 1,
        gameCode: "generic-moba",
        rulesetId: "generic-standard",
        status: "READY",
        currentPhaseIndex: 0,
        currentPhase: {
          id: "ban_1",
          type: "BAN",
          team: "BLUE",
          count: 1,
          timeSeconds: 30,
          label: "Blue ban"
        },
        currentActionIds: ["ban_1_1"],
        timer: {
          isRunning: false,
          remainingSeconds: 30,
          originalSeconds: 30
        },
        actionCounts: {
          total: 20,
          pending: 20,
          hover: 0,
          locked: 0,
          skipped: 0,
          cancelled: 0
        },
        lockedHeroIds: [],
        bannedHeroIds: [],
        pickedHeroIds: []
      }
    },
    production: {
      id: "production",
      status: "PRE_SHOW",
      activeMatchId: "match_grand-final",
      activeGameNumber: 1,
      activeDraftId: "draft_generic-001",
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
    adapters: [
      {
        gameCode: "generic-moba",
        displayName: "Generic MOBA",
        loaded: true,
        heroCount: 10,
        rulesetCount: 1,
        source: "LOCAL_STATIC_SAMPLE",
        capabilities: {
          supportsManualDraft: true,
          supportsClientReader: false,
          supportsIngameHud: false,
          supportsPostGameStats: false,
          supportsAssetSync: false
        }
      }
    ],
    adapterStatus: health.adapterStatus,
    availableAdapterIds: ["generic-moba"],
    validationWarnings: {
      eventPackage: [],
      adapters: []
    },
    health
  };
}

function createReadyState(): DashboardClientState {
  const snapshot = createSnapshot();

  return {
    ...initialDashboardState,
    loadStatus: "ready",
    socketStatus: "connected",
    snapshot,
    health: snapshot.health,
    lastUpdatedAt: snapshot.timestamp
  };
}

function renderDashboard(state: DashboardClientState): HTMLDivElement {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.appendChild(container);
  mountedRoot = root;
  mountedContainer = container;

  act(() => {
    root.render(<DashboardView state={state} onRefresh={vi.fn()} />);
  });

  return container;
}

afterEach(() => {
  if (mountedRoot) {
    act(() => {
      mountedRoot?.unmount();
    });
  }

  mountedContainer?.remove();
  mountedRoot = null;
  mountedContainer = null;
});

describe("DashboardView", () => {
  it("renders loading state", () => {
    const container = renderDashboard({
      ...initialDashboardState,
      loadStatus: "loading"
    });

    expect(container.textContent).toContain("Loading current server state.");
  });

  it("renders current health, event, match, adapter, draft, and production summaries", () => {
    const container = renderDashboard(createReadyState());
    const text = container.textContent ?? "";

    expect(text).toContain("Sample Invitational");
    expect(text).toContain("Grand Final");
    expect(text).toContain("BLU - Blue Meteors");
    expect(text).toContain("RED - Red Titans");
    expect(text).toContain("Generic MOBA");
    expect(text).toContain("draft_generic-001");
    expect(text).toContain("PRE_SHOW");
  });

  it("renders a clear error state", () => {
    const container = renderDashboard({
      ...initialDashboardState,
      loadStatus: "error",
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to fetch"
      }
    });

    expect(container.textContent).toContain("NETWORK_ERROR");
    expect(container.textContent).toContain("Failed to fetch");
  });

  it("does not render mutation controls or overlay routes in TQ-080", () => {
    const container = renderDashboard(createReadyState());
    const buttonText = Array.from(container.querySelectorAll("button"))
      .map((button) => button.textContent?.trim())
      .join(" ");
    const allText = container.textContent ?? "";

    expect(buttonText).toBe("Refresh");
    expect(buttonText).not.toMatch(/Start Draft|Lock|Undo|Reset|Complete|Take|Clear Program|Trigger Emergency/u);
    expect(allText).not.toContain("/overlay/");
  });
});
