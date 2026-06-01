import { createInitialProductionState, type ProductionRuntimeState } from "@mmbt/core-production";
import type { GameCode, ProductionState, SystemHealth } from "@mmbt/shared-types";
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
  revision: number;
  lastStateUpdateAt: string;
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
    revision: 1,
    lastStateUpdateAt: now
  };
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
    socketClients: [],
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
