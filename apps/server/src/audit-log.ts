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
  productionState?: string;
  graphicType?: string;
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

function toDisplayPath(absolutePath: string, repositoryRoot: string, eventPackageRoot: string): string {
  const relativePath = relative(repositoryRoot, absolutePath);

  if (relativePath.length > 0 && !relativePath.startsWith("..") && !isAbsolute(relativePath)) {
    return toPortablePath(relativePath);
  }

  const packageRelativePath = relative(eventPackageRoot, absolutePath);

  if (packageRelativePath.length > 0 && !packageRelativePath.startsWith("..") && !isAbsolute(packageRelativePath)) {
    return `event-package/${toPortablePath(packageRelativePath)}`;
  }

  return "[redacted-audit-log-path]";
}

function ensureInsideRoot(root: string, candidatePath: string): boolean {
  const pathFromRoot = relative(root, candidatePath);

  return pathFromRoot.length === 0 || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot));
}

function normalizeLogPath(eventPackageRoot: string, logPath: string): string | null {
  const trimmedLogPath = logPath.trim();
  const segments = trimmedLogPath.split("/");

  if (
    trimmedLogPath.length === 0 ||
    isAbsolute(trimmedLogPath) ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmedLogPath) ||
    trimmedLogPath.includes("\\") ||
    trimmedLogPath.includes("?") ||
    trimmedLogPath.includes("#") ||
    segments.length < 2 ||
    segments[0] !== "logs" ||
    !segments[segments.length - 1]?.endsWith(".jsonl") ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    return null;
  }

  const absolutePath = resolve(eventPackageRoot, trimmedLogPath);
  const logsRoot = resolve(eventPackageRoot, "logs");

  return ensureInsideRoot(logsRoot, absolutePath) && absolutePath !== logsRoot ? absolutePath : null;
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function getSafeWriteError(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    const errorCode = (error as { code?: unknown }).code;

    if (typeof errorCode === "string") {
      return `Audit log append failed with filesystem error ${errorCode}.`;
    }
  }

  return "Audit log append failed with an unknown filesystem error.";
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
      lastError: "Event package production log path must be a JSONL file inside the package logs directory."
    };
  }

  return {
    absolutePath,
    displayPath: toDisplayPath(absolutePath, options.repositoryRoot, options.eventPackageRoot),
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
    auditLog.lastError = getSafeWriteError(error);

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
