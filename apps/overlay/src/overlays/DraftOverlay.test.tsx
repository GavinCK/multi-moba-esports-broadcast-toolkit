import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DraftAction,
  DraftActionStatus,
  DraftActionType,
  DraftFinalLineupState,
  DraftPhaseDefinition,
  DraftRuleset,
  Hero,
  Player,
  TeamSide,
  ThemeConfig
} from "@mmbt/shared-types";

import type { OverlayClientState, OverlayDraftSummary, OverlayRuntimeState } from "../client/types";
import { OverlayRouteView } from "../routes/OverlayRouteView";
import { parseOverlayRoute } from "../routes/route";
import { overlayReducer } from "../state/overlayState";
import { getDraftTimerBarScale, selectDraftOverlayViewModel } from "./DraftOverlay";

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

const players: Player[] = [
  {
    id: "player_blue-mid",
    teamId: "team_blue",
    handle: "BlueMid",
    displayName: "Blue Mid",
    role: "Mid"
  },
  {
    id: "player_blue-top",
    teamId: "team_blue",
    handle: "BlueTop",
    displayName: "Blue Top",
    role: "Top"
  },
  {
    id: "player_red-mid",
    teamId: "team_red",
    displayName: "Red Mid",
    role: "Mid"
  },
  {
    id: "player_red-top",
    teamId: "team_red",
    handle: "RedTop",
    displayName: "Red Top",
    role: "Top"
  }
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
    createAction("ban-red-2:slot-0", "ban-red-2", "BAN", "RED", 0, "SKIPPED", null),
    createAction("pick-blue-1:slot-0", "pick-blue-1", "PICK", "BLUE", 0, "LOCKED", "hero_ember"),
    createAction("pick-red-1:slot-0", "pick-red-1", "PICK", "RED", 0, "LOCKED", "hero_oath"),
    createAction("pick-blue-2:slot-0", "pick-blue-2", "PICK", "BLUE", 0, "PENDING", null),
    createAction("pick-red-2:slot-0", "pick-red-2", "PICK", "RED", 0, "PENDING", null)
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
        presentation: {
          matchLabel: "Showmatch Finals",
          patchLabel: "Patch 26.10",
          seriesFormat: "BO5",
          gameNumber: 2,
          scoreBySide: {
            BLUE: 2,
            RED: 1
          },
          firstPickSide: "BLUE",
          sideStatusLabel: "Blue side has first pick",
          playerDisplayOrderBySide: {
            BLUE: ["player_blue-mid", "player_blue-top"],
            RED: ["player_red-mid", "player_red-top"]
          }
        },
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
        logoAssetPath: "assets/team-logos/blue.svg",
        primaryColor: "#2563eb",
        secondaryColor: "#93c5fd"
      },
      {
        id: "team_red",
        name: "Red Titans",
        shortName: "RED",
        logoUrl: "assets/team-logos/red.svg",
        primaryColor: "#dc2626",
        secondaryColor: "#fca5a5"
      }
    ],
    players,
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

function createCompleteSnapshot(
  finalLineup?: DraftFinalLineupState
): OverlayRuntimeState {
  const completeActions = createActions("COMPLETE");
  const baseSnapshot = createSnapshot();

  return createSnapshot({
    drafts: {
      draft_001: {
        ...baseSnapshot.drafts.draft_001,
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
        actions: completeActions,
        finalLineup
      }
    }
  });
}

function expectActionOrder(markup: string, actionIds: string[]): void {
  let previousIndex = -1;

  actionIds.forEach((actionId) => {
    const marker = `data-testid="draft-slot-${actionId}"`;
    const currentIndex = markup.indexOf(marker);

    expect(currentIndex).toBeGreaterThan(previousIndex);
    previousIndex = currentIndex;
  });
}

describe("draft overlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(timestamp));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the full draft overlay when data exists", () => {
    const markup = renderDraft();

    expect(markup).toContain('data-testid="draft-overlay"');
    expect(markup).toContain("SHOWMATCH FINALS / GAME 2");
    expect(markup).toContain("PATCH 26.10");
    expect(markup).toContain("BLUEMID");
    expect(markup).toContain("REDTOP");
    expect(markup).toContain('data-testid="draft-turn-timer"');
    expect(markup).toContain('data-active-side="red"');
    expect(markup).not.toContain("Red Ban 1");
    expect(markup).not.toContain("Active Side");
    expect(markup).not.toContain("Local LAN Studios");
  });

  it("renders the locally derived running timer between server snapshots", () => {
    vi.setSystemTime(new Date("2026-06-02T06:00:04.000Z"));

    const markup = renderDraft();

    expect(markup).toContain('data-timer-state="running"');
    expect(markup).toContain('data-timer-scale="0.667"');
  });

  it("calculates timer bar width from the current turn timer", () => {
    expect(getDraftTimerBarScale(24, 30)).toBe(0.8);
    expect(getDraftTimerBarScale(15, 60)).toBe(0.25);
    expect(getDraftTimerBarScale(90, 30)).toBe(1);
    expect(getDraftTimerBarScale(-5, 30)).toBe(0);
    expect(getDraftTimerBarScale(10, 0)).toBe(0);
  });

  it("keeps local asset fallbacks available for missing splashes, roles, and logos", () => {
    const baseSnapshot = createSnapshot();
    const snapshot = createSnapshot({
      teams: baseSnapshot.teams.map((team) => ({
        ...team,
        logoAssetPath: undefined,
        logoUrl: undefined
      })),
      adapters: [
        {
          ...baseSnapshot.adapters[0],
          heroes: heroes.map((hero) =>
            hero.id === "hero_ember"
              ? {
                  ...hero,
                  gameCode: "lol",
                  metadata: {
                    dataDragonId: "Aatrox"
                  }
                }
              : hero
          )
        }
      ]
    });
    const markup = renderDraft("/overlay/draft/match_grand-final", "", createClientState(snapshot));

    expect(markup).toContain('data-logo-source="fallback"');
    expect(markup).toContain("draft-neutral-crest");
    expect(markup).toContain('src="/assets/hero-splashes/lol/Aatrox.jpg"');
    expect(markup).toContain('src="/assets/role-icons/lol/position-top.svg"');
    expect(markup).toContain("draft-pick-art__fallback");
    expect(markup).toContain("draft-role-icon__fallback");
  });

  it("omits banned on-air state and phase labels on the normal route", () => {
    const markup = renderDraft();

    [
      "PENDING",
      "BLUE BAN",
      "RED BAN",
      "PICK 1",
      "Draft Status",
      "Active Side",
      "Manual skip",
      "Skipped",
      "Red Ban 1"
    ].forEach((label) => {
      expect(markup).not.toContain(label);
    });
  });

  it("renders local center team logo assets without visible team-name labels", () => {
    const markup = renderDraft();

    expect(markup).toContain('data-logo-source="asset"');
    expect(markup).toContain('src="/assets/team-logos/blue.svg"');
    expect(markup).toContain('src="/assets/team-logos/red.svg"');
    expect(markup).not.toContain("Blue Meteors");
    expect(markup).not.toContain("Red Titans");
  });

  it("exposes match presentation metadata in the draft overlay view model", () => {
    const viewModel = selectDraftOverlayViewModel(createClientState(), "match_grand-final");

    expect(viewModel.presentation).toMatchObject({
      matchLabel: "Showmatch Finals",
      patchLabel: "Patch 26.10",
      seriesFormat: "BO5",
      gameNumber: 2,
      scoreBySide: {
        BLUE: 2,
        RED: 1
      },
      firstPickSide: "BLUE",
      sideStatusLabel: "Blue side has first pick"
    });
  });

  it("resolves team presentation names, colors, and local logo asset paths safely", () => {
    const viewModel = selectDraftOverlayViewModel(createClientState(), "match_grand-final");

    expect(viewModel.presentation?.teams.BLUE).toMatchObject({
      teamId: "team_blue",
      name: "Blue Meteors",
      shortName: "BLU",
      logoAssetPath: "assets/team-logos/blue.svg",
      localLogoUrl: "/assets/team-logos/blue.svg",
      logoStatus: "resolved",
      colors: {
        primary: "#2563eb",
        secondary: "#93c5fd"
      }
    });
    expect(viewModel.presentation?.teams.RED).toMatchObject({
      shortName: "RED",
      localLogoUrl: "/assets/team-logos/red.svg",
      colors: {
        primary: "#dc2626",
        secondary: "#fca5a5"
      }
    });
  });

  it("keeps raw unsafe team logo paths without turning them into browser URLs", () => {
    const baseSnapshot = createSnapshot();
    const snapshot = createSnapshot({
      teams: [
        {
          ...baseSnapshot.teams[0],
          logoAssetPath: "https://example.test/blue.svg"
        },
        baseSnapshot.teams[1]
      ]
    });
    const viewModel = selectDraftOverlayViewModel(
      createClientState(snapshot),
      "match_grand-final"
    );

    expect(viewModel.presentation?.teams.BLUE.logoAssetPath).toBe(
      "https://example.test/blue.svg"
    );
    expect(viewModel.presentation?.teams.BLUE.localLogoUrl).toBeNull();
    expect(viewModel.presentation?.teams.BLUE.logoStatus).toBe("unsafe");
  });

  it("resolves blue and red player display order with handle and display-name fallbacks", () => {
    const viewModel = selectDraftOverlayViewModel(createClientState(), "match_grand-final");

    expect(viewModel.presentation?.teams.BLUE.players.map((player) => player.label)).toEqual([
      "BlueMid",
      "BlueTop"
    ]);
    expect(viewModel.presentation?.teams.BLUE.players.map((player) => player.role)).toEqual([
      "Mid",
      "Top"
    ]);
    expect(viewModel.presentation?.teams.RED.players.map((player) => player.label)).toEqual([
      "Red Mid",
      "RedTop"
    ]);
    expect(viewModel.presentation?.teams.RED.players[0]).toMatchObject({
      handle: null,
      displayName: "Red Mid",
      teamShortName: "RED",
      unresolved: false
    });
  });

  it("renders the approved ban strips and pick rail from draft actions", () => {
    const markup = renderDraft();

    expect(markup.match(/data-slot-kind="ban"/g)).toHaveLength(10);
    expect(markup.match(/data-slot-kind="pick"/g)).toHaveLength(10);
    expect(markup).toContain('data-slot-state="done"');
    expect(markup).toContain('data-slot-state="active"');
    expect(markup).toContain('data-slot-state="picked"');
    expect(markup).toContain('data-slot-state="empty"');
    expect(markup).not.toContain("Moon Sentinel");
    expect(markup).not.toContain("Solar Warden");
    expect(markup).not.toContain("Ember Guard");
    expect(markup).not.toContain("Oath Keeper");
  });

  it("makes empty, hover, picked, done, active, and skipped visual states distinguishable", () => {
    const baseSnapshot = createSnapshot();
    const snapshot = createSnapshot({
      drafts: {
        draft_001: {
          ...baseSnapshot.drafts.draft_001,
          currentPhaseIndex: 6,
          currentPhase: phases[6],
          currentActionIds: ["pick-blue-2:slot-0"],
          timer: {
            isRunning: true,
            remainingSeconds: 18,
            originalSeconds: 30,
            phaseStartedAt: timestamp
          },
          actions: createActions().map((action) =>
            action.id === "pick-blue-2:slot-0"
              ? {
                  ...action,
                  status: "HOVER",
                  heroId: "hero_sun",
                  hoveredAt: timestamp
                }
              : action
          )
        }
      }
    });
    const markup = renderDraft();
    const hoverMarkup = renderDraft("/overlay/draft/match_grand-final", "", createClientState(snapshot));

    expect(markup).toContain('data-slot-state="done"');
    expect(markup).toContain('data-slot-state="active"');
    expect(markup).toContain('data-slot-state="skipped"');
    expect(markup).toContain('data-slot-state="picked"');
    expect(markup).toContain('data-slot-state="empty"');
    expect(hoverMarkup).toContain('data-slot-state="hover"');
    expect(markup).not.toContain("Manual skip");
    expect(markup).not.toContain(">Skipped<");
    expect(markup).not.toContain("PENDING");
  });

  it("maps a skipped ban to an empty no-label overlay slot", () => {
    const viewModel = selectDraftOverlayViewModel(createClientState(), "match_grand-final");
    const skippedBan = viewModel.redBans.find((slot) => slot.action.id === "ban-red-2:slot-0");

    expect(skippedBan).toMatchObject({
      isNoBan: true,
      label: "",
      action: expect.objectContaining({
        type: "BAN",
        status: "SKIPPED",
        heroId: null
      })
    });
  });

  it("renders completed draft state while preserving final picks and bans", () => {
    const snapshot = createCompleteSnapshot();
    const markup = renderDraft("/overlay/draft/match_grand-final", "", createClientState(snapshot));

    expect(markup).toContain('data-draft-status="complete"');
    expect(markup).not.toContain('data-testid="draft-turn-timer"');
    expect(markup).not.toContain("Draft Complete");
    expect(markup).not.toContain("Storm Caller");
    expect(markup).not.toContain("River Guide");
  });

  it("renders locked pick order when no final lineup exists", () => {
    const markup = renderDraft(
      "/overlay/draft/match_grand-final",
      "",
      createClientState(createCompleteSnapshot())
    );

    expectActionOrder(markup, ["pick-blue-1:slot-0", "pick-blue-2:slot-0"]);
    expectActionOrder(markup, ["pick-red-1:slot-0", "pick-red-2:slot-0"]);
  });

  it("renders Blue final lineup order when finalLineupBySide.BLUE exists", () => {
    const markup = renderDraft(
      "/overlay/draft/match_grand-final",
      "",
      createClientState(
        createCompleteSnapshot({
          status: "ACTIVE",
          finalLineupBySide: {
            BLUE: ["pick-blue-2:slot-0", "pick-blue-1:slot-0"]
          },
          lineupPhaseStartedAt: timestamp,
          updatedAt: timestamp
        })
      )
    );

    expectActionOrder(markup, ["pick-blue-2:slot-0", "pick-blue-1:slot-0"]);
    expectActionOrder(markup, ["pick-red-1:slot-0", "pick-red-2:slot-0"]);
  });

  it("attaches broadcast player slots by index without changing final lineup champion order", () => {
    const viewModel = selectDraftOverlayViewModel(
      createClientState(
        createCompleteSnapshot({
          status: "CONFIRMED",
          finalLineupBySide: {
            BLUE: ["pick-blue-2:slot-0", "pick-blue-1:slot-0"],
            RED: ["pick-red-2:slot-0", "pick-red-1:slot-0"]
          },
          lineupPhaseStartedAt: timestamp,
          lineupConfirmedAt: timestamp,
          updatedAt: timestamp
        })
      ),
      "match_grand-final"
    );

    expect(viewModel.bluePicks.map((slot) => slot.label)).toEqual([
      "Solar Warden",
      "Ember Guard"
    ]);
    expect(viewModel.bluePicks.map((slot) => slot.playerLabel)).toEqual([
      "BlueMid",
      "BlueTop"
    ]);
    expect(viewModel.redPicks.map((slot) => slot.label)).toEqual([
      "River Guide",
      "Oath Keeper"
    ]);
    expect(viewModel.redPicks.map((slot) => slot.playerRole)).toEqual([
      "Mid",
      "Top"
    ]);
  });

  it("keeps champion pick slots rendering when player order is incomplete", () => {
    const baseSnapshot = createCompleteSnapshot();
    const baseMatch = baseSnapshot.matches[0];
    const snapshot = createCompleteSnapshot();

    snapshot.matches = [
      {
        ...baseMatch,
        presentation: {
          ...baseMatch.presentation,
          playerDisplayOrderBySide: {
            BLUE: ["player_blue-mid"],
            RED: []
          }
        }
      }
    ];

    const viewModel = selectDraftOverlayViewModel(
      createClientState(snapshot),
      "match_grand-final"
    );

    expect(viewModel.bluePicks.map((slot) => slot.label)).toEqual([
      "Ember Guard",
      "Solar Warden"
    ]);
    expect(viewModel.bluePicks.map((slot) => slot.playerLabel)).toEqual([
      "BlueMid",
      null
    ]);
    expect(viewModel.redPicks.map((slot) => slot.playerLabel)).toEqual([null, null]);
  });

  it("renders Red final lineup order when finalLineupBySide.RED exists", () => {
    const markup = renderDraft(
      "/overlay/draft/match_grand-final",
      "",
      createClientState(
        createCompleteSnapshot({
          status: "CONFIRMED",
          finalLineupBySide: {
            RED: ["pick-red-2:slot-0", "pick-red-1:slot-0"]
          },
          lineupPhaseStartedAt: timestamp,
          lineupConfirmedAt: timestamp,
          updatedAt: timestamp
        })
      )
    );

    expectActionOrder(markup, ["pick-blue-1:slot-0", "pick-blue-2:slot-0"]);
    expectActionOrder(markup, ["pick-red-2:slot-0", "pick-red-1:slot-0"]);
  });

  it("handles Blue and Red final lineup order independently", () => {
    const markup = renderDraft(
      "/overlay/draft/match_grand-final",
      "",
      createClientState(
        createCompleteSnapshot({
          status: "ACTIVE",
          finalLineupBySide: {
            BLUE: ["pick-blue-2:slot-0"],
            RED: ["pick-red-2:slot-0", "pick-red-1:slot-0"]
          },
          lineupPhaseStartedAt: timestamp,
          updatedAt: timestamp
        })
      )
    );

    expectActionOrder(markup, ["pick-blue-1:slot-0", "pick-blue-2:slot-0"]);
    expectActionOrder(markup, ["pick-red-2:slot-0", "pick-red-1:slot-0"]);
  });

  it("updates pick order when a draft update contains changed finalLineupBySide", () => {
    const baseState = createClientState(createCompleteSnapshot());
    const updatedSnapshot = createCompleteSnapshot({
      status: "ACTIVE",
      finalLineupBySide: {
        BLUE: ["pick-blue-2:slot-0", "pick-blue-1:slot-0"],
        RED: ["pick-red-2:slot-0", "pick-red-1:slot-0"]
      },
      lineupPhaseStartedAt: timestamp,
      updatedAt: "2026-06-02T06:00:05.000Z"
    });
    const updatedDraft = updatedSnapshot.drafts.draft_001 as OverlayDraftSummary;
    const updatedState = overlayReducer(baseState, {
      type: "socket:draft-updated",
      envelope: {
        type: "draft:updated",
        timestamp: "2026-06-02T06:00:05.000Z",
        payload: {
          revision: 10,
          reason: "DRAFT_LINEUP_REORDERED",
          draftId: "draft_001",
          matchId: "match_grand-final",
          gameId: "game_001",
          draft: {
            summary: updatedDraft,
            draft: {
              id: updatedDraft.id,
              gameId: updatedDraft.gameId,
              rulesetId: updatedDraft.rulesetId,
              gameCode: updatedDraft.gameCode,
              status: updatedDraft.status,
              currentPhaseIndex: updatedDraft.currentPhaseIndex,
              timer: updatedDraft.timer,
              actions: updatedDraft.actions ?? [],
              lockedHeroIds: updatedDraft.lockedHeroIds,
              bannedHeroIds: updatedDraft.bannedHeroIds,
              pickedHeroIds: updatedDraft.pickedHeroIds,
              finalLineup: updatedDraft.finalLineup,
              updatedAt: updatedDraft.updatedAt
            }
          }
        }
      }
    });
    const markup = renderDraft("/overlay/draft/match_grand-final", "", updatedState);

    expectActionOrder(markup, ["pick-blue-2:slot-0", "pick-blue-1:slot-0"]);
    expectActionOrder(markup, ["pick-red-2:slot-0", "pick-red-1:slot-0"]);
  });

  it("falls back safely when final lineup entries are invalid or partial", () => {
    const invalidOrders: DraftFinalLineupState[] = [
      {
        status: "ACTIVE",
        finalLineupBySide: {
          BLUE: ["pick-blue-2:slot-0"]
        }
      },
      {
        status: "ACTIVE",
        finalLineupBySide: {
          BLUE: ["pick-blue-2:slot-0", "pick-blue-2:slot-0"]
        }
      },
      {
        status: "ACTIVE",
        finalLineupBySide: {
          BLUE: ["pick-red-1:slot-0", "pick-blue-1:slot-0"]
        }
      },
      {
        status: "ACTIVE",
        finalLineupBySide: {
          BLUE: ["missing-action", "pick-blue-1:slot-0"]
        }
      }
    ];

    invalidOrders.forEach((finalLineup) => {
      const markup = renderDraft(
        "/overlay/draft/match_grand-final",
        "",
        createClientState(createCompleteSnapshot(finalLineup))
      );

      expect(markup).toContain('data-testid="draft-overlay"');
      expectActionOrder(markup, ["pick-blue-1:slot-0", "pick-blue-2:slot-0"]);
      expectActionOrder(markup, ["pick-red-1:slot-0", "pick-red-2:slot-0"]);
    });
  });

  it("renders safe missing match and missing draft states", () => {
    expect(renderDraft("/overlay/draft/unknown-match")).toContain("Match not found");

    const snapshot = createSnapshot({ drafts: {} });
    const markup = renderDraft("/overlay/draft/match_grand-final", "", createClientState(snapshot));

    expect(markup).toContain("Draft state unavailable");
    expect(markup).toContain("No draft will be created from this overlay");
    expect(markup).not.toContain("Blue Meteors");
    expect(markup).not.toContain("Red Titans");
  });

  it("uses safe defaults when presentation metadata is missing", () => {
    const baseSnapshot = createSnapshot();
    const snapshot = createSnapshot({
      matches: [
        {
          ...baseSnapshot.matches[0],
          presentation: undefined
        }
      ]
    });
    const viewModel = selectDraftOverlayViewModel(
      createClientState(snapshot),
      "match_grand-final"
    );

    expect(viewModel.presentation).toMatchObject({
      matchLabel: "Grand Final",
      patchLabel: null,
      seriesFormat: "BO3",
      gameNumber: 1,
      scoreBySide: {
        BLUE: 1,
        RED: 0
      },
      firstPickSide: null,
      sideStatusLabel: null,
      playerOrderConfigured: false,
      playerOrderFallbackMessage: "No broadcast player order configured for this match."
    });
    expect(viewModel.presentation?.teams.BLUE.players).toEqual([]);
    expect(viewModel.presentation?.teams.RED.players).toEqual([]);
  });

  it("keeps unresolved player IDs as placeholders in the presentation view model", () => {
    const baseSnapshot = createSnapshot();
    const baseMatch = baseSnapshot.matches[0];
    const snapshot = createSnapshot({
      matches: [
        {
          ...baseMatch,
          presentation: {
            ...baseMatch.presentation,
            playerDisplayOrderBySide: {
              BLUE: ["missing_player"],
              RED: ["player_red-top"]
            }
          }
        }
      ]
    });
    const viewModel = selectDraftOverlayViewModel(
      createClientState(snapshot),
      "match_grand-final"
    );

    expect(viewModel.presentation?.teams.BLUE.players[0]).toMatchObject({
      playerId: "missing_player",
      unresolved: true,
      label: "missing_player",
      role: null,
      teamId: "team_blue",
      teamShortName: "BLU"
    });
    expect(viewModel.presentation?.teams.RED.players[0]).toMatchObject({
      playerId: "player_red-top",
      unresolved: false,
      label: "RedTop"
    });
  });

  it("shows public-safe debug diagnostics only in debug mode", () => {
    const normalMarkup = renderDraft();
    const debugMarkup = renderDraft("/overlay/draft/match_grand-final", "?debug=1");

    expect(normalMarkup).not.toContain("Draft Diagnostics");
    expect(normalMarkup).not.toContain("Draft ID");
    expect(normalMarkup).not.toContain("Revision");
    expect(normalMarkup).toContain("SHOWMATCH FINALS / GAME 2");
    expect(normalMarkup).toContain("PATCH 26.10");
    expect(debugMarkup).toContain("Draft Diagnostics");
    expect(debugMarkup).toContain("draft_001");
    expect(debugMarkup).toContain("Red Ban 1");
    expect(debugMarkup).toContain("Revision");
    expect(debugMarkup).toContain("Showmatch Finals");
    expect(debugMarkup).toContain("Patch 26.10");
    expect(debugMarkup).toContain("BlueMid");
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
      "Confirm Final Lineup",
      "Reset side to pick order",
      "Move Up",
      "Move Down",
      "Swap Order",
      "Take to Program",
      "Clear Program",
      "Trigger Emergency"
    ].forEach((controlText) => {
      expect(markup).not.toContain(controlText);
    });
  });
});
