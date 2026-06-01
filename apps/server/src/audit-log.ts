import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import type { JsonObject, JsonValue } from "@mmbt/shared-types";

import type { LoadedEventPackage } from "./event-package-loader.js";
import { fail, ok, type AppResult } from "./result.js";

export interface AuditLogRuntimeState {
  absolutePath: string | null;
  displayPath: string | null;
  writable: boolean;
  lastWriteAt?: string;
  lastError?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  eventType: string;
  eventPackageId: string;
  eventId?: string;
  matchId?: string;
  gameId?: string;
  draftId?: string;
  actionId?: string;
  operatorId?: string;
  previousRevision: number;
  nextRevision: number;
  result: JsonObject;
  metadata?: JsonObject;
}

export interface CreateAuditLogStateOptions {
  eventPackageRoot: string;
  repositoryRoot: string;
  loadedPackage: LoadedEventPackage | null;
}

function toPortablePath(pathValue: string): string {
  return pathValue.replace(/\\/g, "/");
}

function toDisplayPath(absolutePath: string, repositoryRoot: string): string {
  const relativePath = relative(repositoryRoot, absolutePath);

  return relativePath.length > 0 && !relativePath.startsWith("..") && !isAbsolute(relativePath)
    ? toPortablePath(relativePath)
    : toPortablePath(absolutePath);
}

function ensureInsideRoot(root: string, candidatePath: string): boolean {
  const pathFromRoot = relative(root, candidatePath);

  return pathFromRoot.length === 0 || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot));
}

function normalizeLogPath(eventPackageRoot: string, logPath: string): string | null {
  if (
    logPath.trim().length === 0 ||
    isAbsolute(logPath) ||
    /^[a-z][a-z0-9+.-]*:/i.test(logPath) ||
    logPath.includes("..") ||
    logPath.includes("?") ||
    logPath.includes("#")
  ) {
    return null;
  }

  const absolutePath = resolve(eventPackageRoot, logPath);

  return ensureInsideRoot(eventPackageRoot, absolutePath) ? absolutePath : null;
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function createAuditLogState(options: CreateAuditLogStateOptions): AuditLogRuntimeState {
  if (!options.loadedPackage) {
    return {
      absolutePath: null,
      displayPath: null,
      writable: false,
      lastError: "Event package is not loaded."
    };
  }

  const absolutePath = normalizeLogPath(options.eventPackageRoot, options.loadedPackage.productionLogPath);

  if (!absolutePath) {
    return {
      absolutePath: null,
      displayPath: null,
      writable: false,
      lastError: "Event package production log path is not a safe local path."
    };
  }

  return {
    absolutePath,
    displayPath: toDisplayPath(absolutePath, options.repositoryRoot),
    writable: true
  };
}

export function appendAuditLogEntry(
  auditLog: AuditLogRuntimeState,
  entry: AuditLogEntry
): AppResult<AuditLogEntry> {
  if (!auditLog.absolutePath) {
    auditLog.writable = false;
    auditLog.lastError = "Audit log path is unavailable.";

    return fail({
      code: "AUDIT_LOG_WRITE_FAILED",
      message: "Audit log path is unavailable.",
      httpStatus: 500
    });
  }

  try {
    mkdirSync(dirname(auditLog.absolutePath), { recursive: true });
    appendFileSync(auditLog.absolutePath, `${JSON.stringify(toJsonValue(entry))}\n`, "utf8");
    auditLog.writable = true;
    auditLog.lastWriteAt = entry.timestamp;
    auditLog.lastError = undefined;

    return ok(entry);
  } catch (error) {
    auditLog.writable = false;
    auditLog.lastError = error instanceof Error ? error.message : "Unknown audit log write error.";

    return fail({
      code: "AUDIT_LOG_WRITE_FAILED",
      message: "Audit log entry could not be appended.",
      httpStatus: 500,
      details: {
        path: auditLog.displayPath,
        reason: auditLog.lastError
      }
    });
  }
}

export function createAuditLogEntryId(timestamp: string, revision: number, event: string): string {
  const safeTimestamp = timestamp.replace(/[^0-9A-Za-z]/g, "-");

  return `log_${safeTimestamp}_${revision}_${event.toLowerCase()}`;
}

export function toAuditMetadata(value: Record<string, unknown>): JsonObject {
  return toJsonValue(value) as JsonObject;
}
