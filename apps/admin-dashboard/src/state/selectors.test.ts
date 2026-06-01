import { describe, expect, it } from "vitest";

import type { DashboardRuntimeState } from "../client/types";
import {
  createDashboardHealthSummary,
  findTeam,
  getMatchSetupWarnings,
  getPlayersForTeam,
  getSelectedMatch,
  getSponsorsForMatch
} from "./selectors";

function createSnapshot(): DashboardRuntimeState {
  const health = {
    status: "OK" as const,
    serverStartedAt: "2026-06-01T00:00:00.000Z",
    now: "2026-06-01T00:00:05.000Z",
    uptimeSeconds: 5,
    socketClients: [
      {
        id: "socket_hidden_id",
        role: "ADMIN" as const,
        panel: "admin-dashboard",
        connectedAt: "2026-06-01T00:00:01.000Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      }
    ],
    loadedEventPackageId: "sample-event",
    currentProductionState: "DRAFT_READY" as const,
    adapterStatus: {
      "generic-moba": {
        loaded: true,
        displayName: "Generic MOBA",
        heroCount: 10,
        rulesetCount: 1
      }
    },
    assetStatus: {
      missingAssets: ["assets/missing.svg"],
      warnings: ["missing local optional asset"]
    },
    emergencyReady: true,
    lastStateUpdateAt: "2026-06-01T00:00:05.000Z",
    validationWarnings: {
      eventPackage: [],
      adapters: []
    }
  };

  return {
    revision: 11,
    timestamp: "2026-06-01T00:00:05.000Z",
    eventPackageId: "sample-event",
    event: {
      id: "event_001",
      name: "Sample Invitational",
      timezone: "Asia/Hong_Kong",
      defaultLanguage: "en",
      gameCodes: ["generic-moba"]
    },
    matches: [
      {
        id: "match_001",
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
        sponsorSlotIds: ["sponsor_001"],
        themeId: "theme_001",
        games: [
          {
            id: "game_001",
            matchId: "match_001",
            gameNumber: 1,
            gameCode: "generic-moba",
            blueTeamId: "team_blue",
            redTeamId: "team_red",
            draftId: "draft_001",
            rulesetId: "ruleset_001",
            status: "DRAFT_READY"
          }
        ]
      }
    ],
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
    players: [
      {
        id: "player_blue",
        teamId: "team_blue",
        displayName: "BlueAtlas"
      }
    ],
    sponsors: [
      {
        id: "sponsor_001",
        name: "Local LAN Studios",
        logoUrl: "assets/sponsor.svg",
        slots: ["PRESENTED_BY"]
      }
    ],
    games: [
      {
        id: "game_001",
        matchId: "match_001",
        gameNumber: 1,
        gameCode: "generic-moba",
        blueTeamId: "team_blue",
        redTeamId: "team_red",
        draftId: "draft_001",
        rulesetId: "ruleset_001",
        status: "DRAFT_READY"
      }
    ],
    rulesets: [
      {
        id: "ruleset_001",
        gameCode: "generic-moba",
        name: "Generic Standard"
      }
    ],
    themes: [
      {
        id: "theme_001",
        name: "Default"
      }
    ],
    currentMatchId: "match_001",
    currentGameId: "game_001",
    drafts: {
      draft_001: {
        id: "draft_001",
        matchId: "match_001",
        gameId: "game_001",
        gameNumber: 1,
        gameCode: "generic-moba",
        rulesetId: "ruleset_001",
        status: "READY",
        currentPhaseIndex: 0,
        currentPhase: null,
        currentActionIds: [],
        timer: {
          isRunning: false,
          remainingSeconds: 0,
          originalSeconds: 0
        },
        actionCounts: {
          total: 0,
          pending: 0,
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
      status: "DRAFT_READY",
      activeMatchId: "match_001",
      activeGameNumber: 1,
      activeDraftId: "draft_001",
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
    validationWarnings: health.validationWarnings,
    health
  };
}

describe("dashboard selectors", () => {
  it("derives selected match setup data from the current state", () => {
    const snapshot = createSnapshot();
    const selectedMatch = getSelectedMatch(snapshot, null);

    expect(selectedMatch?.id).toBe("match_001");
    expect(findTeam(snapshot, selectedMatch?.teams.blue)?.name).toBe("Blue Meteors");
    expect(getPlayersForTeam(snapshot, "team_blue")).toHaveLength(1);
    expect(getSponsorsForMatch(snapshot, selectedMatch).map((sponsor) => sponsor.name)).toEqual([
      "Local LAN Studios"
    ]);
    expect(getMatchSetupWarnings(snapshot, selectedMatch)).toEqual([]);
  });

  it("reports setup warnings for missing selected match references", () => {
    const snapshot = createSnapshot();
    const brokenMatch = {
      ...snapshot.matches[0],
      teams: {
        blue: "missing_blue",
        red: "team_red"
      },
      games: [
        {
          ...snapshot.matches[0].games[0],
          gameCode: "missing-game",
          rulesetId: "missing-ruleset",
          draftId: "missing-draft"
        }
      ]
    };
    const warnings = getMatchSetupWarnings(snapshot, brokenMatch).map((warning) => warning.code);

    expect(warnings).toContain("BLUE_TEAM_MISSING");
    expect(warnings).toContain("GAME_ADAPTER_UNAVAILABLE");
    expect(warnings).toContain("RULESET_NOT_LISTED");
    expect(warnings).toContain("DRAFT_NOT_READY");
  });

  it("summarizes health without leaking raw client identifiers", () => {
    const snapshot = createSnapshot();
    const summary = createDashboardHealthSummary({
      snapshot,
      health: snapshot.health,
      socketStatus: "connected",
      loadStatus: "ready"
    });

    expect(summary.loadedEventPackageId).toBe("sample-event");
    expect(summary.revision).toBe(11);
    expect(summary.connectedClientCount).toBe(1);
    expect(summary.connectedClientGroups).toEqual(["ADMIN / admin-dashboard"]);
    expect(summary.connectedClientGroups.join(" ")).not.toContain("socket_hidden_id");
    expect(summary.missingAssetCount).toBe(1);
    expect(summary.healthWarningCount).toBe(1);
  });
});
