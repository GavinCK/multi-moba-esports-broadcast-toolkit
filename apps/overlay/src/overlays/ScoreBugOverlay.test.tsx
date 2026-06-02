import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { OverlayClientState, OverlayRuntimeState } from "../client/types";
import { OverlayRouteView } from "../routes/OverlayRouteView";
import { parseOverlayRoute } from "../routes/route";

const timestamp = "2026-06-02T06:00:00.000Z";

function createSnapshot(overrides: Partial<OverlayRuntimeState> = {}): OverlayRuntimeState {
  return {
    revision: 42,
    timestamp,
    eventPackageId: "sample-event",
    event: {
      id: "event_sample-2026",
      name: "Sample Invitational",
      shortName: "Sample Invitational",
      timezone: "Asia/Hong_Kong",
      defaultLanguage: "en",
      gameCodes: ["generic-moba"]
    },
    matches: [
      {
        id: "match_grand-final",
        eventId: "event_sample-2026",
        gameCode: "generic-moba",
        title: "Grand Final",
        format: "BO5",
        teams: {
          blue: "team_blue",
          red: "team_red"
        },
        score: {
          blue: 1,
          red: 0
        },
        currentGameNumber: 2,
        status: "LIVE",
        sponsorSlotIds: ["sponsor_scorebug"],
        themeId: "default-theme",
        games: [
          {
            id: "game_002",
            matchId: "match_grand-final",
            gameNumber: 2,
            gameCode: "generic-moba",
            blueTeamId: "team_blue",
            redTeamId: "team_red",
            draftId: "draft_002",
            rulesetId: "generic-standard",
            themeId: "default-theme",
            status: "GAME_LIVE"
          }
        ]
      }
    ],
    teams: [
      {
        id: "team_blue",
        name: "Blue Meteors",
        shortName: "BLU",
        primaryColor: "#2563eb"
      },
      {
        id: "team_red",
        name: "Red Titans",
        shortName: "RED",
        logoUrl: "assets/team-logos/red.svg",
        primaryColor: "#dc2626"
      }
    ],
    sponsors: [
      {
        id: "sponsor_scorebug",
        name: "Local LAN Studios",
        logoUrl: "assets/sponsor-logos/local.svg",
        slots: ["SCORE_BUG", "PRESENTED_BY"]
      }
    ],
    games: [],
    rulesets: [],
    themes: [
      {
        id: "default-theme",
        name: "Default Theme",
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
          bodyFont: "Inter",
          numberFont: "Roboto Mono"
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
    currentGameId: "game_002",
    drafts: {},
    production: {
      id: "production",
      status: "GAME_LIVE",
      activeMatchId: "match_grand-final",
      activeGameNumber: 2,
      activeDraftId: "draft_002",
      graphicTakeState: {
        id: "graphic-take",
        graphicType: "SCORE_BUG",
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
      currentProductionState: "GAME_LIVE",
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
    },
    ...overrides
  };
}

function createClientState(
  snapshot = createSnapshot(),
  overrides: Partial<OverlayClientState> = {}
): OverlayClientState {
  return {
    socketStatus: "connected",
    snapshot,
    health: snapshot.health,
    lastUpdatedAt: timestamp,
    socketMessage: null,
    ...overrides
  };
}

function renderScoreBug(
  path = "/overlay/scorebug/match_grand-final",
  search = "",
  state = createClientState()
): string {
  return renderToStaticMarkup(
    <OverlayRouteView route={parseOverlayRoute(path, search)} clientState={state} />
  );
}

describe("score bug overlay", () => {
  it("renders the full score bug overlay when data exists", () => {
    const markup = renderScoreBug();

    expect(markup).toContain('data-testid="scorebug-overlay"');
    expect(markup).toContain("Grand Final");
    expect(markup).toContain("Sample Invitational");
    expect(markup).toContain("Series");
    expect(markup).toContain("Local LAN Studios");
  });

  it("renders blue and red team names with logo fallback", () => {
    const markup = renderScoreBug();

    expect(markup).toContain("BLU");
    expect(markup).toContain("Blue Meteors");
    expect(markup).toContain("RED");
    expect(markup).toContain("Red Titans");
    expect(markup).toContain('data-team-logo="fallback"');
    expect(markup).toContain('data-team-logo="asset"');
  });

  it("renders current score from public match state", () => {
    const markup = renderScoreBug();

    expect(markup).toContain('data-score-source="match.score"');
    expect(markup).toContain("<strong><span>1</span><b");
    expect(markup).toContain("</b><span>0</span></strong>");
  });

  it("renders current game number, format, and compact match context", () => {
    const markup = renderScoreBug();

    expect(markup).toContain("Game 2 of 5");
    expect(markup).toContain("BO5");
    expect(markup).toContain("Live");
  });

  it("renders a safe missing match state", () => {
    const markup = renderScoreBug("/overlay/scorebug/missing-match");

    expect(markup).toContain("Match not found");
    expect(markup).toContain("Safe score bug standby");
    expect(markup).not.toContain("Start Draft");
  });

  it("renders a safe missing logo state without remote recovery", () => {
    const snapshot = createSnapshot({
      teams: [
        {
          id: "team_blue",
          name: "Blue Meteors",
          shortName: "BLU",
          logoUrl: "https://example.invalid/blue.svg"
        },
        {
          id: "team_red",
          name: "Red Titans",
          shortName: "RED"
        }
      ]
    });
    const markup = renderScoreBug("/overlay/scorebug/match_grand-final", "", createClientState(snapshot));

    expect(markup.match(/data-team-logo="fallback"/g)).toHaveLength(2);
    expect(markup).not.toContain("https://example.invalid/blue.svg");
  });

  it("renders a neutral placeholder when score is missing or invalid", () => {
    const baseSnapshot = createSnapshot();
    const snapshot = createSnapshot({
      matches: [
        {
          ...baseSnapshot.matches[0],
          score: {
            blue: undefined as unknown as number,
            red: Number.NaN
          }
        }
      ]
    });
    const markup = renderScoreBug("/overlay/scorebug/match_grand-final", "", createClientState(snapshot));

    expect(markup).toContain('data-score-source="unavailable"');
    expect(markup).toContain("<strong><span>-</span><b");
    expect(markup).toContain("</b><span>-</span></strong>");
  });

  it("renders safe disconnected and stale states", () => {
    const unavailableMarkup = renderScoreBug(
      "/overlay/scorebug/match_grand-final",
      "",
      createClientState(createSnapshot(), {
        socketStatus: "disconnected",
        snapshot: null,
        health: null
      })
    );
    const staleMarkup = renderScoreBug(
      "/overlay/scorebug/match_grand-final",
      "",
      createClientState(createSnapshot(), { socketStatus: "disconnected" })
    );

    expect(unavailableMarkup).toContain("Signal unavailable");
    expect(staleMarkup).toContain('data-connection-state="stale"');
  });

  it("shows public-safe debug diagnostics only in debug mode", () => {
    const normalMarkup = renderScoreBug();
    const debugMarkup = renderScoreBug("/overlay/scorebug/match_grand-final", "?debug=1");

    expect(normalMarkup).not.toContain("Score Bug Diagnostics");
    expect(normalMarkup).not.toContain("Route match");
    expect(normalMarkup).not.toContain("Warnings");
    expect(debugMarkup).toContain("Score Bug Diagnostics");
    expect(debugMarkup).toContain("match_grand-final");
    expect(debugMarkup).toContain("match.score");
    expect(debugMarkup).toContain("team_blue / team_red");
    expect(debugMarkup).toContain("connected");
    expect(debugMarkup).toContain("42");
    expect(debugMarkup).toContain(timestamp);
    expect(debugMarkup).not.toContain("raw-socket-id-123");
    expect(debugMarkup).not.toContain("C:\\private\\production-log.jsonl");
    expect(debugMarkup).not.toContain("private raw emergency reason");
  });

  it("does not render mutation controls", () => {
    const markup = renderScoreBug();

    [
      "Start Draft",
      "Pause Draft",
      "Resume Draft",
      "Hover",
      "Lock",
      "Undo",
      "Reset Draft",
      "Complete Draft",
      "Preview",
      "Take to Program",
      "Clear Program",
      "Trigger Emergency",
      "Clear Emergency"
    ].forEach((controlText) => {
      expect(markup).not.toContain(controlText);
    });
  });

  it("keeps browser-source fixed compact layout markers", () => {
    const markup = renderScoreBug();

    expect(markup).toContain("overlay-canvas--scorebug");
    expect(markup).toContain('data-canvas-size="1920x1080"');
    expect(markup).toContain("scorebug-overlay--compact");
    expect(markup).toContain('data-layout="fixed-compact"');
  });
});
