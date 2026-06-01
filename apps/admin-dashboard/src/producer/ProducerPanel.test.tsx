import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardApiError, type DashboardApiClient } from "../client/apiClient";
import type {
  DashboardProductionState,
  DashboardRuntimeState
} from "../client/types";
import type { DashboardClientState } from "../state/dashboardState";
import { initialDashboardState } from "../state/dashboardState";
import { ProducerPanel } from "./ProducerPanel";

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;

let mountedRoot: Root | null = null;
let mountedContainer: HTMLDivElement | null = null;

function createProductionState(
  overrides: Partial<DashboardProductionState> = {}
): DashboardProductionState {
  const { graphicTakeState, emergency, ...restOverrides } = overrides;

  return {
    id: "production",
    status: "PRE_SHOW",
    activeMatchId: "match_grand-final",
    activeGameNumber: 1,
    activeDraftId: "draft_generic-001",
    overlaySafety: {
      readOnly: true,
      mutationAllowed: false
    },
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...restOverrides,
    graphicTakeState: {
      id: "graphic",
      graphicType: "DRAFT_OVERLAY",
      previewPayload: null,
      programPayload: null,
      status: "IDLE",
      ...graphicTakeState
    },
    emergency: {
      active: false,
      message: "private emergency reason must not be rendered",
      ...emergency
    }
  };
}

function createSnapshot(
  production: DashboardProductionState = createProductionState()
): DashboardRuntimeState {
  const health = {
    status: "OK" as const,
    serverStartedAt: "2026-06-01T00:00:00.000Z",
    now: "2026-06-01T00:00:05.000Z",
    uptimeSeconds: 5,
    socketClients: [
      {
        id: "socket_raw_123",
        role: "PRODUCER" as const,
        panel: "producer-panel",
        connectedAt: "2026-06-01T00:00:01.000Z",
        lastSeenAt: "2026-06-01T00:00:05.000Z"
      }
    ],
    loadedEventPackageId: "sample-event",
    currentProductionState: production.status,
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
      warnings: []
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
          message: "secret-value must not be rendered",
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
      gameCodes: ["generic-moba", "aov"]
    },
    teams: [
      {
        id: "team_blue",
        name: "Blue Meteors",
        shortName: "BLU",
        countryCode: "HK"
      },
      {
        id: "team_red",
        name: "Red Titans",
        shortName: "RED",
        countryCode: "HK"
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
        currentPhase: null,
        currentActionIds: [],
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
    production,
    adapters: [],
    adapterStatus: health.adapterStatus,
    availableAdapterIds: ["generic-moba", "aov"],
    validationWarnings: health.validationWarnings,
    health
  };
}

function createReadyState(
  production: DashboardProductionState = createProductionState()
): DashboardClientState {
  const snapshot = createSnapshot(production);

  return {
    ...initialDashboardState,
    loadStatus: "ready",
    socketStatus: "connected",
    snapshot,
    health: snapshot.health,
    lastUpdatedAt: snapshot.timestamp
  };
}

function createProducerApiClient(
  state: DashboardClientState,
  options: {
    postError?: DashboardApiError;
  } = {}
): {
  apiClient: DashboardApiClient;
  postCalls: Array<{ path: string; body: Record<string, unknown> }>;
} {
  const postCalls: Array<{ path: string; body: Record<string, unknown> }> = [];
  const response: { revision: number; production: DashboardProductionState } = {
    revision: (state.snapshot?.revision ?? 0) + 1,
    production: state.snapshot?.production ?? createProductionState()
  };
  const apiClient: DashboardApiClient = {
    async get<TData>(path: string): Promise<TData> {
      if (path === "/api/health") {
        return state.health as TData;
      }

      if (path === "/api/state") {
        return state.snapshot as TData;
      }

      if (path === "/api/production/state") {
        return response as TData;
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

      return response as TData;
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

function confirmWithOptionalText(
  container: HTMLDivElement,
  label: string,
  confirmationText?: string
): Promise<void> {
  if (confirmationText) {
    act(() => {
      setInputValue(container.querySelector<HTMLInputElement>(".confirmation-dialog input") ?? undefined, confirmationText);
    });
  }

  return act(async () => {
    findDialogButton(container, label).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function renderProducer(
  state: DashboardClientState,
  options: {
    apiClient?: DashboardApiClient;
    onRefresh?: () => void;
    routeMatchId?: string | null;
  } = {}
): HTMLDivElement {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.appendChild(container);
  mountedRoot = root;
  mountedContainer = container;

  act(() => {
    root.render(
      <ProducerPanel
        state={state}
        apiClient={options.apiClient ?? createProducerApiClient(state).apiClient}
        onRefresh={options.onRefresh ?? vi.fn()}
        routeMatchId={options.routeMatchId}
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

describe("ProducerPanel", () => {
  it("renders loading and empty production-safe states", () => {
    const loading = renderProducer({
      ...initialDashboardState,
      loadStatus: "loading"
    });

    expect(loading.textContent).toContain("Waiting for server state before showing production controls.");

    act(() => {
      mountedRoot?.unmount();
    });
    mountedContainer?.remove();
    mountedRoot = null;
    mountedContainer = null;

    const snapshot = {
      ...createSnapshot(),
      matches: [],
      currentMatchId: null,
      currentGameId: null,
      drafts: {}
    };
    const empty = renderProducer({
      ...createReadyState(snapshot.production),
      snapshot,
      health: snapshot.health
    });

    expect(empty.textContent).toContain("No match selected");
    expect(empty.textContent).toContain("No runtime draft");
  });

  it("renders production state, preview/program, emergency, and active context without raw sensitive details", () => {
    const container = renderProducer(
      createReadyState(
        createProductionState({
          graphicTakeState: {
            id: "graphic",
            graphicType: "DRAFT_OVERLAY",
            previewPayload: { matchId: "match_grand-final" },
            programPayload: { matchId: "match_grand-final" },
            status: "ON_PROGRAM",
            updatedAt: "2026-06-01T00:00:04.000Z"
          },
          emergency: {
            active: true,
            message: "private emergency reason must not be rendered",
            triggeredAt: "2026-06-01T00:00:03.000Z"
          }
        })
      )
    );
    const text = container.textContent ?? "";

    expect(text).toContain("Producer Panel");
    expect(text).toContain("Sample Invitational");
    expect(text).toContain("Grand Final");
    expect(text).toContain("draft_generic-001");
    expect(text).toContain("Prepared");
    expect(text).toContain("On air");
    expect(text).toContain("ACTIVE");
    expect(text).not.toContain("private emergency reason");
    expect(text).not.toContain("socket_raw_123");
    expect(text).not.toContain("production-log.jsonl");
    expect(text).not.toContain("secret-value");
  });

  it("lets the producer select production context without mutating until Apply is confirmed", async () => {
    const state = createReadyState();
    const { apiClient, postCalls } = createProducerApiClient(state);
    const container = renderProducer(state, { apiClient });
    const matchSelect = container.querySelectorAll<HTMLSelectElement>("select")[0];
    const stateSelect = container.querySelectorAll<HTMLSelectElement>("select")[3];

    act(() => {
      setSelectValue(matchSelect, "match_aov-showcase");
      setSelectValue(stateSelect, "DRAFT_READY");
    });

    expect(container.textContent).toContain("AOV Sample Showcase");
    expect(container.textContent).toContain("draft_aov-001");

    act(() => {
      findButton(container, "Apply State / Context").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls).toHaveLength(0);
    await confirmWithOptionalText(container, "Apply State");

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      path: "/api/production/state",
      body: {
        operatorId: "producer",
        status: "DRAFT_READY",
        activeMatchId: "match_aov-showcase",
        activeGameNumber: 1,
        activeDraftId: "draft_aov-001",
        confirm: true
      }
    });
  });

  it("calls Preview REST only after a manual click and never takes automatically", async () => {
    const state = createReadyState();
    const { apiClient, postCalls } = createProducerApiClient(state);
    const container = renderProducer(state, { apiClient });

    expect(postCalls).toHaveLength(0);

    await act(async () => {
      findButton(container, "Preview Graphic").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flushAsync();

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]?.path).toBe("/api/production/preview");
    expect(postCalls[0]?.body).toMatchObject({
      operatorId: "producer",
      graphicType: "DRAFT_OVERLAY",
      payload: {
        preparedBy: "producer-panel",
        matchId: "match_grand-final",
        gameNumber: 1,
        draftId: "draft_generic-001"
      }
    });
    expect(postCalls[0]?.body).not.toMatchObject({ confirm: true });
  });

  it("confirmation-gates Take to Program and sends confirm true over REST", async () => {
    const state = createReadyState(
      createProductionState({
        graphicTakeState: {
          id: "graphic",
          graphicType: "DRAFT_OVERLAY",
          previewPayload: { matchId: "match_grand-final" },
          programPayload: null,
          status: "PREVIEW"
        }
      })
    );
    const { apiClient, postCalls } = createProducerApiClient(state);
    const container = renderProducer(state, { apiClient });

    act(() => {
      findButton(container, "Take to Program").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls).toHaveLength(0);
    await confirmWithOptionalText(container, "Take to Program", "TAKE_PROGRAM");

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      path: "/api/production/take",
      body: {
        operatorId: "producer",
        confirm: true
      }
    });
  });

  it("confirmation-gates Clear Program and sends confirm true over REST", async () => {
    const state = createReadyState(
      createProductionState({
        graphicTakeState: {
          id: "graphic",
          graphicType: "DRAFT_OVERLAY",
          previewPayload: null,
          programPayload: { matchId: "match_grand-final" },
          status: "ON_PROGRAM"
        }
      })
    );
    const { apiClient, postCalls } = createProducerApiClient(state);
    const container = renderProducer(state, { apiClient });

    act(() => {
      findButton(container, "Clear Program").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(postCalls).toHaveLength(0);
    await confirmWithOptionalText(container, "Clear Program", "CLEAR_PROGRAM");

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({
      path: "/api/production/clear",
      body: {
        operatorId: "producer",
        confirm: true
      }
    });
  });

  it("confirmation-gates emergency trigger and clear actions", async () => {
    const triggerState = createReadyState();
    const triggerClient = createProducerApiClient(triggerState);
    const triggerContainer = renderProducer(triggerState, { apiClient: triggerClient.apiClient });

    act(() => {
      findButton(triggerContainer, "Trigger Emergency").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(triggerClient.postCalls).toHaveLength(0);
    await confirmWithOptionalText(triggerContainer, "Trigger Emergency", "EMERGENCY");
    expect(triggerClient.postCalls[0]).toMatchObject({
      path: "/api/production/emergency",
      body: {
        operatorId: "producer",
        confirm: true,
        message: "Technical Pause"
      }
    });

    act(() => {
      mountedRoot?.unmount();
    });
    mountedContainer?.remove();
    mountedRoot = null;
    mountedContainer = null;

    const clearState = createReadyState(
      createProductionState({
        emergency: {
          active: true,
          message: "private emergency reason must not be rendered"
        }
      })
    );
    const clearClient = createProducerApiClient(clearState);
    const clearContainer = renderProducer(clearState, { apiClient: clearClient.apiClient });

    act(() => {
      findButton(clearContainer, "Clear Emergency").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(clearClient.postCalls).toHaveLength(0);
    await confirmWithOptionalText(clearContainer, "Clear Emergency", "CLEAR_EMERGENCY");
    expect(clearClient.postCalls[0]).toMatchObject({
      path: "/api/production/emergency/clear",
      body: {
        operatorId: "producer",
        confirm: true
      }
    });
  });

  it("shows structured API errors safely", async () => {
    const state = createReadyState();
    const { apiClient } = createProducerApiClient(state, {
      postError: new DashboardApiError({
        code: "GRAPHICS_PREVIEW_REQUIRED",
        message: "A preview graphic must be prepared first."
      })
    });
    const container = renderProducer(state, { apiClient });

    await act(async () => {
      findButton(container, "Preview Graphic").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flushAsync();

    const text = container.textContent ?? "";
    expect(text).toContain("GRAPHICS_PREVIEW_REQUIRED");
    expect(text).toContain("A preview graphic must be prepared first.");
    expect(text).not.toContain("socket_raw_123");
    expect(text).not.toContain("production-log.jsonl");
    expect(text).not.toContain("private emergency reason");
    expect(text).not.toContain("secret-value");
  });

  it("does not render draft operator controls, overlay routes, raw audit details, or future integrations", () => {
    const container = renderProducer(createReadyState());
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/Hover Selected|Lock Selected|Start Draft|Reset Draft|Complete Draft|Undo|Redo/u);
    expect(text).not.toContain("/overlay/");
    expect(text).not.toMatch(/OBS|vMix|Companion|Stream Deck|Riot|LCU|Data Dragon|autoPick|autoBan|playerAutomation/u);
    expect(text).not.toContain("socket_raw_123");
    expect(text).not.toContain("production-log.jsonl");
    expect(text).not.toContain("private emergency reason");
    expect(text).not.toContain("secret-value");
  });
});
