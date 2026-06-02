import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DraftAction, Hero, ThemeConfig } from "@mmbt/shared-types";

import type { OverlayClientState, OverlayRuntimeState } from "../client/types";
import { OverlayRouteView } from "../routes/OverlayRouteView";
import { parseOverlayRoute } from "../routes/route";

const timestamp = "2026-06-02T06:00:00.000Z";

const heroes: Hero[] = [
  { id: "hero_moon", gameCode: "generic-moba", displayName: "Moon Sentinel" },
  { id: "hero_sun", gameCode: "generic-moba", displayName: "Solar Warden" }
];

const theme: ThemeConfig = {
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
};

const draftActions: DraftAction[] = [
  {
    id: "ban-blue-1:slot-0",
    phaseId: "ban-blue-1",
    type: "BAN",
    team: "BLUE",
    slotIndex: 0,
    heroId: "hero_moon",
    status: "LOCKED",
    createdAt: timestamp,
    lockedAt: timestamp
  },
  {
    id: "ban-red-1:slot-0",
    phaseId: "ban-red-1",
    type: "BAN",
    team: "RED",
    slotIndex: 0,
    heroId: null,
    status: "PENDING",
    createdAt: timestamp
  }
];

function createSnapshot(
  options: {
    graphicTakeState?: Partial<OverlayRuntimeState["production"]["graphicTakeState"]>;
    emergency?: Partial<OverlayRuntimeState["production"]["emergency"]>;
  } = {}
): OverlayRuntimeState {
  return {
    revision: 11,
    timestamp,
    eventPackageId: "sample-event",
    event: {
      id: "event_sample-2026",
      name: "Sample Event",
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
        format: "BO3",
        teams: {
          blue: "team_blue",
          red: "team_red"
        },
        score: {
          blue: 1,
          red: 0
        },
        currentGameNumber: 1,
        status: "READY",
        themeId: "default-theme",
        games: [
          {
            id: "game_001",
            matchId: "match_grand-final",
            gameNumber: 1,
            gameCode: "generic-moba",
            blueTeamId: "team_blue",
            redTeamId: "team_red",
            draftId: "draft_001",
            rulesetId: "generic-standard",
            themeId: "default-theme",
            status: "DRAFT_LIVE"
          }
        ]
      }
    ],
    teams: [
      { id: "team_blue", name: "Blue Meteors", shortName: "BLU" },
      { id: "team_red", name: "Red Titans", shortName: "RED" }
    ],
    sponsors: [],
    games: [],
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
          },
          {
            id: "ban-red-1",
            type: "BAN",
            team: "RED",
            count: 1,
            timeSeconds: 30,
            label: "Red Ban 1"
          }
        ]
      }
    ],
    themes: [theme],
    currentMatchId: "match_grand-final",
    currentGameId: "game_001",
    drafts: {
      draft_001: {
        id: "draft_001",
        matchId: "match_grand-final",
        gameId: "game_001",
        gameNumber: 1,
        gameCode: "generic-moba",
        rulesetId: "generic-standard",
        status: "LIVE",
        currentPhaseIndex: 1,
        currentPhase: {
          id: "ban-red-1",
          type: "BAN",
          team: "RED",
          count: 1,
          timeSeconds: 30,
          label: "Red Ban 1"
        },
        currentActionIds: ["ban-red-1:slot-0"],
        timer: {
          isRunning: true,
          remainingSeconds: 21,
          originalSeconds: 30,
          phaseStartedAt: timestamp
        },
        actionCounts: {
          total: 2,
          pending: 1,
          hover: 0,
          locked: 1,
          skipped: 0,
          cancelled: 0
        },
        lockedHeroIds: ["hero_moon"],
        bannedHeroIds: ["hero_moon"],
        pickedHeroIds: [],
        actions: draftActions,
        updatedAt: timestamp
      }
    },
    production: {
      id: "production",
      status: "DRAFT_LIVE",
      activeMatchId: "match_grand-final",
      activeGameNumber: 1,
      activeDraftId: "draft_001",
      graphicTakeState: {
        id: "graphic-take",
        graphicType: "DRAFT_OVERLAY",
        previewPayload: null,
        programPayload: null,
        status: "IDLE",
        updatedAt: timestamp,
        ...options.graphicTakeState
      },
      emergency: {
        active: false,
        message: null,
        ...options.emergency
      },
      overlaySafety: {
        readOnly: true,
        mutationAllowed: false
      },
      createdAt: timestamp,
      updatedAt: timestamp
    },
    adapters: [
      {
        gameCode: "generic-moba",
        displayName: "Generic MOBA",
        loaded: true,
        heroCount: heroes.length,
        rulesetCount: 1,
        capabilities: {
          supportsManualDraft: true,
          supportsClientReader: false,
          supportsIngameHud: false,
          supportsPostGameStats: false,
          supportsAssetSync: false
        },
        heroes
      }
    ],
    adapterStatus: {},
    availableAdapterIds: ["generic-moba"],
    health: {
      status: "OK",
      serverStartedAt: timestamp,
      socketClients: [],
      loadedEventPackageId: "sample-event",
      currentProductionState: "DRAFT_LIVE",
      adapterStatus: {},
      assetStatus: {
        missingAssets: [],
        warnings: []
      },
      emergencyReady: true,
      lastStateUpdateAt: timestamp
    }
  };
}

function createClientState(snapshot = createSnapshot()): OverlayClientState {
  return {
    socketStatus: "connected",
    snapshot,
    health: snapshot.health,
    lastUpdatedAt: timestamp,
    socketMessage: null
  };
}

function renderProgram(state = createClientState(), search = ""): string {
  return renderToStaticMarkup(
    <OverlayRouteView route={parseOverlayRoute("/overlay/program", search)} clientState={state} />
  );
}

describe("program overlay", () => {
  it("renders standby when no program payload exists and emergency is inactive", () => {
    const markup = renderProgram();

    expect(markup).toContain("Program Standby");
    expect(markup).toContain("No program graphic");
    expect(markup).toContain('data-canvas-size="1920x1080"');
  });

  it("renders emergency override when emergency is active", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        programPayload: {
          graphicType: "DRAFT_OVERLAY",
          matchId: "match_grand-final",
          draftId: "draft_001"
        },
        status: "ON_PROGRAM"
      },
      emergency: {
        active: true,
        message: "private raw emergency reason",
        triggeredAt: timestamp
      }
    });
    const markup = renderProgram(createClientState(snapshot));

    expect(markup).toContain('data-emergency-active="true"');
    expect(markup).toContain("Technical Pause");
    expect(markup).not.toContain("private raw emergency reason");
    expect(markup).not.toContain("Moon Sentinel");
  });

  it("renders a supported program draft payload when available", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        programPayload: {
          graphicType: "DRAFT_OVERLAY",
          matchId: "match_grand-final",
          draftId: "draft_001"
        },
        status: "ON_PROGRAM"
      }
    });
    const markup = renderProgram(createClientState(snapshot));

    expect(markup).toContain('data-testid="program-graphic"');
    expect(markup).toContain('data-graphic-type="DRAFT_OVERLAY"');
    expect(markup).toContain('data-testid="draft-overlay"');
    expect(markup).toContain("Moon Sentinel");
  });

  it("does not render preview-only payload as program", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        previewPayload: {
          graphicType: "DRAFT_OVERLAY",
          matchId: "match_grand-final",
          draftId: "draft_001"
        },
        programPayload: null,
        status: "PREVIEW"
      }
    });
    const markup = renderProgram(createClientState(snapshot));

    expect(markup).toContain("Program Standby");
    expect(markup).not.toContain("Moon Sentinel");
    expect(markup).not.toContain('data-testid="draft-overlay"');
  });

  it("renders unsupported graphic types safely and exposes details only in debug mode", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        graphicType: "LOWER_THIRD",
        programPayload: {
          graphicType: "LOWER_THIRD",
          matchId: "match_grand-final",
          privateNote: "private operator note"
        },
        status: "ON_PROGRAM"
      }
    });
    const normalMarkup = renderProgram(createClientState(snapshot));
    const debugMarkup = renderProgram(createClientState(snapshot), "?debug=1");

    expect(normalMarkup).toContain("Unsupported Graphic");
    expect(normalMarkup).not.toContain("LOWER_THIRD");
    expect(normalMarkup).not.toContain("private operator note");

    expect(debugMarkup).toContain("Graphic Diagnostics");
    expect(debugMarkup).toContain("LOWER_THIRD");
    expect(debugMarkup).toContain("Payload");
    expect(debugMarkup).not.toContain("private operator note");
  });

  it("does not render mutation controls", () => {
    const markup = renderProgram();

    [
      "Start Draft",
      "Pause Draft",
      "Resume Draft",
      "Hover",
      "Lock",
      "Undo",
      "Reset Draft",
      "Complete Draft",
      "Preview Graphic",
      "Take to Program",
      "Clear Program",
      "Trigger Emergency",
      "Clear Emergency"
    ].forEach((controlText) => {
      expect(markup).not.toContain(controlText);
    });
  });
});
