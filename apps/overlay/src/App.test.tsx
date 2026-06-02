import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { OverlayClientState, OverlayRuntimeState } from "./client/types";
import { OverlayRouteView } from "./routes/OverlayRouteView";
import { parseOverlayRoute } from "./routes/route";

const timestamp = "2026-06-02T06:00:00.000Z";

function createSnapshot(): OverlayRuntimeState {
  return {
    revision: 7,
    timestamp,
    eventPackageId: "sample-event",
    event: {
      id: "event_sample-2026",
      name: "Sample Invitational",
      timezone: "Asia/Hong_Kong",
      defaultLanguage: "en",
      gameCodes: ["generic-moba", "lol", "aov", "hok"]
    },
    matches: [
      {
        id: "match_grand-final",
        eventId: "event_sample-2026",
        gameCode: "generic-moba",
        title: "Grand Final",
        format: "BO3",
        teams: {
          blue: "team_blue-meteors",
          red: "team_red-titans"
        },
        score: {
          blue: 1,
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
            blueTeamId: "team_blue-meteors",
            redTeamId: "team_red-titans",
            draftId: "draft_game-001",
            rulesetId: "generic-standard",
            status: "DRAFT_READY"
          }
        ]
      }
    ],
    teams: [
      {
        id: "team_blue-meteors",
        name: "Blue Meteors",
        shortName: "BLU"
      },
      {
        id: "team_red-titans",
        name: "Red Titans",
        shortName: "RED"
      }
    ],
    sponsors: [],
    games: [
      {
        id: "game_001",
        matchId: "match_grand-final",
        gameNumber: 1,
        gameCode: "generic-moba",
        blueTeamId: "team_blue-meteors",
        redTeamId: "team_red-titans",
        draftId: "draft_game-001",
        rulesetId: "generic-standard",
        status: "DRAFT_READY"
      }
    ],
    rulesets: [
      {
        id: "generic-standard",
        gameCode: "generic-moba",
        name: "Generic Standard",
        allowDuplicateHeroes: false,
        globalBanAcrossSeries: false,
        globalPickAcrossSeries: false,
        phases: [
          {
            id: "ban-blue-1",
            type: "BAN",
            team: "BLUE",
            count: 1,
            timeSeconds: 30,
            label: "Blue Ban 1"
          }
        ]
      }
    ],
    themes: [
      {
        id: "default-theme",
        name: "Default",
        version: "0.1.0",
        colors: {
          background: "transparent",
          primary: "#2563eb",
          secondary: "#dc2626",
          accent: "#facc15",
          blueTeam: "#2563eb",
          redTeam: "#dc2626",
          textPrimary: "#f8fafc",
          textSecondary: "#cbd5e1"
        },
        typography: {
          headingFont: "Inter",
          bodyFont: "Inter"
        },
        layout: {
          safeMarginPx: 64,
          borderRadiusPx: 8,
          animationSpeedMs: 250
        },
        assets: {}
      }
    ],
    currentMatchId: "match_grand-final",
    currentGameId: "game_001",
    drafts: {},
    production: {
      id: "production",
      status: "PRE_SHOW",
      activeMatchId: "match_grand-final",
      activeGameNumber: 1,
      activeDraftId: "draft_game-001",
      graphicTakeState: {
        id: "graphic-take",
        graphicType: "DRAFT_OVERLAY",
        previewPayload: null,
        programPayload: null,
        status: "IDLE",
        updatedAt: timestamp
      },
      emergency: {
        active: true,
        message: "private raw emergency reason",
        triggeredAt: timestamp
      },
      overlaySafety: {
        readOnly: true,
        mutationAllowed: false
      },
      createdAt: timestamp,
      updatedAt: timestamp
    },
    adapters: [],
    adapterStatus: {},
    availableAdapterIds: ["generic-moba"],
    health: {
      status: "OK",
      serverStartedAt: timestamp,
      socketClients: [
        {
          id: "raw-socket-id-123",
          role: "VIEWER",
          panel: "overlay-shell",
          connectedAt: timestamp,
          lastSeenAt: timestamp
        }
      ],
      loadedEventPackageId: "sample-event",
      currentProductionState: "PRE_SHOW",
      adapterStatus: {},
      assetStatus: {
        missingAssets: [],
        warnings: []
      },
      auditLogStatus: {
        writable: true,
        path: "C:\\private\\production-log.jsonl"
      },
      emergencyReady: true,
      lastStateUpdateAt: timestamp
    }
  };
}

function createClientState(
  overrides: Partial<OverlayClientState> = {}
): OverlayClientState {
  const snapshot = createSnapshot();

  return {
    socketStatus: "connected",
    snapshot,
    health: snapshot.health,
    lastUpdatedAt: timestamp,
    socketMessage: null,
    ...overrides
  };
}

function renderRoute(path: string, search = "", state = createClientState()): string {
  return renderToStaticMarkup(
    <OverlayRouteView route={parseOverlayRoute(path, search)} clientState={state} />
  );
}

describe("overlay route shell", () => {
  it.each([
    ["/overlay/program", "Program Standby"],
    ["/overlay/preview", "Preview Standby"],
    ["/overlay/draft/match_grand-final", "Draft state unavailable"],
    ["/overlay/scorebug/match_grand-final", "scorebug-overlay"],
    ["/overlay/emergency", "Emergency Active"]
  ])("renders %s", (path, expectedText) => {
    expect(renderRoute(path)).toContain(expectedText);
  });

  it("renders a 1920x1080 browser-source shell marker", () => {
    const markup = renderRoute("/overlay/program");

    expect(markup).toContain("overlay-canvas");
    expect(markup).toContain('data-canvas-size="1920x1080"');
  });

  it("renders safe loading, disconnected, stale, and missing-match states", () => {
    expect(
      renderRoute("/overlay/program", "", createClientState({ snapshot: null, health: null }))
    ).toContain("Waiting for signal");
    expect(
      renderRoute(
        "/overlay/program",
        "",
        createClientState({
          socketStatus: "disconnected",
          snapshot: null,
          health: null
        })
      )
    ).toContain("Signal unavailable");
    expect(
      renderRoute(
        "/overlay/program",
        "",
        createClientState({
          socketStatus: "disconnected"
        })
      )
    ).toContain("Signal stale");
    expect(renderRoute("/overlay/draft/missing-match")).toContain("Match not found");
  });

  it("shows safe debug diagnostics only when debug mode is enabled", () => {
    const normalMarkup = renderRoute("/overlay/draft/match_grand-final");
    const debugMarkup = renderRoute("/overlay/draft/match_grand-final", "?debug=1");

    expect(normalMarkup).not.toContain("Revision");
    expect(normalMarkup).not.toContain(timestamp);
    expect(normalMarkup).not.toContain("Connection");

    expect(debugMarkup).toContain("Debug");
    expect(debugMarkup).toContain("Draft");
    expect(debugMarkup).toContain("/overlay/draft/match_grand-final");
    expect(debugMarkup).toContain("match_grand-final");
    expect(debugMarkup).toContain("connected");
    expect(debugMarkup).toContain("OK");
    expect(debugMarkup).toContain("7");
    expect(debugMarkup).toContain(timestamp);

    expect(debugMarkup).not.toContain("raw-socket-id-123");
    expect(debugMarkup).not.toContain("C:\\private\\production-log.jsonl");
    expect(debugMarkup).not.toContain("private raw emergency reason");
  });
});
