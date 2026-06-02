import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  DraftAction,
  DraftActionStatus,
  DraftActionType,
  DraftPhaseDefinition,
  DraftRuleset,
  Hero,
  TeamSide,
  ThemeConfig
} from "@mmbt/shared-types";

import type { OverlayClientState, OverlayRuntimeState } from "../client/types";
import { OverlayRouteView } from "../routes/OverlayRouteView";
import { parseOverlayRoute } from "../routes/route";

const timestamp = "2026-06-02T06:00:00.000Z";

const phases: DraftPhaseDefinition[] = [
  { id: "ban-blue-1", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 1" },
  { id: "ban-red-1", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 1" },
  { id: "ban-blue-2", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Ban 2" },
  { id: "ban-red-2", type: "BAN", team: "RED", count: 1, timeSeconds: 30, label: "Red Ban 2" },
  { id: "pick-blue-1", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Pick 1" },
  { id: "pick-red-1", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 1" },
  { id: "pick-blue-2", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30, label: "Blue Pick 2" },
  { id: "pick-red-2", type: "PICK", team: "RED", count: 1, timeSeconds: 30, label: "Red Pick 2" }
];

const heroes: Hero[] = [
  { id: "hero_moon", gameCode: "generic-moba", displayName: "Moon Sentinel", iconUrl: "assets/fallbacks/hero-icon.svg" },
  { id: "hero_sun", gameCode: "generic-moba", displayName: "Solar Warden" },
  { id: "hero_river", gameCode: "generic-moba", displayName: "River Guide" },
  { id: "hero_storm", gameCode: "generic-moba", displayName: "Storm Caller" },
  { id: "hero_ember", gameCode: "generic-moba", displayName: "Ember Guard" },
  { id: "hero_oath", gameCode: "generic-moba", displayName: "Oath Keeper" }
];

const ruleset: DraftRuleset = {
  id: "generic-test-ruleset",
  gameCode: "generic-moba",
  name: "Generic Test Ruleset",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: false,
  globalPickAcrossSeries: false,
  phases
};

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

function createAction(
  id: string,
  phaseId: string,
  type: DraftActionType,
  team: TeamSide,
  slotIndex: number,
  status: DraftActionStatus,
  heroId: string | null
): DraftAction {
  return {
    id,
    phaseId,
    type,
    team,
    slotIndex,
    status,
    heroId,
    createdAt: timestamp,
    lockedAt: status === "LOCKED" ? timestamp : undefined,
    hoveredAt: status === "HOVER" ? timestamp : undefined
  };
}

function createActions(status: "LIVE" | "COMPLETE" = "LIVE"): DraftAction[] {
  if (status === "COMPLETE") {
    return [
      createAction("ban-blue-1:slot-0", "ban-blue-1", "BAN", "BLUE", 0, "LOCKED", "hero_moon"),
      createAction("ban-red-1:slot-0", "ban-red-1", "BAN", "RED", 0, "LOCKED", "hero_sun"),
      createAction("ban-blue-2:slot-0", "ban-blue-2", "BAN", "BLUE", 0, "LOCKED", "hero_river"),
      createAction("ban-red-2:slot-0", "ban-red-2", "BAN", "RED", 0, "LOCKED", "hero_storm"),
      createAction("pick-blue-1:slot-0", "pick-blue-1", "PICK", "BLUE", 0, "LOCKED", "hero_ember"),
      createAction("pick-red-1:slot-0", "pick-red-1", "PICK", "RED", 0, "LOCKED", "hero_oath"),
      createAction("pick-blue-2:slot-0", "pick-blue-2", "PICK", "BLUE", 0, "LOCKED", "hero_sun"),
      createAction("pick-red-2:slot-0", "pick-red-2", "PICK", "RED", 0, "LOCKED", "hero_river")
    ];
  }

  return [
    createAction("ban-blue-1:slot-0", "ban-blue-1", "BAN", "BLUE", 0, "LOCKED", "hero_moon"),
    createAction("ban-red-1:slot-0", "ban-red-1", "BAN", "RED", 0, "HOVER", "hero_sun"),
    createAction("ban-blue-2:slot-0", "ban-blue-2", "BAN", "BLUE", 0, "PENDING", null),
    createAction("ban-red-2:slot-0", "ban-red-2", "BAN", "RED", 0, "PENDING", null),
    createAction("pick-blue-1:slot-0", "pick-blue-1", "PICK", "BLUE", 0, "LOCKED", "hero_ember"),
    createAction("pick-red-1:slot-0", "pick-red-1", "PICK", "RED", 0, "LOCKED", "hero_oath"),
    createAction("pick-blue-2:slot-0", "pick-blue-2", "PICK", "BLUE", 0, "PENDING", null),
    createAction("pick-red-2:slot-0", "pick-red-2", "PICK", "RED", 0, "SKIPPED", null)
  ];
}

function createSnapshot(overrides: Partial<OverlayRuntimeState> = {}): OverlayRuntimeState {
  const actions = createActions();

  return {
    revision: 9,
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
        sponsorSlotIds: ["sponsor_draft"],
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
            rulesetId: ruleset.id,
            themeId: "default-theme",
            status: "DRAFT_LIVE"
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
        id: "sponsor_draft",
        name: "Local LAN Studios",
        logoUrl: "assets/sponsor-logos/local.svg",
        slots: ["DRAFT", "PRESENTED_BY"]
      }
    ],
    games: [],
    rulesets: [ruleset],
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
        rulesetId: ruleset.id,
        status: "LIVE",
        currentPhaseIndex: 1,
        currentPhase: phases[1],
        currentActionIds: ["ban-red-1:slot-0"],
        timer: {
          isRunning: true,
          remainingSeconds: 24,
          originalSeconds: 30,
          phaseStartedAt: timestamp
        },
        actionCounts: {
          total: actions.length,
          pending: 3,
          hover: 1,
          locked: 3,
          skipped: 1,
          cancelled: 0
        },
        lockedHeroIds: ["hero_moon", "hero_ember", "hero_oath"],
        bannedHeroIds: ["hero_moon"],
        pickedHeroIds: ["hero_ember", "hero_oath"],
        actions,
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
        updatedAt: timestamp
      },
      emergency: {
        active: false,
        message: null
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
      currentProductionState: "DRAFT_LIVE",
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

function createClientState(snapshot = createSnapshot()): OverlayClientState {
  return {
    socketStatus: "connected",
    snapshot,
    health: snapshot.health,
    lastUpdatedAt: timestamp,
    socketMessage: null
  };
}

function renderDraft(path = "/overlay/draft/match_grand-final", search = "", state = createClientState()): string {
  return renderToStaticMarkup(
    <OverlayRouteView route={parseOverlayRoute(path, search)} clientState={state} />
  );
}

describe("draft overlay", () => {
  it("renders the full draft overlay when data exists", () => {
    const markup = renderDraft();

    expect(markup).toContain('data-testid="draft-overlay"');
    expect(markup).toContain("Grand Final");
    expect(markup).toContain("00:24");
    expect(markup).toContain("Red Ban 1");
    expect(markup).toContain("Active Side: Red");
    expect(markup).toContain("Live");
    expect(markup).toContain("Local LAN Studios");
  });

  it("renders blue and red team names with team logo fallback", () => {
    const markup = renderDraft();

    expect(markup).toContain("Blue Meteors");
    expect(markup).toContain("Red Titans");
    expect(markup).toContain('data-team-logo="fallback"');
    expect(markup).toContain('data-team-logo="asset"');
  });

  it("renders blue and red bans and picks from draft actions", () => {
    const markup = renderDraft();

    expect(markup).toContain("Blue Bans");
    expect(markup).toContain("Red Bans");
    expect(markup).toContain("Blue Picks");
    expect(markup).toContain("Red Picks");
    expect(markup).toContain("Moon Sentinel");
    expect(markup).toContain("Solar Warden");
    expect(markup).toContain("Ember Guard");
    expect(markup).toContain("Oath Keeper");
  });

  it("makes pending, hover, and locked states distinguishable", () => {
    const markup = renderDraft();

    expect(markup).toContain('data-slot-status="PENDING"');
    expect(markup).toContain('data-slot-status="HOVER"');
    expect(markup).toContain('data-slot-status="LOCKED"');
    expect(markup).toContain('data-slot-status="SKIPPED"');
    expect(markup).toContain("draft-slot--pending");
    expect(markup).toContain("draft-slot--hover");
    expect(markup).toContain("draft-slot--locked");
    expect(markup).toContain("Manual skip");
  });

  it("renders completed draft state while preserving final picks and bans", () => {
    const completeActions = createActions("COMPLETE");
    const snapshot = createSnapshot({
      drafts: {
        draft_001: {
          ...createSnapshot().drafts.draft_001,
          status: "COMPLETE",
          currentPhaseIndex: phases.length,
          currentPhase: null,
          currentActionIds: [],
          timer: {
            isRunning: false,
            remainingSeconds: 0,
            originalSeconds: 30
          },
          lockedHeroIds: completeActions.map((action) => action.heroId).filter(Boolean) as string[],
          bannedHeroIds: ["hero_moon", "hero_sun", "hero_river", "hero_storm"],
          pickedHeroIds: ["hero_ember", "hero_oath", "hero_sun", "hero_river"],
          actionCounts: {
            total: completeActions.length,
            pending: 0,
            hover: 0,
            locked: completeActions.length,
            skipped: 0,
            cancelled: 0
          },
          actions: completeActions
        }
      }
    });
    const markup = renderDraft("/overlay/draft/match_grand-final", "", createClientState(snapshot));

    expect(markup).toContain('data-draft-status="COMPLETE"');
    expect(markup).toContain("Draft Complete");
    expect(markup).toContain("Storm Caller");
    expect(markup).toContain("River Guide");
  });

  it("renders safe missing match and missing draft states", () => {
    expect(renderDraft("/overlay/draft/unknown-match")).toContain("Match not found");

    const snapshot = createSnapshot({ drafts: {} });
    const markup = renderDraft("/overlay/draft/match_grand-final", "", createClientState(snapshot));

    expect(markup).toContain("Draft state unavailable");
    expect(markup).toContain("No draft will be created from this overlay");
    expect(markup).toContain("Blue Meteors");
    expect(markup).toContain("Red Titans");
  });

  it("shows public-safe debug diagnostics only in debug mode", () => {
    const normalMarkup = renderDraft();
    const debugMarkup = renderDraft("/overlay/draft/match_grand-final", "?debug=1");

    expect(normalMarkup).not.toContain("Draft Diagnostics");
    expect(normalMarkup).not.toContain("Draft ID");
    expect(normalMarkup).not.toContain("Revision");
    expect(debugMarkup).toContain("Draft Diagnostics");
    expect(debugMarkup).toContain("draft_001");
    expect(debugMarkup).toContain("Red Ban 1");
    expect(debugMarkup).toContain("Revision");
    expect(debugMarkup).not.toContain("raw-socket-id-123");
    expect(debugMarkup).not.toContain("C:\\private\\production-log.jsonl");
  });

  it("does not render mutation controls", () => {
    const markup = renderDraft();

    [
      "Start Draft",
      "Pause Draft",
      "Resume Draft",
      "Undo",
      "Reset Draft",
      "Complete Draft",
      "Take to Program",
      "Clear Program",
      "Trigger Emergency"
    ].forEach((controlText) => {
      expect(markup).not.toContain(controlText);
    });
  });
});
