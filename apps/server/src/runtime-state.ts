import { createInitialProductionState, type ProductionRuntimeState } from "@mmbt/core-production";
import type {
  ClientRole,
  GameCode,
  HealthClientCategory,
  ProductionState,
  SocketClientGroup,
  SocketClientInfo,
  SocketClientSummary,
  SystemHealth
} from "@mmbt/shared-types";
import { isAbsolute, join, resolve } from "node:path";

import { getDefaultEventPackagePath, getRepositoryRoot, toDisplayPath } from "./paths.js";
import { loadEventPackage, type LoadedEventPackage } from "./event-package-loader.js";
import type { AppResult } from "./result.js";
import { createAuditLogState, type AuditLogRuntimeState } from "./audit-log.js";
import {
  getPublicAdapterDetail,
  listPublicAdapterSummaries,
  loadLocalGameAdapters,
  validateEventPackageAdapterReferences,
  type AdapterValidationWarning,
  type LoadedLocalAdapters,
  type PublicAdapterDetail,
  type PublicAdapterSummary
} from "./adapter-loader.js";
import {
  createDraftRuntime,
  listDraftSummaries,
  type DraftRuntimeState,
  type DraftSummary
} from "./draft-runtime.js";
import { createProductionSnapshot, type PublicProductionState } from "./production-runtime.js";

export interface ServerRuntimeState {
  serverStartedAt: string;
  repositoryRoot: string;
  eventPackagePath: string;
  eventPackageRoot: string;
  eventPackageLoadResult: AppResult<LoadedEventPackage>;
  adapters: LoadedLocalAdapters;
  adapterValidationWarnings: AdapterValidationWarning[];
  drafts: DraftRuntimeState;
  production: ProductionRuntimeState;
  auditLog: AuditLogRuntimeState;
  socketClients: RuntimeSocketClientInfo[];
  revision: number;
  lastStateUpdateAt: string;
}

export interface RuntimeSocketClientInfo {
  id: string;
  role?: string;
  panel?: string;
  clientType?: string;
  route?: string;
  matchId?: string;
  userAgent?: string;
  connectedAt: string;
  lastSeenAt: string;
  readOnly: boolean;
}

export interface ServerHealthResponse extends SystemHealth {
  now: string;
  uptimeSeconds: number;
  eventPackagePath: string;
  validationWarnings: {
    eventPackage: LoadedEventPackage["validation"]["warnings"];
    adapters: AdapterValidationWarning[];
  };
}

export interface CreateServerRuntimeStateOptions {
  eventPackagePath?: string;
  repositoryRoot?: string;
  now?: string;
}

function resolveEventPackageRoot(eventPackagePath: string, repositoryRoot: string): string {
  return resolve(isAbsolute(eventPackagePath) ? eventPackagePath : join(repositoryRoot, eventPackagePath));
}

function getHealthStatus(loadResult: AppResult<LoadedEventPackage>): SystemHealth["status"] {
  if (!loadResult.ok) {
    return "ERROR";
  }

  return loadResult.value.assetStatus.warnings.length > 0 || loadResult.value.validation.warnings.length > 0
    ? "WARN"
    : "OK";
}

function hasKnownAdapterLoadFailure(adapterState: LoadedLocalAdapters): boolean {
  const statuses = adapterState.adapterStatus;

  return adapterState.knownAdapterIds.some((adapterId) => statuses[adapterId]?.loaded !== true);
}

function getRuntimeHealthStatus(runtimeState: ServerRuntimeState): SystemHealth["status"] {
  if (!runtimeState.eventPackageLoadResult.ok || hasKnownAdapterLoadFailure(runtimeState.adapters)) {
    return "ERROR";
  }

  if (!runtimeState.auditLog.writable) {
    return "ERROR";
  }

  if (runtimeState.adapterValidationWarnings.length > 0) {
    return "WARN";
  }

  return getHealthStatus(runtimeState.eventPackageLoadResult);
}

function getCurrentProductionState(production: ProductionRuntimeState): ProductionState {
  return production.status;
}

export async function createServerRuntimeState(
  options: CreateServerRuntimeStateOptions = {}
): Promise<ServerRuntimeState> {
  const repositoryRoot = options.repositoryRoot ?? getRepositoryRoot();
  const configuredEventPackagePath = options.eventPackagePath ?? getDefaultEventPackagePath(repositoryRoot);
  const eventPackageRoot = resolveEventPackageRoot(configuredEventPackagePath, repositoryRoot);
  const now = options.now ?? new Date().toISOString();
  const eventPackageLoadResult = loadEventPackage({
    packageRoot: eventPackageRoot,
    repositoryRoot
  });
  const adapters = await loadLocalGameAdapters({ now });
  const adapterValidationWarnings = eventPackageLoadResult.ok
    ? validateEventPackageAdapterReferences(eventPackageLoadResult.value, adapters)
    : [];
  const loadedPackage = eventPackageLoadResult.ok ? eventPackageLoadResult.value : null;
  const drafts = createDraftRuntime({
    eventPackage: loadedPackage,
    adapters,
    now
  });
  const activeMatchId = loadedPackage?.defaults.matchId ?? null;
  const activeGame = loadedPackage?.games.find(
    (game) => game.matchId === activeMatchId && game.gameNumber === 1
  );

  return {
    serverStartedAt: now,
    repositoryRoot,
    eventPackagePath: toDisplayPath(eventPackageRoot, repositoryRoot),
    eventPackageRoot,
    eventPackageLoadResult,
    adapters,
    adapterValidationWarnings,
    drafts,
    production: createInitialProductionState({
      status: "PRE_SHOW",
      activeMatchId,
      activeGameNumber: activeMatchId ? 1 : null,
      activeDraftId: activeGame?.draftId ?? null,
      now
    }),
    auditLog: createAuditLogState({
      eventPackageRoot,
      repositoryRoot,
      loadedPackage
    }),
    socketClients: [],
    revision: 1,
    lastStateUpdateAt: now
  };
}

function isKnownClientRole(role: string | undefined): role is ClientRole {
  return (
    role === "ADMIN" ||
    role === "PRODUCER" ||
    role === "DRAFT_OPERATOR" ||
    role === "REFEREE" ||
    role === "GRAPHICS_OPERATOR" ||
    role === "CASTER" ||
    role === "OBSERVER" ||
    role === "VIEWER"
  );
}

function createSocketClientHealth(client: RuntimeSocketClientInfo): SocketClientInfo {
  return {
    id: client.id,
    role: isKnownClientRole(client.role) ? client.role : undefined,
    panel: client.panel,
    connectedAt: client.connectedAt,
    lastSeenAt: client.lastSeenAt
  };
}

function getClientCategory(client: RuntimeSocketClientInfo): HealthClientCategory {
  const role = client.role?.toUpperCase();
  const panel = client.panel?.toLowerCase();
  const clientType = client.clientType?.toLowerCase();
  const route = client.route?.toLowerCase();

  if (
    role === "OVERLAY" ||
    clientType === "overlay" ||
    panel === "overlay" ||
    panel?.startsWith("overlay-") === true ||
    route?.startsWith("/overlay") === true
  ) {
    return "overlay";
  }

  if (role === "DRAFT_OPERATOR" || panel === "draft-operator" || route?.startsWith("/draft") === true) {
    return "draft-operator";
  }

  if (role === "PRODUCER" || panel === "producer-panel" || route?.startsWith("/producer") === true) {
    return "producer";
  }

  if (role === "CASTER" || panel === "caster-panel" || route?.startsWith("/caster") === true) {
    return "caster";
  }

  if (role === "ADMIN" || panel === "admin-dashboard" || route?.startsWith("/admin") === true) {
    return "dashboard";
  }

  return "other";
}

function incrementCount(counts: Record<string, number>, value: string | undefined): void {
  const key = value?.trim() || "not-reported";

  counts[key] = (counts[key] ?? 0) + 1;
}

function getLatestTimestamp(current: string | undefined, candidate: string | undefined): string | undefined {
  if (!candidate) {
    return current;
  }

  if (!current) {
    return candidate;
  }

  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

function addUniqueString(values: string[], value: string | undefined): void {
  if (!value || values.includes(value)) {
    return;
  }

  values.push(value);
}

function createSocketClientSummary(clients: RuntimeSocketClientInfo[]): SocketClientSummary {
  const summary: SocketClientSummary = {
    total: clients.length,
    readOnlyCount: 0,
    byRole: {},
    byPanel: {},
    byClientType: {}
  };

  clients.forEach((client) => {
    if (client.readOnly) {
      summary.readOnlyCount += 1;
    }

    incrementCount(summary.byRole, client.role);
    incrementCount(summary.byPanel, client.panel);
    incrementCount(summary.byClientType, client.clientType);
    summary.lastSeenAt = getLatestTimestamp(summary.lastSeenAt, client.lastSeenAt);
  });

  return summary;
}

function createSocketClientGroups(clients: RuntimeSocketClientInfo[]): SocketClientGroup[] {
  const groups = new Map<string, SocketClientGroup>();

  clients.forEach((client) => {
    const category = getClientCategory(client);
    const key = [
      category,
      client.role ?? "",
      client.panel ?? "",
      client.clientType ?? "",
      client.route ?? "",
      client.matchId ?? ""
    ].join("|");
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      existing.readOnlyCount += client.readOnly ? 1 : 0;
      existing.lastSeenAt = getLatestTimestamp(existing.lastSeenAt, client.lastSeenAt);
      return;
    }

    groups.set(key, {
      category,
      role: client.role,
      panel: client.panel,
      clientType: client.clientType,
      route: client.route,
      matchId: client.matchId,
      count: 1,
      readOnlyCount: client.readOnly ? 1 : 0,
      lastSeenAt: client.lastSeenAt
    });
  });

  return Array.from(groups.values()).sort((left, right) => {
    const categoryCompare = left.category.localeCompare(right.category);

    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return `${left.role ?? ""}${left.panel ?? ""}${left.route ?? ""}`.localeCompare(
      `${right.role ?? ""}${right.panel ?? ""}${right.route ?? ""}`
    );
  });
}

function createConnectionTarget(
  category: Exclude<HealthClientCategory, "other">
): NonNullable<SystemHealth["connectionStatus"]>["dashboard"] {
  return {
    category,
    connected: false,
    state: "not-reported",
    count: 0,
    panels: [],
    roles: [],
    routes: [],
    matchIds: []
  };
}

function getConnectionTargetKey(
  category: HealthClientCategory
): keyof NonNullable<SystemHealth["connectionStatus"]> | null {
  switch (category) {
    case "dashboard":
      return "dashboard";
    case "overlay":
      return "overlay";
    case "draft-operator":
      return "draftOperator";
    case "producer":
      return "producer";
    case "caster":
      return "caster";
    default:
      return null;
  }
}

function createConnectionStatus(
  clients: RuntimeSocketClientInfo[]
): NonNullable<SystemHealth["connectionStatus"]> {
  const status: NonNullable<SystemHealth["connectionStatus"]> = {
    dashboard: createConnectionTarget("dashboard"),
    overlay: createConnectionTarget("overlay"),
    draftOperator: createConnectionTarget("draft-operator"),
    producer: createConnectionTarget("producer"),
    caster: createConnectionTarget("caster")
  };

  clients.forEach((client) => {
    const key = getConnectionTargetKey(getClientCategory(client));

    if (!key) {
      return;
    }

    const target = status[key];
    target.connected = true;
    target.state = "connected";
    target.count += 1;
    addUniqueString(target.panels, client.panel);
    addUniqueString(target.roles, client.role);
    addUniqueString(target.routes, client.route);
    addUniqueString(target.matchIds, client.matchId);
    target.lastSeenAt = getLatestTimestamp(target.lastSeenAt, client.lastSeenAt);
  });

  Object.values(status).forEach((target) => {
    target.panels.sort();
    target.roles.sort();
    target.routes.sort();
    target.matchIds.sort();
  });

  return status;
}

function createAdapterStatus(runtimeState: ServerRuntimeState): SystemHealth["adapterStatus"] {
  const adapterStatus: SystemHealth["adapterStatus"] = {
    ...runtimeState.adapters.adapterStatus
  };

  runtimeState.adapterValidationWarnings.forEach((warning) => {
    if (adapterStatus[warning.adapterId]) {
      return;
    }

    adapterStatus[warning.adapterId] = {
      loaded: false,
      heroCount: 0,
      rulesetCount: 0,
      error: warning.message
    };
  });

  return adapterStatus;
}

export function createHealthResponse(
  runtimeState: ServerRuntimeState,
  now = new Date().toISOString()
): ServerHealthResponse {
  const loadResult = runtimeState.eventPackageLoadResult;
  const uptimeSeconds = Math.max(
    0,
    Math.floor((Date.parse(now) - Date.parse(runtimeState.serverStartedAt)) / 1000)
  );

  return {
    status: getRuntimeHealthStatus(runtimeState),
    serverStartedAt: runtimeState.serverStartedAt,
    now,
    uptimeSeconds,
    stateRevision: runtimeState.revision,
    socketClients: runtimeState.socketClients.map(createSocketClientHealth),
    clientSummary: createSocketClientSummary(runtimeState.socketClients),
    clientGroups: createSocketClientGroups(runtimeState.socketClients),
    connectionStatus: createConnectionStatus(runtimeState.socketClients),
    loadedEventPackageId: loadResult.ok ? loadResult.value.packageId : undefined,
    currentProductionState: getCurrentProductionState(runtimeState.production),
    adapterStatus: createAdapterStatus(runtimeState),
    assetStatus: loadResult.ok
      ? loadResult.value.assetStatus
      : {
          missingAssets: [],
          warnings: [loadResult.error.message]
        },
    auditLogStatus: {
      writable: runtimeState.auditLog.writable,
      path: runtimeState.auditLog.displayPath ?? undefined,
      lastWriteAt: runtimeState.auditLog.lastWriteAt,
      error: runtimeState.auditLog.lastError
    },
    emergencyReady: true,
    emergencyStatus: {
      ready: true,
      active: runtimeState.production.emergency.active,
      triggeredAt: runtimeState.production.emergency.triggeredAt,
      clearedAt: runtimeState.production.emergency.clearedAt
    },
    lastStateUpdateAt: runtimeState.lastStateUpdateAt,
    eventPackagePath: runtimeState.eventPackagePath,
    validationWarnings: {
      eventPackage: loadResult.ok ? loadResult.value.validation.warnings : [],
      adapters: runtimeState.adapterValidationWarnings
    }
  };
}

export interface ServerStateSnapshot {
  revision: number;
  timestamp: string;
  eventPackageId?: string;
  eventPackage?: {
    packageId: string;
    packagePath: string;
    schemaVersion: string;
    defaults: LoadedEventPackage["defaults"];
  };
  event?: LoadedEventPackage["event"];
  matches: LoadedEventPackage["matches"];
  teams: LoadedEventPackage["teams"];
  players: LoadedEventPackage["players"];
  sponsors: LoadedEventPackage["sponsors"];
  games: LoadedEventPackage["games"];
  rulesets: LoadedEventPackage["rulesets"];
  themes: LoadedEventPackage["themes"];
  currentMatchId: string | null;
  currentGameId: string | null;
  drafts: Record<string, DraftSummary>;
  production: PublicProductionState;
  adapters: PublicAdapterSummary[];
  adapterStatus: SystemHealth["adapterStatus"];
  availableAdapterIds: GameCode[];
  validationWarnings: {
    eventPackage: LoadedEventPackage["validation"]["warnings"];
    adapters: AdapterValidationWarning[];
  };
  health: ServerHealthResponse;
}

function getCurrentGameId(snapshot: LoadedEventPackage, production: ProductionRuntimeState): string | null {
  const currentGame = snapshot.games.find(
    (game) =>
      game.matchId === production.activeMatchId &&
      game.gameNumber === production.activeGameNumber
  );

  return currentGame?.id ?? null;
}

export function createStateSnapshot(
  runtimeState: ServerRuntimeState,
  now = new Date().toISOString()
): ServerStateSnapshot {
  const loadResult = runtimeState.eventPackageLoadResult;
  const health = createHealthResponse(runtimeState, now);

  if (!loadResult.ok) {
    return {
      revision: runtimeState.revision,
      timestamp: now,
      matches: [],
      teams: [],
      players: [],
      sponsors: [],
      games: [],
      rulesets: [],
      themes: [],
      currentMatchId: runtimeState.production.activeMatchId,
      currentGameId: null,
      drafts: {},
      production: createProductionSnapshot(runtimeState.production),
      adapters: listPublicAdapterSummaries(runtimeState.adapters),
      adapterStatus: createAdapterStatus(runtimeState),
      availableAdapterIds: runtimeState.adapters.adapters
        .filter((adapter) => adapter.loaded)
        .map((adapter) => adapter.gameCode),
      validationWarnings: {
        eventPackage: [],
        adapters: runtimeState.adapterValidationWarnings
      },
      health
    };
  }

  const snapshot = loadResult.value;

  return {
    revision: runtimeState.revision,
    timestamp: now,
    eventPackageId: snapshot.packageId,
    eventPackage: {
      packageId: snapshot.packageId,
      packagePath: snapshot.packagePath,
      schemaVersion: snapshot.schemaVersion,
      defaults: snapshot.defaults
    },
    event: snapshot.event,
    matches: snapshot.matches,
    teams: snapshot.teams,
    players: snapshot.players,
    sponsors: snapshot.sponsors,
    games: snapshot.games,
    rulesets: snapshot.rulesets,
    themes: snapshot.themes,
    currentMatchId: runtimeState.production.activeMatchId,
    currentGameId: getCurrentGameId(snapshot, runtimeState.production),
    drafts: Object.fromEntries(
      listDraftSummaries(runtimeState.drafts).map((draft) => [draft.id, draft])
    ),
    production: createProductionSnapshot(runtimeState.production),
    adapters: listPublicAdapterSummaries(runtimeState.adapters),
    adapterStatus: createAdapterStatus(runtimeState),
    availableAdapterIds: runtimeState.adapters.adapters
      .filter((adapter) => adapter.loaded)
      .map((adapter) => adapter.gameCode),
    validationWarnings: {
      eventPackage: snapshot.validation.warnings,
      adapters: runtimeState.adapterValidationWarnings
    },
    health
  };
}

export function listRuntimeAdapters(runtimeState: ServerRuntimeState): PublicAdapterSummary[] {
  return listPublicAdapterSummaries(runtimeState.adapters);
}

export function getRuntimeAdapter(
  runtimeState: ServerRuntimeState,
  adapterId: GameCode
): PublicAdapterDetail | null {
  return getPublicAdapterDetail(runtimeState.adapters, adapterId);
}
