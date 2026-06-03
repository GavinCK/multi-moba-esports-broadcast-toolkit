import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DashboardView,
  getAdminSectionFromPath,
  getCasterMatchIdFromPath,
  getDraftMatchIdFromPath,
  getProducerMatchIdFromPath
} from "./App";
import { DashboardApiError, type DashboardApiClient } from "./client/apiClient";
import type { Hero } from "@mmbt/shared-types";
import { LOL_SAMPLE_CHAMPIONS } from "../../../games/lol/src/data";
import type {
  DashboardAdapterDetail,
  DashboardDraftMutationResponse,
  DashboardDraftSnapshot,
  DashboardGame,
  DashboardRuntimeState
} from "./client/types";
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
    stateRevision: 3,
    socketClients: [
      {
        id: "socket_raw_123",
        role: "ADMIN" as const,
        panel: "admin-dashboard",
        connectedAt: "2026-06-01T00:00:01.000Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        id: "socket_raw_overlay",
        panel: "overlay-shell",
        connectedAt: "2026-06-01T00:00:02.000Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        id: "socket_raw_draft",
        role: "DRAFT_OPERATOR" as const,
        panel: "draft-operator",
        connectedAt: "2026-06-01T00:00:03.000Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        id: "socket_raw_producer",
        role: "PRODUCER" as const,
        panel: "producer-panel",
        connectedAt: "2026-06-01T00:00:04.000Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        id: "socket_raw_caster",
        role: "CASTER" as const,
        panel: "caster-panel",
        connectedAt: "2026-06-01T00:00:04.500Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      }
    ],
    clientSummary: {
      total: 5,
      readOnlyCount: 1,
      byRole: {
        ADMIN: 1,
        DRAFT_OPERATOR: 1,
        PRODUCER: 1,
        CASTER: 1
      },
      byPanel: {
        "admin-dashboard": 1,
        "overlay-shell": 1,
        "draft-operator": 1,
        "producer-panel": 1,
        "caster-panel": 1
      },
      byClientType: {
        "not-reported": 4,
        overlay: 1
      },
      lastSeenAt: "2026-06-01T00:00:05.000Z"
    },
    clientGroups: [
      {
        category: "dashboard" as const,
        role: "ADMIN",
        panel: "admin-dashboard",
        route: "/admin/system-health",
        count: 1,
        readOnlyCount: 0,
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        category: "overlay" as const,
        role: "OVERLAY",
        panel: "overlay-shell",
        clientType: "overlay",
        route: "/overlay/program",
        count: 1,
        readOnlyCount: 1,
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        category: "draft-operator" as const,
        role: "DRAFT_OPERATOR",
        panel: "draft-operator",
        route: "/draft/match_grand-final",
        matchId: "match_grand-final",
        count: 1,
        readOnlyCount: 0,
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        category: "producer" as const,
        role: "PRODUCER",
        panel: "producer-panel",
        route: "/producer/match_grand-final",
        matchId: "match_grand-final",
        count: 1,
        readOnlyCount: 0,
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      {
        category: "caster" as const,
        role: "CASTER",
        panel: "caster-panel",
        route: "/caster/match_grand-final",
        matchId: "match_grand-final",
        count: 1,
        readOnlyCount: 0,
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      }
    ],
    connectionStatus: {
      dashboard: {
        category: "dashboard" as const,
        connected: true,
        state: "connected" as const,
        count: 1,
        panels: ["admin-dashboard"],
        roles: ["ADMIN"],
        routes: ["/admin/system-health"],
        matchIds: [],
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      overlay: {
        category: "overlay" as const,
        connected: true,
        state: "connected" as const,
        count: 1,
        panels: ["overlay-shell"],
        roles: ["OVERLAY"],
        routes: ["/overlay/program"],
        matchIds: [],
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      draftOperator: {
        category: "draft-operator" as const,
        connected: true,
        state: "connected" as const,
        count: 1,
        panels: ["draft-operator"],
        roles: ["DRAFT_OPERATOR"],
        routes: ["/draft/match_grand-final"],
        matchIds: ["match_grand-final"],
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      producer: {
        category: "producer" as const,
        connected: true,
        state: "connected" as const,
        count: 1,
        panels: ["producer-panel"],
        roles: ["PRODUCER"],
        routes: ["/producer/match_grand-final"],
        matchIds: ["match_grand-final"],
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      },
      caster: {
        category: "caster" as const,
        connected: true,
        state: "connected" as const,
        count: 1,
        panels: ["caster-panel"],
        roles: ["CASTER"],
        routes: ["/caster/match_grand-final"],
        matchIds: ["match_grand-final"],
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      }
    },
    loadedEventPackageId: "sample-event",
    currentProductionState: "PRE_SHOW" as const,
    adapterStatus: {
      "generic-moba": {
        loaded: true,
        displayName: "Generic MOBA",
        heroCount: 10,
        rulesetCount: 1
      },
      aov: {
        loaded: true,
        displayName: "Arena of Valor",
        heroCount: 8,
        rulesetCount: 1
      }
    },
    assetStatus: {
      missingAssets: [],
      warnings: ["unsafe details withheld from UI"]
    },
    auditLogStatus: {
      writable: true,
      path: "event-packages/sample-event/logs/production-log.jsonl",
      lastWriteAt: "2026-06-01T00:00:04.000Z"
    },
    emergencyReady: true,
    emergencyStatus: {
      ready: true,
      active: false
    },
    lastStateUpdateAt: "2026-06-01T00:00:05.000Z",
    validationWarnings: {
      eventPackage: [
        {
          path: "metadata.unsafeCredential",
          code: "UNSAFE_FIELD",
          message: "unsafe credential sensitive-token-value must not be shown",
          severity: "warning" as const
        }
      ],
      adapters: []
    }
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
          "generic-moba": "generic-standard",
          aov: "aov-standard"
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
        shortName: "BLU",
        countryCode: "HK",
        primaryColor: "#2563eb",
        secondaryColor: "#93c5fd"
      },
      {
        id: "team_red",
        name: "Red Titans",
        shortName: "RED",
        countryCode: "HK",
        primaryColor: "#dc2626",
        secondaryColor: "#fca5a5"
      }
    ],
    players: [
      {
        id: "player_blue-top",
        teamId: "team_blue",
        displayName: "BlueAtlas",
        role: "Top"
      },
      {
        id: "player_red-mid",
        teamId: "team_red",
        displayName: "RedSpark",
        role: "Mid"
      }
    ],
    sponsors: [
      {
        id: "sponsor_presented-by",
        name: "Local LAN Studios",
        logoUrl: "assets/sponsor-logos/local-lan-studios.svg",
        slots: ["PRESENTED_BY", "DRAFT", "SCORE_BUG"]
      }
    ],
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
        themeId: "default-theme",
        status: "DRAFT_READY"
      },
      {
        id: "game_aov-001",
        matchId: "match_aov-showcase",
        gameNumber: 1,
        gameCode: "aov",
        blueTeamId: "team_blue",
        redTeamId: "team_red",
        draftId: "draft_aov-001",
        rulesetId: "aov-standard",
        themeId: "default-theme",
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
        sponsorSlotIds: ["sponsor_presented-by"],
        themeId: "default-theme",
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
            themeId: "default-theme",
            status: "DRAFT_READY"
          }
        ]
      },
      {
        id: "match_aov-showcase",
        eventId: "event_001",
        gameCode: "aov",
        title: "AOV Sample Showcase",
        format: "BO1",
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
        sponsorSlotIds: ["sponsor_presented-by"],
        themeId: "default-theme",
        games: [
          {
            id: "game_aov-001",
            matchId: "match_aov-showcase",
            gameNumber: 1,
            gameCode: "aov",
            blueTeamId: "team_blue",
            redTeamId: "team_red",
            draftId: "draft_aov-001",
            rulesetId: "aov-standard",
            themeId: "default-theme",
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
      },
      {
        id: "aov-standard",
        gameCode: "aov",
        name: "AOV Standard"
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
      },
      "draft_aov-001": {
        id: "draft_aov-001",
        matchId: "match_aov-showcase",
        gameId: "game_aov-001",
        gameNumber: 1,
        gameCode: "aov",
        rulesetId: "aov-standard",
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
        message: "private emergency reason must not be rendered"
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
      },
      {
        gameCode: "aov",
        displayName: "Arena of Valor",
        loaded: true,
        heroCount: 8,
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
    availableAdapterIds: ["generic-moba", "aov"],
    validationWarnings: health.validationWarnings,
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

function createStateWithDraftStatus(status: "READY" | "LIVE" | "PAUSED" | "COMPLETE"): DashboardClientState {
  const state = createReadyState();
  const draft = state.snapshot?.drafts["draft_generic-001"];

  if (state.snapshot && draft) {
    state.snapshot.drafts["draft_generic-001"] = {
      ...draft,
      status,
      timer: {
        ...draft.timer,
        isRunning: status === "LIVE"
      }
    };
  }

  return state;
}

function createDraftSnapshotFromState(state: DashboardClientState): DashboardDraftSnapshot {
  const summary = state.snapshot?.drafts["draft_generic-001"];

  if (!summary) {
    throw new Error("Missing test draft summary.");
  }

  return {
    summary,
    draft: {
      id: summary.id,
      gameId: summary.gameId,
      rulesetId: summary.rulesetId,
      gameCode: summary.gameCode,
      status: summary.status as "READY" | "LIVE" | "PAUSED" | "COMPLETE",
      currentPhaseIndex: summary.currentPhaseIndex,
      timer: summary.timer,
      actions: [
        {
          id: "ban_1_1",
          phaseId: "ban_1",
          type: "BAN",
          team: "BLUE",
          slotIndex: 0,
          heroId: null,
          status: "PENDING",
          createdAt: "2026-06-01T00:00:00.000Z"
        },
        {
          id: "pick_1_1",
          phaseId: "pick_1",
          type: "PICK",
          team: "RED",
          slotIndex: 0,
          heroId: "hero_beta",
          status: "LOCKED",
          createdAt: "2026-06-01T00:00:00.000Z",
          lockedAt: "2026-06-01T00:00:02.000Z"
        }
      ],
      lockedHeroIds: ["hero_beta"],
      bannedHeroIds: [],
      pickedHeroIds: ["hero_beta"],
      history: [
        {
          id: "history_001",
          timestamp: "2026-06-01T00:00:02.000Z",
          action: "HERO_LOCKED"
        }
      ],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:02.000Z"
    }
  };
}

function createAdapterDetail(): DashboardAdapterDetail {
  return {
    gameCode: "generic-moba",
    displayName: "Generic MOBA",
    loaded: true,
    heroCount: 2,
    rulesetCount: 1,
    source: "LOCAL_STATIC_SAMPLE",
    capabilities: {
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false
    },
    heroes: [
      {
        id: "hero_alpha",
        gameCode: "generic-moba",
        displayName: "Alpha Sentinel",
        roleTags: ["Frontline"]
      },
      {
        id: "hero_beta",
        gameCode: "generic-moba",
        displayName: "Beta Mystic",
        roleTags: ["Mage"]
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
            id: "ban_1",
            type: "BAN",
            team: "BLUE",
            count: 1,
            timeSeconds: 30,
            label: "Blue ban"
          }
        ]
      }
    ]
  };
}

function cloneLoLDashboardHero(hero: Hero): Hero {
  return {
    ...hero,
    localizedNames: hero.localizedNames ? { ...hero.localizedNames } : undefined,
    roleTags: hero.roleTags ? [...hero.roleTags] : undefined,
    metadata: hero.metadata ? { ...hero.metadata } : undefined
  };
}

const LOL_DASHBOARD_HEROES: Hero[] = LOL_SAMPLE_CHAMPIONS.map((hero) => cloneLoLDashboardHero(hero));

function createLoLAdapterDetail(): DashboardAdapterDetail {
  return {
    gameCode: "lol",
    displayName: "LoL Local Static Roster",
    loaded: true,
    heroCount: LOL_DASHBOARD_HEROES.length,
    rulesetCount: 1,
    source: "LOCAL_STATIC_SAMPLE",
    capabilities: {
      supportsManualDraft: true,
      supportsClientReader: false,
      supportsIngameHud: false,
      supportsPostGameStats: false,
      supportsAssetSync: false,
      supportsLocalization: true,
      supportsCustomRulesets: true
    },
    heroes: LOL_DASHBOARD_HEROES,
    rulesets: [
      {
        id: "lol-sample-standard-5v5",
        gameCode: "lol",
        name: "LoL Sample Standard 5v5",
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
    ]
  };
}

function createLoLReadyState(): DashboardClientState {
  const state = createReadyState();
  const snapshot = state.snapshot;

  if (!snapshot) {
    throw new Error("Expected ready state snapshot.");
  }

  const lolGame: DashboardGame = {
    id: "game_lol-001",
    matchId: "match_lol-showmatch",
    gameNumber: 1,
    gameCode: "lol",
    blueTeamId: "team_blue",
    redTeamId: "team_red",
    draftId: "draft_lol-001",
    rulesetId: "lol-sample-standard-5v5",
    themeId: "default-theme",
    status: "DRAFT_READY" as const
  };
  const lolDraft: DashboardRuntimeState["drafts"][string] = {
    id: "draft_lol-001",
    matchId: "match_lol-showmatch",
    gameId: "game_lol-001",
    gameNumber: 1,
    gameCode: "lol",
    rulesetId: "lol-sample-standard-5v5",
    status: "LIVE",
    currentPhaseIndex: 0,
    currentPhase: {
      id: "ban-blue-1",
      type: "BAN" as const,
      team: "BLUE" as const,
      count: 1,
      timeSeconds: 30,
      label: "Blue Ban 1"
    },
    currentActionIds: ["ban-blue-1:slot-0"],
    timer: {
      isRunning: true,
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
  };

  snapshot.games = [...snapshot.games, lolGame];
  snapshot.matches = [
    ...snapshot.matches,
    {
      id: "match_lol-showmatch",
      eventId: "event_001",
      gameCode: "lol",
      title: "LoL Sample Showmatch",
      format: "BO1",
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
      sponsorSlotIds: ["sponsor_presented-by"],
      themeId: "default-theme",
      games: [lolGame]
    }
  ];
  snapshot.rulesets = [
    ...snapshot.rulesets,
    {
      id: "lol-sample-standard-5v5",
      gameCode: "lol",
      name: "LoL Sample Standard 5v5"
    }
  ];
  snapshot.drafts = {
    ...snapshot.drafts,
    "draft_lol-001": lolDraft
  };
  snapshot.adapters = [
    ...snapshot.adapters,
    {
      gameCode: "lol",
      displayName: "LoL Local Static Roster",
      loaded: true,
      heroCount: LOL_DASHBOARD_HEROES.length,
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
  ];
  snapshot.adapterStatus = {
    ...snapshot.adapterStatus,
    lol: {
      loaded: true,
      displayName: "LoL Local Static Roster",
      heroCount: LOL_DASHBOARD_HEROES.length,
      rulesetCount: 1
    }
  };
  snapshot.availableAdapterIds = [...snapshot.availableAdapterIds, "lol"];

  return state;
}

const LOL_LINEUP_BLUE_ACTION_IDS = [
  "pick-blue-1:slot-0",
  "pick-blue-2-3:slot-0",
  "pick-blue-2-3:slot-1",
  "pick-blue-4-5:slot-0",
  "pick-blue-4-5:slot-1"
] as const;
const LOL_LINEUP_RED_ACTION_IDS = [
  "pick-red-1-2:slot-0",
  "pick-red-1-2:slot-1",
  "pick-red-3:slot-0",
  "pick-red-4:slot-0",
  "pick-red-5:slot-0"
] as const;

function createLoLLineupActions(): DashboardDraftSnapshot["draft"]["actions"] {
  const lineupHeroes = LOL_DASHBOARD_HEROES.slice(0, 10);
  const blueHeroes = lineupHeroes.slice(0, 5);
  const redHeroes = lineupHeroes.slice(5, 10);
  const createPickAction = (
    actionId: string,
    side: "BLUE" | "RED",
    hero: Hero,
    index: number
  ): DashboardDraftSnapshot["draft"]["actions"][number] => ({
    id: actionId,
    phaseId: actionId.split(":")[0] ?? actionId,
    type: "PICK",
    team: side,
    slotIndex: 0,
    heroId: hero.id,
    status: "LOCKED",
    createdAt: "2026-06-01T00:00:00.000Z",
    lockedAt: `2026-06-01T00:00:${String(index + 1).padStart(2, "0")}.000Z`
  });

  return [
    ...LOL_LINEUP_BLUE_ACTION_IDS.map((actionId, index) =>
      createPickAction(actionId, "BLUE", blueHeroes[index] as Hero, index)
    ),
    ...LOL_LINEUP_RED_ACTION_IDS.map((actionId, index) =>
      createPickAction(actionId, "RED", redHeroes[index] as Hero, index + 5)
    )
  ];
}

function createLoLLineupReadyState(): DashboardClientState {
  const state = createLoLReadyState();
  const snapshot = state.snapshot;
  const draft = snapshot?.drafts["draft_lol-001"];
  const lineupActions = createLoLLineupActions();

  if (!snapshot || !draft) {
    throw new Error("Expected LoL ready test state.");
  }

  snapshot.drafts["draft_lol-001"] = {
    ...draft,
    status: "LIVE",
    currentPhaseIndex: 17,
    currentPhase: null,
    currentActionIds: [],
    timer: {
      isRunning: true,
      phaseStartedAt: "2026-06-01T00:00:10.000Z",
      remainingSeconds: 60,
      originalSeconds: 60
    },
    actionCounts: {
      total: lineupActions.length,
      pending: 0,
      hover: 0,
      locked: lineupActions.length,
      skipped: 0,
      cancelled: 0
    },
    lockedHeroIds: lineupActions.map((action) => action.heroId as string),
    bannedHeroIds: [],
    pickedHeroIds: lineupActions.map((action) => action.heroId as string),
    finalLineup: {
      status: "ACTIVE",
      finalLineupBySide: {
        BLUE: [...LOL_LINEUP_BLUE_ACTION_IDS],
        RED: [...LOL_LINEUP_RED_ACTION_IDS]
      },
      lineupPhaseStartedAt: "2026-06-01T00:00:10.000Z",
      updatedAt: "2026-06-01T00:00:10.000Z"
    }
  };

  return state;
}

function createLoLLineupConfirmedReadyState(): DashboardClientState {
  const state = createLoLLineupReadyState();
  const snapshot = state.snapshot;
  const draft = snapshot?.drafts["draft_lol-001"];

  if (!snapshot || !draft?.finalLineup) {
    throw new Error("Expected active LoL lineup test state.");
  }

  snapshot.drafts["draft_lol-001"] = {
    ...draft,
    status: "COMPLETE",
    timer: {
      isRunning: false,
      remainingSeconds: 0,
      originalSeconds: 60
    },
    finalLineup: {
      ...draft.finalLineup,
      status: "CONFIRMED",
      lineupConfirmedAt: "2026-06-01T00:01:10.000Z",
      updatedAt: "2026-06-01T00:01:10.000Z"
    }
  };

  return state;
}

function createLoLDraftSnapshotFromState(state: DashboardClientState): DashboardDraftSnapshot {
  const summary = state.snapshot?.drafts["draft_lol-001"];

  if (!summary) {
    throw new Error("Missing LoL test draft summary.");
  }

  return {
    summary,
    draft: {
      id: summary.id,
      gameId: summary.gameId,
      rulesetId: summary.rulesetId,
      gameCode: summary.gameCode,
      status: summary.status as "READY" | "LIVE" | "PAUSED" | "COMPLETE",
      currentPhaseIndex: summary.currentPhaseIndex,
      timer: summary.timer,
      actions: summary.finalLineup
        ? createLoLLineupActions()
        : [
            {
              id: "ban-blue-1:slot-0",
              phaseId: "ban-blue-1",
              type: "BAN",
              team: "BLUE",
              slotIndex: 0,
              heroId: null,
              status: "PENDING",
              createdAt: "2026-06-01T00:00:00.000Z"
            }
          ],
      lockedHeroIds: summary.lockedHeroIds,
      bannedHeroIds: summary.bannedHeroIds,
      pickedHeroIds: summary.pickedHeroIds,
      finalLineup: summary.finalLineup,
      history: [],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:02.000Z"
    }
  };
}

function createDraftApiClient(
  state: DashboardClientState,
  options: {
    postError?: DashboardApiError;
  } = {}
): {
  apiClient: DashboardApiClient;
  postCalls: Array<{ path: string; body: Record<string, unknown> }>;
} {
  const postCalls: Array<{ path: string; body: Record<string, unknown> }> = [];
  const draftSnapshot = createDraftSnapshotFromState(state);
  const mutationResponse: DashboardDraftMutationResponse = {
    revision: (state.snapshot?.revision ?? 0) + 1,
    draft: draftSnapshot
  };
  const apiClient: DashboardApiClient = {
    async get<TData>(path: string): Promise<TData> {
      if (path === "/api/drafts/draft_generic-001") {
        return {
          revision: state.snapshot?.revision ?? 0,
          draft: draftSnapshot
        } as TData;
      }

      if (path === "/api/adapters/generic-moba") {
        return createAdapterDetail() as TData;
      }

      if (path === "/api/health") {
        return state.health as TData;
      }

      if (path === "/api/state") {
        return state.snapshot as TData;
      }

      throw new DashboardApiError({
        code: "TEST_NOT_FOUND",
        message: `Unhandled test GET ${path}`
      });
    },
    async post<TData>(path: string, body: Record<string, unknown>): Promise<TData> {
      postCalls.push({ path, body });

      if (options.postError) {
        throw options.postError;
      }

      return mutationResponse as TData;
    },
    async patch<TData>(): Promise<TData> {
      throw new DashboardApiError({
        code: "TEST_NOT_FOUND",
        message: "Unhandled draft test PATCH"
      });
    },
    async getHealth() {
      return state.health ?? createSnapshot().health;
    },
    async getState() {
      return state.snapshot ?? createSnapshot();
    }
  };

  return { apiClient, postCalls };
}

function createLoLDraftApiClient(state: DashboardClientState): {
  apiClient: DashboardApiClient;
  postCalls: Array<{ path: string; body: Record<string, unknown> }>;
} {
  const postCalls: Array<{ path: string; body: Record<string, unknown> }> = [];
  const draftSnapshot = createLoLDraftSnapshotFromState(state);
  const mutationResponse: DashboardDraftMutationResponse = {
    revision: (state.snapshot?.revision ?? 0) + 1,
    draft: draftSnapshot
  };
  const apiClient: DashboardApiClient = {
    async get<TData>(path: string): Promise<TData> {
      if (path === "/api/drafts/draft_lol-001") {
        return {
          revision: state.snapshot?.revision ?? 0,
          draft: draftSnapshot
        } as TData;
      }

      if (path === "/api/adapters/lol") {
        return createLoLAdapterDetail() as TData;
      }

      if (path === "/api/health") {
        return state.health as TData;
      }

      if (path === "/api/state") {
        return state.snapshot as TData;
      }

      throw new DashboardApiError({
        code: "TEST_NOT_FOUND",
        message: `Unhandled LoL test GET ${path}`
      });
    },
    async post<TData>(path: string, body: Record<string, unknown>): Promise<TData> {
      postCalls.push({ path, body });

      return mutationResponse as TData;
    },
    async patch<TData>(): Promise<TData> {
      throw new DashboardApiError({
        code: "TEST_NOT_FOUND",
        message: "Unhandled LoL draft test PATCH"
      });
    },
    async getHealth() {
      return state.health ?? createSnapshot().health;
    },
    async getState() {
      return state.snapshot ?? createSnapshot();
    }
  };

  return { apiClient, postCalls };
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function findButton(container: HTMLDivElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (item) => item.textContent?.trim() === label
  );

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  return button;
}

function findDialogButton(container: HTMLDivElement, label: string): HTMLButtonElement {
  const dialog = container.querySelector(".confirmation-dialog");
  const button = Array.from(dialog?.querySelectorAll("button") ?? []).find(
    (item) => item.textContent?.trim() === label
  );

  if (!button) {
    throw new Error(`Dialog button not found: ${label}`);
  }

  return button;
}

function findHeroButton(container: HTMLDivElement, heroId: string): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(`button[data-hero-id="${heroId}"]`);

  if (!button) {
    throw new Error(`Hero button not found: ${heroId}`);
  }

  return button;
}

function setInputValue(input: HTMLInputElement | undefined, value: string): void {
  if (!input) {
    throw new Error("Expected input to exist.");
  }

  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement | undefined, value: string): void {
  if (!select) {
    throw new Error("Expected select to exist.");
  }

  const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");

  descriptor?.set?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function findNestedButton(root: ParentNode, label: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll("button")).find(
    (item) => item.textContent?.trim() === label
  );

  if (!button) {
    throw new Error(`Nested button not found: ${label}`);
  }

  return button;
}

function renderDashboard(
  state: DashboardClientState,
  options: {
    onRefresh?: () => void;
    apiClient?: DashboardApiClient;
    initialSection?: Parameters<typeof DashboardView>[0]["initialSection"];
    initialSelectedMatchId?: string | null;
  } = {}
): HTMLDivElement {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.appendChild(container);
  mountedRoot = root;
  mountedContainer = container;

  act(() => {
    root.render(
      <DashboardView
        state={state}
        onRefresh={options.onRefresh ?? vi.fn()}
        apiClient={options.apiClient}
        initialSection={options.initialSection}
        initialSelectedMatchId={options.initialSelectedMatchId}
      />
    );
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
  vi.useRealTimers();
});

describe("DashboardView", () => {
  it("maps documented admin paths to local sections", () => {
    expect(getAdminSectionFromPath("/admin")).toBe("overview");
    expect(getAdminSectionFromPath("/draft")).toBe("draft");
    expect(getAdminSectionFromPath("/draft/match_grand-final")).toBe("draft");
    expect(getAdminSectionFromPath("/producer")).toBe("producer");
    expect(getAdminSectionFromPath("/producer/match_grand-final")).toBe("producer");
    expect(getAdminSectionFromPath("/caster")).toBe("caster");
    expect(getAdminSectionFromPath("/caster/match_grand-final")).toBe("caster");
    expect(getAdminSectionFromPath("/admin/matches")).toBe("matches");
    expect(getAdminSectionFromPath("/admin/system-health")).toBe("system-health");
    expect(getDraftMatchIdFromPath("/draft/match_grand-final")).toBe("match_grand-final");
    expect(getProducerMatchIdFromPath("/producer/match_grand-final")).toBe("match_grand-final");
    expect(getCasterMatchIdFromPath("/caster/match_grand-final")).toBe("match_grand-final");
  });

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

  it("ticks the dashboard draft timer locally without a new draft mutation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:05.000Z"));

    const state = createStateWithDraftStatus("LIVE");
    const draft = state.snapshot?.drafts["draft_generic-001"];

    if (!state.snapshot || !draft) {
      throw new Error("Expected test draft state.");
    }

    state.snapshot.drafts["draft_generic-001"] = {
      ...draft,
      timer: {
        isRunning: true,
        phaseStartedAt: "2026-06-01T00:00:00.000Z",
        remainingSeconds: 30,
        originalSeconds: 30
      }
    };

    const startingRevision = state.snapshot.revision;
    const container = renderDashboard(state);

    expect(container.textContent).toContain("25s");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(container.textContent).toContain("22s");
    expect(state.snapshot.revision).toBe(startingRevision);
    expect(state.snapshot.drafts["draft_generic-001"]?.timer.remainingSeconds).toBe(30);
  });

  it("freezes the dashboard draft timer while paused", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:05.000Z"));

    const state = createStateWithDraftStatus("PAUSED");
    const draft = state.snapshot?.drafts["draft_generic-001"];

    if (!state.snapshot || !draft) {
      throw new Error("Expected test draft state.");
    }

    state.snapshot.drafts["draft_generic-001"] = {
      ...draft,
      timer: {
        isRunning: false,
        pausedAt: "2026-06-01T00:00:05.000Z",
        remainingSeconds: 18,
        originalSeconds: 30
      }
    };

    const container = renderDashboard(state);

    expect(container.textContent).toContain("18s");

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(container.textContent).toContain("18s");
    expect(state.snapshot.drafts["draft_generic-001"]?.timer.remainingSeconds).toBe(18);
  });

  it("renders match setup detail and allows client-only selected match changes", () => {
    const container = renderDashboard(createReadyState(), {
      initialSection: "matches"
    });

    expect(container.textContent).toContain("Selected Match");
    expect(container.textContent).toContain("BlueAtlas");
    expect(container.textContent).toContain("Local LAN Studios");

    const aovViewButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "View" && button.closest("tr")?.textContent?.includes("AOV Sample Showcase")
    );

    expect(aovViewButton).toBeDefined();

    act(() => {
      aovViewButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("AOV Sample Showcase");
    expect(container.textContent).toContain("AOV Standard");
  });

  it("renders team, player, sponsor, and theme panels from read-only state", () => {
    const teams = renderDashboard(createReadyState(), { initialSection: "teams" });
    expect(teams.textContent).toContain("Blue Meteors");
    expect(teams.textContent).toContain("Red Titans");

    act(() => {
      mountedRoot?.unmount();
    });
    mountedContainer?.remove();
    mountedRoot = null;
    mountedContainer = null;

    const players = renderDashboard(createReadyState(), { initialSection: "players" });
    expect(players.textContent).toContain("BlueAtlas");
    expect(players.textContent).toContain("RedSpark");

    act(() => {
      mountedRoot?.unmount();
    });
    mountedContainer?.remove();
    mountedRoot = null;
    mountedContainer = null;

    const sponsors = renderDashboard(createReadyState(), { initialSection: "sponsors" });
    expect(sponsors.textContent).toContain("Local LAN Studios");

    act(() => {
      mountedRoot?.unmount();
    });
    mountedContainer?.remove();
    mountedRoot = null;
    mountedContainer = null;

    const themes = renderDashboard(createReadyState(), { initialSection: "themes" });
    expect(themes.textContent).toContain("Default");
    expect(themes.textContent).toContain("Generic Standard");
  });

  it("renders system health with safe client, audit, adapter, asset, and emergency details", () => {
    const container = renderDashboard(createReadyState(), {
      initialSection: "system-health"
    });
    const text = container.textContent ?? "";

    expect(text).toContain("System Health");
    expect(text).toContain("State revision");
    expect(text).toContain("Connected clients");
    expect(text).toContain("ADMIN / admin-dashboard");
    expect(text).toContain("Overlay");
    expect(text).toContain("Draft operator");
    expect(text).toContain("Producer");
    expect(text).toContain("Caster");
    expect(text).toContain("Generic MOBA");
    expect(text).toContain("10");
    expect(text).toContain("Asset health requires review before show.");
    expect(text).toContain("event-packages/sample-event/logs/production-log.jsonl");
    expect(text).toContain("UNSAFE_FIELD");
    expect(text).not.toContain("socket_raw_123");
    expect(text).not.toContain("socket_raw_overlay");
    expect(text).not.toContain("socket_raw_draft");
    expect(text).not.toContain("socket_raw_producer");
    expect(text).not.toContain("socket_raw_caster");
    expect(text).not.toContain("sensitive-token-value");
    expect(text).not.toContain("private emergency reason");
    expect(text).not.toContain("C:\\Users");
  });

  it("renders audit health errors as visible redacted errors", () => {
    const snapshot = createSnapshot();
    const errorSnapshot = {
      ...snapshot,
      health: {
        ...snapshot.health,
        status: "ERROR" as const,
        auditLogStatus: {
          writable: false,
          path: "C:\\Users\\Gavin\\event-packages\\sample-event\\logs\\production-log.jsonl",
          error: "Audit log append failed at C:\\Users\\Gavin\\production-log.jsonl"
        }
      }
    };
    const container = renderDashboard(
      {
        ...createReadyState(),
        snapshot: errorSnapshot,
        health: errorSnapshot.health
      },
      { initialSection: "system-health" }
    );
    const text = container.textContent ?? "";

    expect(text).toContain("Health status is ERROR");
    expect(text).toContain("Audit log writer error: [redacted-local-path]");
    expect(text).toContain("Audit path[redacted-local-path]");
    expect(text).not.toContain("C:\\Users");
    expect(text).not.toContain("Gavin");
  });

  it("renders empty match setup state", () => {
    const snapshot = {
      ...createSnapshot(),
      matches: [],
      currentMatchId: null
    };
    const container = renderDashboard(
      {
        ...createReadyState(),
        snapshot,
        health: snapshot.health
      },
      { initialSection: "matches" }
    );

    expect(container.textContent).toContain("No matches are available from the loaded package.");
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

  it("keeps manual refresh as a read-only command", () => {
    const onRefresh = vi.fn();
    const container = renderDashboard(createReadyState(), { onRefresh });
    const refreshButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refresh"
    );

    act(() => {
      refreshButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not render mutation controls or overlay routes in TQ-081", () => {
    const container = renderDashboard(createReadyState(), {
      initialSection: "matches"
    });
    const buttonText = Array.from(container.querySelectorAll("button"))
      .map((button) => button.textContent?.trim())
      .join(" ");
    const allText = container.textContent ?? "";

    expect(buttonText).not.toMatch(/Start Draft|Lock|Undo|Redo|Reset Draft|Complete Draft|Take to Program|Clear Program|Trigger Emergency|Emergency Clear/u);
    expect(allText).not.toContain("/overlay/");
  });

  it("renders draft operator match, draft, current phase, current action, and entity list", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient } = createDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft"
    });

    await flushAsync();

    const text = container.textContent ?? "";
    expect(text).toContain("Draft Operator");
    expect(text).toContain("Grand Final");
    expect(text).toContain("Game 1");
    expect(text).toContain("Blue ban");
    expect(text).toContain("Blue Ban 1");
    expect(text).toContain("Alpha Sentinel");
    expect(text).toContain("Beta Mystic");
    expect(text).toContain("Ban Slots");
    expect(text).toContain("Pick Slots");
  });

  it("wires the LoL adapter roster, normalized search, icons, and full-name fallback into the draft operator", async () => {
    const readyState = createLoLReadyState();
    const { apiClient, postCalls } = createLoLDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft",
      initialSelectedMatchId: "match_lol-showmatch"
    });

    await flushAsync();

    const kaiSaLocalizedName = LOL_DASHBOARD_HEROES.find((hero) => hero.id === "lol-kaisa")
      ?.localizedNames?.["zh-TW"];
    if (!kaiSaLocalizedName) {
      throw new Error("Expected generated Kai'Sa zh-TW localized name in dashboard test data.");
    }
    expect(container.textContent).toContain("LoL Sample Showmatch");
    expect(container.textContent).toContain(
      `Showing ${LOL_DASHBOARD_HEROES.length} of ${LOL_DASHBOARD_HEROES.length} local entities from LoL Local Static Roster.`
    );
    expect(LOL_DASHBOARD_HEROES.length).toBeGreaterThan(160);
    expect(LOL_DASHBOARD_HEROES.length).not.toBe(20);
    expect(container.querySelectorAll("[data-hero-id]").length).toBeGreaterThan(20);
    expect(container.textContent).toContain("Kai'Sa");
    expect(container.textContent).toContain("Renata Glasc");
    expect(container.textContent).toContain(kaiSaLocalizedName);

    const searchInput = container.querySelector<HTMLInputElement>('input[placeholder="Search heroes, aliases, roles, or local IDs"]');
    const searchCases = [
      ["kaisa", "lol-kaisa", "Kai'Sa"],
      ["Kha Zix", "lol-khazix", "Kha'Zix"],
      ["ChoGath", "lol-chogath", "Cho'Gath"],
      ["Dr Mundo", "lol-dr-mundo", "Dr. Mundo"],
      ["Mundo", "lol-dr-mundo", "Dr. Mundo"],
      ["Nunu and Willump", "lol-nunu-and-willump", "Nunu & Willump"],
      ["MF", "lol-miss-fortune", "Miss Fortune"],
      ["missfortune", "lol-miss-fortune", "Miss Fortune"],
      ["TF", "lol-twisted-fate", "Twisted Fate"],
      ["twistedfate", "lol-twisted-fate", "Twisted Fate"],
      ["Jarvan 4", "lol-jarvan-iv", "Jarvan IV"],
      ["aurelionsol", "lol-aurelion-sol", "Aurelion Sol"],
      ["monkey king", "lol-wukong", "Wukong"],
      ["renata", "lol-renata-glasc", "Renata Glasc"]
    ] as const;

    for (const [query, heroId, displayName] of searchCases) {
      act(() => {
        setInputValue(searchInput ?? undefined, query);
      });
      await flushAsync();

      const heroButton = findHeroButton(container, heroId);

      expect(heroButton.textContent).toContain(displayName);
      expect(heroButton.textContent).not.toContain("Fixture Champion");
    }

    act(() => {
      setInputValue(searchInput ?? undefined, kaiSaLocalizedName);
    });
    await flushAsync();

    const localizedKaiSaButton = findHeroButton(container, "lol-kaisa");

    expect(localizedKaiSaButton.querySelector("strong")?.textContent).toBe(kaiSaLocalizedName);
    expect(localizedKaiSaButton.textContent).toContain("Kai'Sa");

    act(() => {
      setInputValue(searchInput ?? undefined, "kaisa");
    });
    await flushAsync();

    const kaiSaButton = findHeroButton(container, "lol-kaisa");
    const artContainer = kaiSaButton.querySelector(".hero-button__art");
    const safeImage = kaiSaButton.querySelector("img[data-safe-local-image='candidate']");

    expect(artContainer?.getAttribute("data-icon-path")).toBe("/assets/hero-icons/lol/Kaisa.png");
    expect(safeImage?.getAttribute("src")).toBe("/assets/hero-icons/lol/Kaisa.png");

    await act(async () => {
      safeImage?.dispatchEvent(new Event("error"));
    });

    expect(kaiSaButton.querySelector("img[data-safe-local-image='candidate']")).toBeNull();
    expect(kaiSaButton.textContent).toContain("Kai'Sa");

    act(() => {
      kaiSaButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flushAsync();
    await act(async () => {
      findButton(container, "Hover Selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      path: "/api/drafts/draft_lol-001/actions/ban-blue-1:slot-0/hover",
      body: {
        heroId: "lol-kaisa",
        operatorId: "draft-operator"
      }
    });
  });

  it("renders final lineup direct swap controls with localized names, English names, icons, and side-specific endpoints", async () => {
    const readyState = createLoLLineupReadyState();
    const { apiClient, postCalls } = createLoLDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft",
      initialSelectedMatchId: "match_lol-showmatch"
    });

    await flushAsync();

    const firstBlueHero = LOL_DASHBOARD_HEROES[0];
    const firstBlueLocalizedName = firstBlueHero?.localizedNames?.["zh-TW"];

    if (!firstBlueHero || !firstBlueLocalizedName) {
      throw new Error("Expected localized LoL lineup hero fixture.");
    }

    expect(container.textContent).toContain("Final Lineup");
    expect(container.textContent).toContain("Blue Lineup");
    expect(container.textContent).toContain("Red Lineup");
    expect(container.textContent).toContain("Lineup timer");
    expect(container.textContent).not.toContain("Entity List");
    expect(container.textContent).not.toContain("Hero search");
    expect(container.querySelector("[data-hero-id]")).toBeNull();
    expect(container.textContent).toContain(firstBlueLocalizedName);
    expect(container.textContent).toContain(firstBlueHero.displayName);
    expect(container.querySelectorAll("img[data-safe-local-image='candidate']").length).toBeGreaterThanOrEqual(10);
    expect(container.textContent).toContain("Lineup Slot 1");
    expect(container.textContent).toContain("Reset Blue");
    expect(container.textContent).toContain("Reset Red");
    expect(container.textContent).toContain("Swap with");
    expect(container.textContent).toContain("Confirm Final Lineup");

    const lineupSides = Array.from(container.querySelectorAll<HTMLElement>(".lineup-side"));
    const blueLineup = lineupSides.find((lineupSide) => lineupSide.textContent?.includes("Blue Lineup"));
    const redLineup = lineupSides.find((lineupSide) => lineupSide.textContent?.includes("Red Lineup"));
    const blueCards = Array.from(blueLineup?.querySelectorAll<HTMLElement>(".lineup-card") ?? []);
    const redCards = Array.from(redLineup?.querySelectorAll<HTMLElement>(".lineup-card") ?? []);
    const firstBlueSwapSelect = blueCards[0]?.querySelector<HTMLSelectElement>("select");
    const secondRedSwapSelect = redCards[1]?.querySelector<HTMLSelectElement>("select");
    const blueSwapOptionValues = Array.from(firstBlueSwapSelect?.options ?? []).map((option) => option.value);
    const redSwapOptionValues = Array.from(secondRedSwapSelect?.options ?? []).map((option) => option.value);

    expect(blueCards).toHaveLength(5);
    expect(redCards).toHaveLength(5);
    expect(blueSwapOptionValues).toEqual(LOL_LINEUP_BLUE_ACTION_IDS.slice(1));
    expect(blueSwapOptionValues).not.toContain(LOL_LINEUP_RED_ACTION_IDS[0]);
    expect(redSwapOptionValues).toEqual([
      LOL_LINEUP_RED_ACTION_IDS[0],
      ...LOL_LINEUP_RED_ACTION_IDS.slice(2)
    ]);
    expect(redSwapOptionValues).not.toContain(LOL_LINEUP_BLUE_ACTION_IDS[0]);

    act(() => {
      setSelectValue(firstBlueSwapSelect, LOL_LINEUP_BLUE_ACTION_IDS[2]);
    });
    await act(async () => {
      findNestedButton(blueCards[0] as HTMLElement, "Swap").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls[0]).toMatchObject({
      path: "/api/drafts/draft_lol-001/lineup/reorder",
      body: {
        side: "BLUE",
        actionIds: [
          LOL_LINEUP_BLUE_ACTION_IDS[2],
          LOL_LINEUP_BLUE_ACTION_IDS[1],
          LOL_LINEUP_BLUE_ACTION_IDS[0],
          LOL_LINEUP_BLUE_ACTION_IDS[3],
          LOL_LINEUP_BLUE_ACTION_IDS[4]
        ],
        operatorId: "draft-operator"
      }
    });

    act(() => {
      setSelectValue(secondRedSwapSelect, LOL_LINEUP_RED_ACTION_IDS[4]);
    });
    await act(async () => {
      findNestedButton(redCards[1] as HTMLElement, "Swap").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls[1]).toMatchObject({
      path: "/api/drafts/draft_lol-001/lineup/reorder",
      body: {
        side: "RED",
        actionIds: [
          LOL_LINEUP_RED_ACTION_IDS[0],
          LOL_LINEUP_RED_ACTION_IDS[4],
          LOL_LINEUP_RED_ACTION_IDS[2],
          LOL_LINEUP_RED_ACTION_IDS[3],
          LOL_LINEUP_RED_ACTION_IDS[1]
        ],
        operatorId: "draft-operator"
      }
    });

    await act(async () => {
      findButton(container, "Reset Blue").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls[2]).toMatchObject({
      path: "/api/drafts/draft_lol-001/lineup/reset",
      body: {
        side: "BLUE",
        operatorId: "draft-operator"
      }
    });

    await act(async () => {
      findButton(container, "Confirm Final Lineup").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls[3]).toMatchObject({
      path: "/api/drafts/draft_lol-001/lineup/confirm",
      body: {
        confirm: true,
        operatorId: "draft-operator"
      }
    });
  });

  it("renders confirmed final lineup as a locked review without timer or swap controls", async () => {
    const readyState = createLoLLineupConfirmedReadyState();
    const { apiClient } = createLoLDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft",
      initialSelectedMatchId: "match_lol-showmatch"
    });

    await flushAsync();

    const firstBlueHero = LOL_DASHBOARD_HEROES[0];
    const firstBlueLocalizedName = firstBlueHero?.localizedNames?.["zh-TW"];

    if (!firstBlueHero || !firstBlueLocalizedName) {
      throw new Error("Expected localized LoL lineup hero fixture.");
    }

    const text = container.textContent ?? "";
    const lineupCards = Array.from(container.querySelectorAll<HTMLElement>(".lineup-card"));

    expect(text).toContain("Final Lineup");
    expect(text).toContain("Final lineup is confirmed and locked.");
    expect(text).toContain("Blue Lineup");
    expect(text).toContain("Red Lineup");
    expect(text).toContain("Lineup Slot 1");
    expect(text).toContain(firstBlueLocalizedName);
    expect(text).toContain(firstBlueHero.displayName);
    expect(text).not.toContain("Lineup timer");
    expect(text).not.toContain("Confirm Final Lineup");
    expect(text).not.toContain("Reset Blue");
    expect(text).not.toContain("Reset Red");
    expect(text).not.toContain("Swap with");
    expect(text).not.toContain("Move Up");
    expect(text).not.toContain("Move Down");
    expect(text).not.toContain("Entity List");
    expect(text).not.toContain("Hero search");
    expect(lineupCards).toHaveLength(10);
    expect(container.querySelectorAll(".lineup-card select")).toHaveLength(0);
    expect(container.querySelectorAll(".lineup-card button")).toHaveLength(0);
    expect(container.querySelectorAll("[data-hero-id]")).toHaveLength(0);
    expect(container.querySelectorAll("img[data-safe-local-image='candidate']").length).toBeGreaterThanOrEqual(10);
  });

  it("lets the operator select an entity and hover only after a manual click", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient, postCalls } = createDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft"
    });

    await flushAsync();
    expect(postCalls).toHaveLength(0);

    act(() => {
      findHeroButton(container, "hero_alpha").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      findButton(container, "Hover Selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      path: "/api/drafts/draft_generic-001/actions/ban_1_1/hover",
      body: {
        heroId: "hero_alpha",
        operatorId: "draft-operator"
      }
    });
  });

  it("confirmation-gates lock before calling the REST lock endpoint", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient, postCalls } = createDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft"
    });

    await flushAsync();

    act(() => {
      findHeroButton(container, "hero_alpha").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    act(() => {
      findButton(container, "Lock Selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Lock Hero");
    expect(postCalls).toHaveLength(0);

    await act(async () => {
      findDialogButton(container, "Lock Hero").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      path: "/api/drafts/draft_generic-001/actions/ban_1_1/lock",
      body: {
        heroId: "hero_alpha",
        confirm: true
      }
    });
  });

  it("calls pause and resume only after manual clicks", async () => {
    const liveState = createStateWithDraftStatus("LIVE");
    const runningDraftClient = createDraftApiClient(liveState);
    const liveContainer = renderDashboard(liveState, {
      apiClient: runningDraftClient.apiClient,
      initialSection: "draft"
    });

    await flushAsync();
    await act(async () => {
      findButton(liveContainer, "Pause Draft").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(runningDraftClient.postCalls).toHaveLength(1);
    expect(runningDraftClient.postCalls[0]?.path).toBe("/api/drafts/draft_generic-001/pause");

    act(() => {
      mountedRoot?.unmount();
    });
    mountedContainer?.remove();
    mountedRoot = null;
    mountedContainer = null;

    const pausedState = createStateWithDraftStatus("PAUSED");
    const pausedClient = createDraftApiClient(pausedState);
    const pausedContainer = renderDashboard(pausedState, {
      apiClient: pausedClient.apiClient,
      initialSection: "draft"
    });

    await flushAsync();
    await act(async () => {
      findButton(pausedContainer, "Resume Draft").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(pausedClient.postCalls).toHaveLength(1);
    expect(pausedClient.postCalls[0]?.path).toBe("/api/drafts/draft_generic-001/resume");
  });

  it("confirmation-gates undo, redo, reset, and complete draft controls", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient, postCalls } = createDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft"
    });

    await flushAsync();

    act(() => {
      findButton(container, "Undo").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls).toHaveLength(0);
    act(() => {
      setInputValue(container.querySelector<HTMLInputElement>(".confirmation-dialog input") ?? undefined, "Referee correction");
    });
    await act(async () => {
      findDialogButton(container, "Undo").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls[0]?.path).toBe("/api/drafts/draft_generic-001/undo");

    act(() => {
      findButton(container, "Redo").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls).toHaveLength(1);
    act(() => {
      setInputValue(container.querySelector<HTMLInputElement>(".confirmation-dialog input") ?? undefined, "Operator correction");
    });
    await act(async () => {
      findDialogButton(container, "Redo").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls[1]?.path).toBe("/api/drafts/draft_generic-001/redo");

    act(() => {
      findButton(container, "Reset Draft").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls).toHaveLength(2);
    const resetInputs = container.querySelectorAll<HTMLInputElement>(".confirmation-dialog input");
    act(() => {
      setInputValue(resetInputs[0], "Wrong setup");
      setInputValue(resetInputs[1], "RESET_DRAFT");
    });
    await act(async () => {
      findDialogButton(container, "Reset Draft").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls[2]?.path).toBe("/api/drafts/draft_generic-001/reset");
    expect(postCalls[2]?.body).toMatchObject({
      confirm: true,
      confirmationText: "RESET_DRAFT"
    });

    act(() => {
      findButton(container, "Complete Draft").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls).toHaveLength(3);
    await act(async () => {
      findDialogButton(container, "Complete Draft").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(postCalls[3]?.path).toBe("/api/drafts/draft_generic-001/complete");
    expect(postCalls[3]?.body).toMatchObject({ confirm: true });
  });

  it("shows structured API errors safely", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient } = createDraftApiClient(readyState, {
      postError: new DashboardApiError({
        code: "DRAFT_DUPLICATE_HERO",
        message: "Hero has already been locked."
      })
    });
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft"
    });

    await flushAsync();
    act(() => {
      findHeroButton(container, "hero_alpha").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      findButton(container, "Hover Selected").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("DRAFT_DUPLICATE_HERO");
    expect(container.textContent).toContain("Hero has already been locked.");
    expect(container.textContent).not.toContain("production-log.jsonl");
    expect(container.textContent).not.toContain("socket_raw_123");
  });

  it("keeps draft operator UI scoped away from production controls and overlay routes", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient } = createDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "draft"
    });

    await flushAsync();
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/Take to Program|Clear Program|Trigger Emergency|Emergency Clear/u);
    expect(text).not.toContain("/overlay/");
    expect(text).not.toContain("private emergency reason");
    expect(text).not.toContain("sensitive-token-value");
  });

  it("renders caster panel public match, team, player, draft, and connection readouts", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient } = createDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "caster"
    });

    await flushAsync();

    const text = container.textContent ?? "";
    expect(text).toContain("Caster Panel");
    expect(text).toContain("Grand Final");
    expect(text).toContain("BO3");
    expect(text).toContain("0 - 0");
    expect(text).toContain("Game 1");
    expect(text).toContain("Blue Team");
    expect(text).toContain("BlueAtlas");
    expect(text).toContain("Red Team");
    expect(text).toContain("RedSpark");
    expect(text).toContain("Current Draft Summary");
    expect(text).toContain("Blue ban");
    expect(text).toContain("Generic Standard");
    expect(text).toContain("Red Picks");
    expect(text).toContain("Beta Mystic");
    expect(text).toContain("Realtime connected");
    expect(text).not.toContain("socket_raw_123");
    expect(text).not.toContain("production-log.jsonl");
    expect(text).not.toContain("private emergency reason");
    expect(text).not.toContain("sensitive-token-value");
  });

  it("keeps caster panel read-only and away from mutation endpoints", async () => {
    const readyState = createStateWithDraftStatus("LIVE");
    const { apiClient, postCalls } = createDraftApiClient(readyState);
    const container = renderDashboard(readyState, {
      apiClient,
      initialSection: "caster"
    });

    await flushAsync();

    const buttonText = Array.from(container.querySelectorAll("button"))
      .map((button) => button.textContent?.trim())
      .join(" ");
    const text = container.textContent ?? "";

    expect(postCalls).toHaveLength(0);
    expect(buttonText).not.toMatch(/Start Draft|Pause Draft|Resume Draft|Hover Selected|Lock Selected|Undo|Redo|Reset Draft|Complete Draft|Preview Graphic|Take to Program|Clear Program|Trigger Emergency|Clear Emergency/u);
    expect(text).not.toContain("/overlay/");
  });

  it("renders a safe missing-match state for caster route preselects", () => {
    const container = renderDashboard(createReadyState(), {
      initialSection: "caster",
      initialSelectedMatchId: "match_unknown"
    });
    const text = container.textContent ?? "";

    expect(text).toContain("Requested match is not available in the loaded event package.");
    expect(text).toContain("Realtime connected");
    expect(text).not.toContain("socket_raw_123");
    expect(text).not.toContain("private emergency reason");
  });
});
