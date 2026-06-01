import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardView, getAdminSectionFromPath } from "./App";
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
    socketClients: [
      {
        id: "socket_raw_123",
        role: "ADMIN" as const,
        panel: "admin-dashboard",
        connectedAt: "2026-06-01T00:00:01.000Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      }
    ],
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
      path: "event-packages/sample-event/logs/production-log.jsonl"
    },
    emergencyReady: true,
    lastStateUpdateAt: "2026-06-01T00:00:05.000Z",
    validationWarnings: {
      eventPackage: [
        {
          path: "metadata.apiKey",
          code: "UNSAFE_FIELD",
          message: "apiKey super-secret-value must not be shown",
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

function renderDashboard(
  state: DashboardClientState,
  options: {
    onRefresh?: () => void;
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
});

describe("DashboardView", () => {
  it("maps documented admin paths to local sections", () => {
    expect(getAdminSectionFromPath("/admin")).toBe("overview");
    expect(getAdminSectionFromPath("/admin/matches")).toBe("matches");
    expect(getAdminSectionFromPath("/admin/system-health")).toBe("system-health");
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

  it("renders system health without raw socket IDs, log paths, warning messages, or emergency details", () => {
    const container = renderDashboard(createReadyState(), {
      initialSection: "system-health"
    });
    const text = container.textContent ?? "";

    expect(text).toContain("System Health");
    expect(text).toContain("Connected clients");
    expect(text).toContain("ADMIN / admin-dashboard");
    expect(text).toContain("UNSAFE_FIELD");
    expect(text).not.toContain("socket_raw_123");
    expect(text).not.toContain("production-log.jsonl");
    expect(text).not.toContain("super-secret-value");
    expect(text).not.toContain("private emergency reason");
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
});
