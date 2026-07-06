import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";

import type { ProductionRuntimeState } from "@mmbt/core-production";
import type { DraftState, MatchPresentationMetadata } from "@mmbt/shared-types";

import {
  appendAuditLogEntry,
  createAuditLogEntryId,
  toAuditMetadata,
  type AuditLogEntry
} from "./audit-log.js";
import { fail, ok, type AppResult } from "./result.js";
import type { ServerRuntimeState } from "./runtime-state.js";

export const STATE_SNAPSHOT_FILE_NAME = "state-snapshot.json";
export const STALE_STATE_SNAPSHOT_FILE_NAME = "state-snapshot.stale.json";
export const STATE_SNAPSHOT_DEBOUNCE_MS = 500;
const STATE_SNAPSHOT_SCHEMA_VERSION = 1;

export interface RuntimeSnapshotState {
  absolutePath: string;
  staleAbsolutePath: string;
  restoredFromSnapshot: boolean;
  lastWriteAt?: string;
  lastError?: string;
  pendingWrite: ReturnType<typeof setTimeout> | null;
}

export interface RuntimeStateSnapshot {
  schemaVersion: typeof STATE_SNAPSHOT_SCHEMA_VERSION;
  revision: number;
  eventPackagePath: string;
  eventPackageId: string;
  timestamp: string;
  drafts: Record<string, DraftState>;
  production: ProductionRuntimeState;
  matchPresentations: Record<string, MatchPresentationMetadata>;
}

export interface RuntimeStateSnapshotRestoreResult {
  restored: boolean;
  reason: "missing" | "restored" | "event-package-invalid" | "invalid" | "mismatch";
  stalePath?: string;
  restoredDraftCount?: number;
  pausedDraftCount?: number;
  warning?: string;
}

type SnapshotLogger = Pick<Console, "warn">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue;
}

function getNow(): string {
  return new Date().toISOString();
}

function getSafeSnapshotError(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    const code = (error as { code?: unknown }).code;

    if (typeof code === "string") {
      return `State snapshot filesystem operation failed with ${code}.`;
    }
  }

  return "State snapshot filesystem operation failed.";
}

function getComparablePath(pathValue: string): string {
  const resolved = resolve(pathValue);

  return process.platform === "win32" ? resolved.toLocaleLowerCase() : resolved;
}

function getSnapshotTempPath(snapshotPath: string): string {
  return `${snapshotPath}.${process.pid}.${Date.now()}.tmp`;
}

function createSnapshotWriteError(message: string, details?: unknown) {
  return {
    code: "STATE_SNAPSHOT_WRITE_FAILED",
    message,
    httpStatus: 500,
    details
  };
}

function createSnapshotReadError(message: string, details?: unknown) {
  return {
    code: "STATE_SNAPSHOT_INVALID",
    message,
    httpStatus: 500,
    details
  };
}

function hasValidDraftStatus(value: unknown): value is DraftState["status"] | "RUNNING" {
  return (
    value === "NOT_STARTED" ||
    value === "READY" ||
    value === "LIVE" ||
    value === "RUNNING" ||
    value === "PAUSED" ||
    value === "COMPLETE" ||
    value === "CANCELLED"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isDraftLike(value: unknown): value is DraftState {
  if (!isRecord(value) || !isRecord(value.timer)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.gameId === "string" &&
    typeof value.rulesetId === "string" &&
    typeof value.gameCode === "string" &&
    hasValidDraftStatus(value.status) &&
    Number.isInteger(value.currentPhaseIndex) &&
    typeof value.timer.isRunning === "boolean" &&
    typeof value.timer.remainingSeconds === "number" &&
    typeof value.timer.originalSeconds === "number" &&
    Array.isArray(value.actions) &&
    isStringArray(value.lockedHeroIds) &&
    isStringArray(value.bannedHeroIds) &&
    isStringArray(value.pickedHeroIds) &&
    Array.isArray(value.history)
  );
}

function isProductionLike(value: unknown): value is ProductionRuntimeState {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    isRecord(value.graphicTakeState) &&
    isRecord(value.emergency) &&
    isRecord(value.overlaySafety) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function readDraftMap(value: unknown): Record<string, DraftState> | null {
  if (!isRecord(value)) {
    return null;
  }

  const drafts: Record<string, DraftState> = {};

  for (const [draftId, draft] of Object.entries(value)) {
    if (!isDraftLike(draft) || draft.id !== draftId) {
      return null;
    }

    drafts[draftId] = draft;
  }

  return drafts;
}

function readPresentationMap(value: unknown): Record<string, MatchPresentationMetadata> | null {
  if (!isRecord(value)) {
    return null;
  }

  const presentations: Record<string, MatchPresentationMetadata> = {};

  for (const [matchId, presentation] of Object.entries(value)) {
    if (!isRecord(presentation)) {
      return null;
    }

    presentations[matchId] = presentation as MatchPresentationMetadata;
  }

  return presentations;
}

function pauseRestoredDraftIfRunning(draft: DraftState, now: string): { draft: DraftState; paused: boolean } {
  const status = draft.status as string;

  if (status !== "LIVE" && status !== "RUNNING") {
    return {
      draft: cloneJson(draft),
      paused: false
    };
  }

  return {
    draft: {
      ...cloneJson(draft),
      status: "PAUSED",
      timer: {
        ...draft.timer,
        isRunning: false,
        phaseStartedAt: undefined,
        pausedAt: draft.timer.pausedAt ?? now
      }
    },
    paused: true
  };
}

function applyRestoredDrafts(
  runtimeState: ServerRuntimeState,
  snapshot: RuntimeStateSnapshot,
  now: string
): { restoredDraftCount: number; pausedDraftCount: number } {
  let restoredDraftCount = 0;
  let pausedDraftCount = 0;

  Object.entries(snapshot.drafts).forEach(([draftId, draft]) => {
    const entry =
      runtimeState.drafts.drafts[draftId] ??
      Object.values(runtimeState.drafts.drafts).find(
        (candidate) =>
          candidate.gameId === draft.gameId &&
          candidate.rulesetId === draft.rulesetId &&
          candidate.gameCode === draft.gameCode
      );

    if (!entry) {
      return;
    }

    const restored = pauseRestoredDraftIfRunning(draft, now);
    runtimeState.drafts.drafts[draftId] = {
      ...entry,
      draft: restored.draft
    };
    restoredDraftCount += 1;
    pausedDraftCount += restored.paused ? 1 : 0;
  });

  return { restoredDraftCount, pausedDraftCount };
}

function applyRestoredMatchPresentations(
  runtimeState: ServerRuntimeState,
  snapshot: RuntimeStateSnapshot
): void {
  const loadedPackage = runtimeState.eventPackageLoadResult.ok
    ? runtimeState.eventPackageLoadResult.value
    : null;

  if (!loadedPackage) {
    return;
  }

  loadedPackage.matches = loadedPackage.matches.map((match) => {
    const presentation = snapshot.matchPresentations[match.id];

    return presentation
      ? {
          ...match,
          presentation: cloneJson(presentation)
        }
      : match;
  });
}

function applyRestoredProduction(
  runtimeState: ServerRuntimeState,
  snapshot: RuntimeStateSnapshot
): void {
  runtimeState.production = {
    ...cloneJson(snapshot.production),
    overlaySafety: {
      readOnly: true,
      mutationAllowed: false
    }
  };
}

function appendRestoreAuditEntry(
  runtimeState: ServerRuntimeState,
  snapshot: RuntimeStateSnapshot,
  now: string,
  restoredDraftCount: number,
  pausedDraftCount: number,
  logger: SnapshotLogger
): void {
  if (!runtimeState.eventPackageLoadResult.ok) {
    return;
  }

  const loadedPackage = runtimeState.eventPackageLoadResult.value;
  const previousRevision = snapshot.revision;
  const nextRevision = previousRevision + 1;
  const auditEntry: AuditLogEntry = {
    id: createAuditLogEntryId(now, nextRevision, "STATE_RESTORED_FROM_SNAPSHOT"),
    timestamp: now,
    event: "STATE_RESTORED_FROM_SNAPSHOT",
    eventType: "STATE_RESTORED_FROM_SNAPSHOT",
    eventPackageId: loadedPackage.packageId,
    eventId: loadedPackage.event.id,
    previousRevision,
    nextRevision,
    result: toAuditMetadata({
      snapshotPath: join("runtime", STATE_SNAPSHOT_FILE_NAME).replace(/\\/g, "/"),
      restoredDraftCount,
      pausedDraftCount,
      restoredProduction: true,
      restoredMatchPresentations: Object.keys(snapshot.matchPresentations).length
    }),
    metadata: toAuditMetadata({
      eventPackagePathMatched: true,
      snapshotTimestamp: snapshot.timestamp
    })
  };
  const auditResult = appendAuditLogEntry(runtimeState.auditLog, auditEntry);

  if (!auditResult.ok) {
    logger.warn(`State snapshot restored, but restore audit entry could not be written: ${auditResult.error.message}`);
    return;
  }

  runtimeState.revision = nextRevision;
  runtimeState.lastStateUpdateAt = now;
}

function markSnapshotStale(
  snapshotState: RuntimeSnapshotState,
  logger: SnapshotLogger,
  warning: string
): RuntimeStateSnapshotRestoreResult {
  try {
    if (existsSync(snapshotState.staleAbsolutePath)) {
      unlinkSync(snapshotState.staleAbsolutePath);
    }

    renameSync(snapshotState.absolutePath, snapshotState.staleAbsolutePath);
  } catch (error) {
    const reason = getSafeSnapshotError(error);
    logger.warn(`${warning} ${reason}`);

    return {
      restored: false,
      reason: "invalid",
      warning: `${warning} ${reason}`
    };
  }

  logger.warn(warning);

  return {
    restored: false,
    reason: warning.includes("mismatched") ? "mismatch" : "invalid",
    stalePath: snapshotState.staleAbsolutePath,
    warning
  };
}

export function createRuntimeSnapshotState(eventPackageRoot: string): RuntimeSnapshotState {
  const runtimeRoot = join(eventPackageRoot, "runtime");

  return {
    absolutePath: join(runtimeRoot, STATE_SNAPSHOT_FILE_NAME),
    staleAbsolutePath: join(runtimeRoot, STALE_STATE_SNAPSHOT_FILE_NAME),
    restoredFromSnapshot: false,
    pendingWrite: null
  };
}

export function createRuntimeStateSnapshot(
  runtimeState: ServerRuntimeState,
  timestamp = getNow()
): AppResult<RuntimeStateSnapshot> {
  if (!runtimeState.eventPackageLoadResult.ok) {
    return fail(
      createSnapshotWriteError("State snapshot cannot be written because the event package is not loaded.")
    );
  }

  const loadedPackage = runtimeState.eventPackageLoadResult.value;
  const matchPresentations: Record<string, MatchPresentationMetadata> = {};

  loadedPackage.matches.forEach((match) => {
    if (match.presentation) {
      matchPresentations[match.id] = cloneJson(match.presentation);
    }
  });

  return ok({
    schemaVersion: STATE_SNAPSHOT_SCHEMA_VERSION,
    revision: runtimeState.revision,
    eventPackagePath: runtimeState.eventPackageRoot,
    eventPackageId: loadedPackage.packageId,
    timestamp,
    drafts: Object.fromEntries(
      Object.entries(runtimeState.drafts.drafts).map(([draftId, entry]) => [draftId, cloneJson(entry.draft)])
    ),
    production: cloneJson(runtimeState.production),
    matchPresentations
  });
}

export function parseRuntimeStateSnapshot(value: unknown): AppResult<RuntimeStateSnapshot> {
  if (!isRecord(value)) {
    return fail(createSnapshotReadError("State snapshot must be a JSON object."));
  }

  const drafts = readDraftMap(value.drafts);
  const matchPresentations = readPresentationMap(value.matchPresentations);

  if (
    value.schemaVersion !== STATE_SNAPSHOT_SCHEMA_VERSION ||
    !Number.isInteger(value.revision) ||
    (value.revision as number) < 1 ||
    typeof value.eventPackagePath !== "string" ||
    value.eventPackagePath.trim().length === 0 ||
    typeof value.eventPackageId !== "string" ||
    typeof value.timestamp !== "string" ||
    !drafts ||
    !isProductionLike(value.production) ||
    !matchPresentations
  ) {
    return fail(createSnapshotReadError("State snapshot has an unsupported or incomplete shape."));
  }

  return ok({
    schemaVersion: STATE_SNAPSHOT_SCHEMA_VERSION,
    revision: value.revision as number,
    eventPackagePath: value.eventPackagePath,
    eventPackageId: value.eventPackageId,
    timestamp: value.timestamp,
    drafts,
    production: value.production,
    matchPresentations
  });
}

export function writeRuntimeStateSnapshot(
  runtimeState: ServerRuntimeState,
  timestamp = getNow()
): AppResult<RuntimeStateSnapshot> {
  const snapshotResult = createRuntimeStateSnapshot(runtimeState, timestamp);

  if (!snapshotResult.ok) {
    runtimeState.snapshot.lastError = snapshotResult.error.message;
    return snapshotResult;
  }

  const tempPath = getSnapshotTempPath(runtimeState.snapshot.absolutePath);

  try {
    mkdirSync(dirname(runtimeState.snapshot.absolutePath), { recursive: true });
    writeFileSync(tempPath, `${JSON.stringify(snapshotResult.value, null, 2)}\n`, "utf8");
    renameSync(tempPath, runtimeState.snapshot.absolutePath);
    runtimeState.snapshot.lastWriteAt = timestamp;
    runtimeState.snapshot.lastError = undefined;

    return snapshotResult;
  } catch (error) {
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch {
      // Best-effort cleanup; the original write error is more useful to report.
    }

    const reason = getSafeSnapshotError(error);
    runtimeState.snapshot.lastError = reason;

    return fail(
      createSnapshotWriteError("State snapshot could not be written.", {
        path: runtimeState.snapshot.absolutePath,
        reason
      })
    );
  }
}

export function scheduleRuntimeStateSnapshot(
  runtimeState: ServerRuntimeState,
  debounceMs = STATE_SNAPSHOT_DEBOUNCE_MS,
  logger: SnapshotLogger = console
): void {
  if (runtimeState.snapshot.pendingWrite) {
    clearTimeout(runtimeState.snapshot.pendingWrite);
  }

  runtimeState.snapshot.pendingWrite = setTimeout(() => {
    runtimeState.snapshot.pendingWrite = null;
    const result = writeRuntimeStateSnapshot(runtimeState);

    if (!result.ok) {
      logger.warn(result.error.message);
    }
  }, debounceMs);
}

export function flushRuntimeStateSnapshot(
  runtimeState: ServerRuntimeState,
  logger: SnapshotLogger = console
): AppResult<RuntimeStateSnapshot> | null {
  if (!runtimeState.snapshot.pendingWrite) {
    return null;
  }

  clearTimeout(runtimeState.snapshot.pendingWrite);
  runtimeState.snapshot.pendingWrite = null;
  const result = writeRuntimeStateSnapshot(runtimeState);

  if (!result.ok) {
    logger.warn(result.error.message);
  }

  return result;
}

export function restoreRuntimeStateFromSnapshot(
  runtimeState: ServerRuntimeState,
  options: { now?: string; logger?: SnapshotLogger } = {}
): RuntimeStateSnapshotRestoreResult {
  const logger = options.logger ?? console;
  const now = options.now ?? getNow();

  if (!existsSync(runtimeState.snapshot.absolutePath)) {
    return {
      restored: false,
      reason: "missing"
    };
  }

  if (!runtimeState.eventPackageLoadResult.ok) {
    return {
      restored: false,
      reason: "event-package-invalid"
    };
  }

  let rawSnapshot: unknown;

  try {
    rawSnapshot = JSON.parse(readFileSync(runtimeState.snapshot.absolutePath, "utf8")) as unknown;
  } catch {
    return markSnapshotStale(
      runtimeState.snapshot,
      logger,
      "Existing state snapshot was unparseable and has been moved to state-snapshot.stale.json."
    );
  }

  const parsed = parseRuntimeStateSnapshot(rawSnapshot);

  if (!parsed.ok) {
    return markSnapshotStale(
      runtimeState.snapshot,
      logger,
      "Existing state snapshot was invalid and has been moved to state-snapshot.stale.json."
    );
  }

  const snapshot = parsed.value;

  if (getComparablePath(snapshot.eventPackagePath) !== getComparablePath(runtimeState.eventPackageRoot)) {
    return markSnapshotStale(
      runtimeState.snapshot,
      logger,
      "Existing state snapshot had a mismatched eventPackagePath and has been moved to state-snapshot.stale.json."
    );
  }

  const draftResult = applyRestoredDrafts(runtimeState, snapshot, now);

  applyRestoredProduction(runtimeState, snapshot);
  applyRestoredMatchPresentations(runtimeState, snapshot);
  runtimeState.revision = snapshot.revision;
  runtimeState.lastStateUpdateAt = snapshot.timestamp;
  runtimeState.snapshot.restoredFromSnapshot = true;
  appendRestoreAuditEntry(
    runtimeState,
    snapshot,
    now,
    draftResult.restoredDraftCount,
    draftResult.pausedDraftCount,
    logger
  );
  writeRuntimeStateSnapshot(runtimeState, now);

  return {
    restored: true,
    reason: "restored",
    restoredDraftCount: draftResult.restoredDraftCount,
    pausedDraftCount: draftResult.pausedDraftCount
  };
}
