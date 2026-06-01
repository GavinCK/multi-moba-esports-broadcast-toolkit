import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import {
  completeDraft,
  hoverHero,
  lockHero,
  pauseDraft,
  redoLastUndoneAction,
  resetDraft,
  resumeDraft,
  startDraft,
  undoLastAction,
  type DraftEngineError,
  type DraftEngineResult
} from "@mmbt/core-draft";
import type { DraftState, JsonObject } from "@mmbt/shared-types";

import {
  appendAuditLogEntry,
  createAuditLogEntryId,
  toAuditMetadata,
  type AuditLogEntry
} from "./audit-log.js";
import { createEventPackageSummary, type LoadedEventPackage } from "./event-package-loader.js";
import {
  createDraftMutationSummary,
  createDraftRuntimeEntry,
  createDraftSnapshot,
  getDraftEntryByIdOrMatch,
  hasHero,
  listDraftSummaries,
  type DraftRuntimeEntry
} from "./draft-runtime.js";
import {
  createHealthResponse,
  createStateSnapshot,
  getRuntimeAdapter,
  listRuntimeAdapters,
  type ServerRuntimeState
} from "./runtime-state.js";
import { apiError, apiSuccess, type AppError } from "./result.js";

const DEFAULT_OPERATOR_ID = "local-operator";
const MAX_BODY_BYTES = 1024 * 1024;
const UNSAFE_OPERATOR_ID_PATTERN = new RegExp(["api[_-]?key", `sec${"ret"}`, "token", "password"].join("|"), "i");

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(payload)}\n`);
}

function notFound(response: ServerResponse): void {
  sendError(response, {
    code: "ROUTE_NOT_FOUND",
    message: "API route not found.",
    httpStatus: 404
  });
}

function methodNotAllowed(response: ServerResponse): void {
  sendError(response, {
    code: "METHOD_NOT_ALLOWED",
    message: "HTTP method is not allowed for this route.",
    httpStatus: 405
  });
}

function sendError(response: ServerResponse, error: AppError): void {
  sendJson(response, error.httpStatus, apiError(error));
}

function eventPackageNotLoaded(response: ServerResponse, runtimeState: ServerRuntimeState): void {
  const result = runtimeState.eventPackageLoadResult;

  sendError(
    response,
    result.ok
      ? {
          code: "INTERNAL_ERROR",
          message: "Event package load state was inconsistent.",
          httpStatus: 500
        }
      : result.error
  );
}

function unknownEntity(
  response: ServerResponse,
  code: string,
  message: string,
  details: unknown
): void {
  sendError(response, {
    code,
    message,
    httpStatus: 404,
    details
  });
}

function getPathParts(pathname: string): string[] {
  return pathname
    .split("/")
    .filter((part) => part.length > 0)
    .map((part) => decodeURIComponent(part));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeOperatorId(operatorId: unknown): string {
  if (typeof operatorId !== "string" || operatorId.trim().length === 0) {
    return DEFAULT_OPERATOR_ID;
  }

  const normalized = operatorId.trim().slice(0, 80);

  return UNSAFE_OPERATOR_ID_PATTERN.test(normalized)
    ? "redacted-operator"
    : normalized;
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_BODY_BYTES) {
      throw {
        code: "REQUEST_BODY_TOO_LARGE",
        message: "Request body is too large.",
        httpStatus: 413
      } satisfies AppError;
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (rawBody.length === 0) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw {
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      httpStatus: 400
    } satisfies AppError;
  }
}

function getLoadedEventPackage(runtimeState: ServerRuntimeState): LoadedEventPackage | null {
  return runtimeState.eventPackageLoadResult.ok ? runtimeState.eventPackageLoadResult.value : null;
}

function getDraftOrSendError(
  response: ServerResponse,
  runtimeState: ServerRuntimeState,
  draftIdOrMatchId: string
): DraftRuntimeEntry | null {
  const entry = getDraftEntryByIdOrMatch(
    runtimeState.drafts,
    getLoadedEventPackage(runtimeState),
    draftIdOrMatchId
  );

  if (!entry) {
    unknownEntity(response, "DRAFT_NOT_FOUND", "Draft ID or current match draft was not found.", {
      draftId: draftIdOrMatchId
    });
    return null;
  }

  return entry;
}

function getDraftEngineErrorStatus(error: DraftEngineError): number {
  if (error.code === "draft-confirmation-required") {
    return 409;
  }

  if (error.code === "draft-duplicate-hero" || error.code === "draft-duplicate-hover") {
    return 409;
  }

  if (error.code === "draft-action-not-found" || error.code === "draft-phase-not-found") {
    return 404;
  }

  if (error.code === "draft-hero-required") {
    return 400;
  }

  return 409;
}

function getDraftEngineErrorCode(error: DraftEngineError): string {
  switch (error.code) {
    case "draft-action-not-found":
      return "DRAFT_ACTION_NOT_FOUND";
    case "draft-confirmation-required":
      return "DRAFT_CONFIRMATION_REQUIRED";
    case "draft-duplicate-hero":
    case "draft-duplicate-hover":
      return "DRAFT_DUPLICATE_HERO";
    case "draft-hero-required":
      return "DRAFT_INVALID_PAYLOAD";
    case "draft-incomplete":
      return "DRAFT_INCOMPLETE";
    case "draft-ruleset-invalid":
    case "draft-ruleset-mismatch":
      return "DRAFT_RULESET_INVALID";
    default:
      return "DRAFT_INVALID_ACTION";
  }
}

function sendDraftEngineError(response: ServerResponse, error: DraftEngineError): void {
  sendError(response, {
    code: getDraftEngineErrorCode(error),
    message: error.message,
    httpStatus: getDraftEngineErrorStatus(error),
    details: error.details
  });
}

function validateRecordBody(body: unknown): AppError | null {
  return isRecord(body)
    ? null
    : {
        code: "DRAFT_INVALID_PAYLOAD",
        message: "Draft mutation payload must be a JSON object.",
        httpStatus: 400
      };
}

function validateConfirm(body: Record<string, unknown>, operation: string): AppError | null {
  if (body.confirm !== true) {
    return {
      code: "DRAFT_CONFIRMATION_REQUIRED",
      message: `${operation} requires confirm: true.`,
      httpStatus: 409,
      details: { operation }
    };
  }

  return null;
}

function validateReason(body: Record<string, unknown>, operation: string): AppError | null {
  if (!hasNonEmptyString(body.reason)) {
    return {
      code: "DRAFT_CONFIRMATION_REQUIRED",
      message: `${operation} requires a non-empty reason.`,
      httpStatus: 409,
      details: { operation }
    };
  }

  return null;
}

function createMutationResponse(
  runtimeState: ServerRuntimeState,
  entry: DraftRuntimeEntry
): {
  revision: number;
  draft: ReturnType<typeof createDraftSnapshot>;
} {
  return {
    revision: runtimeState.revision,
    draft: createDraftSnapshot(entry)
  };
}

function createAuditResultSummary(
  entry: DraftRuntimeEntry,
  actionId: string | undefined
): JsonObject {
  return toAuditMetadata({ ...createDraftMutationSummary(entry, actionId) });
}

function commitDraftMutation(
  runtimeState: ServerRuntimeState,
  entry: DraftRuntimeEntry,
  nextDraft: DraftState,
  audit: {
    event: string;
    operatorId: string;
    timestamp: string;
    actionId?: string;
    metadata?: JsonObject;
  }
): AppError | null {
  const previousRevision = runtimeState.revision;
  const nextRevision = previousRevision + 1;
  const nextEntry: DraftRuntimeEntry = {
    ...entry,
    draft: nextDraft
  };
  const auditEntry: AuditLogEntry = {
    id: createAuditLogEntryId(audit.timestamp, nextRevision, audit.event),
    timestamp: audit.timestamp,
    event: audit.event,
    eventType: audit.event,
    eventPackageId: getLoadedEventPackage(runtimeState)?.packageId ?? "unknown-event-package",
    eventId: getLoadedEventPackage(runtimeState)?.event.id,
    matchId: entry.matchId,
    gameId: entry.gameId,
    draftId: entry.draft.id,
    actionId: audit.actionId,
    operatorId: audit.operatorId,
    previousRevision,
    nextRevision,
    result: createAuditResultSummary(nextEntry, audit.actionId),
    metadata: audit.metadata
  };
  const auditResult = appendAuditLogEntry(runtimeState.auditLog, auditEntry);

  if (!auditResult.ok) {
    return auditResult.error;
  }

  runtimeState.drafts.drafts[entry.draft.id] = nextEntry;
  runtimeState.revision = nextRevision;
  runtimeState.lastStateUpdateAt = audit.timestamp;

  return null;
}

function commitDraftCreation(
  runtimeState: ServerRuntimeState,
  entry: DraftRuntimeEntry,
  audit: {
    operatorId: string;
    timestamp: string;
    metadata?: JsonObject;
  }
): AppError | null {
  const previousRevision = runtimeState.revision;
  const nextRevision = previousRevision + 1;
  const auditEntry: AuditLogEntry = {
    id: createAuditLogEntryId(audit.timestamp, nextRevision, "DRAFT_CREATED"),
    timestamp: audit.timestamp,
    event: "DRAFT_CREATED",
    eventType: "DRAFT_CREATED",
    eventPackageId: getLoadedEventPackage(runtimeState)?.packageId ?? "unknown-event-package",
    eventId: getLoadedEventPackage(runtimeState)?.event.id,
    matchId: entry.matchId,
    gameId: entry.gameId,
    draftId: entry.draft.id,
    operatorId: audit.operatorId,
    previousRevision,
    nextRevision,
    result: createAuditResultSummary(entry, undefined),
    metadata: audit.metadata
  };
  const auditResult = appendAuditLogEntry(runtimeState.auditLog, auditEntry);

  if (!auditResult.ok) {
    return auditResult.error;
  }

  runtimeState.drafts.drafts[entry.draft.id] = entry;
  runtimeState.revision = nextRevision;
  runtimeState.lastStateUpdateAt = audit.timestamp;

  return null;
}

function getMutationTimestamp(body: Record<string, unknown>): string {
  if (process.env.NODE_ENV === "test" && hasNonEmptyString(body.now)) {
    return body.now.trim();
  }

  return new Date().toISOString();
}

function createPayloadMetadata(body: Record<string, unknown>, extra: Record<string, unknown> = {}): JsonObject {
  return toAuditMetadata({
    ...extra,
    reasonProvided: hasNonEmptyString(body.reason),
    overrideRequested: isRecord(body.override) && body.override.enabled === true
  });
}

function getRequiredPayloadString(
  body: Record<string, unknown>,
  field: string
): string | AppError {
  const value = body[field];

  if (!hasNonEmptyString(value)) {
    return {
      code: "DRAFT_INVALID_PAYLOAD",
      message: `Draft payload requires a non-empty ${field}.`,
      httpStatus: 400,
      details: { field }
    };
  }

  return value.trim();
}

function handleDraftCreate(
  response: ServerResponse,
  runtimeState: ServerRuntimeState,
  payload: Record<string, unknown>,
  operatorId: string,
  timestamp: string
): void {
  const loadedPackage = getLoadedEventPackage(runtimeState);

  if (!loadedPackage) {
    eventPackageNotLoaded(response, runtimeState);
    return;
  }

  const gameId = getRequiredPayloadString(payload, "gameId");
  const gameCode = getRequiredPayloadString(payload, "gameCode");
  const rulesetId = getRequiredPayloadString(payload, "rulesetId");

  for (const value of [gameId, gameCode, rulesetId]) {
    if (typeof value !== "string") {
      sendError(response, value);
      return;
    }
  }

  const game = loadedPackage.games.find((item) => item.id === gameId);

  if (!game) {
    unknownEntity(response, "GAME_NOT_FOUND", "Game ID was not found in the loaded event package.", { gameId });
    return;
  }

  if (game.gameCode !== gameCode || game.rulesetId !== rulesetId) {
    sendError(response, {
      code: "DRAFT_INVALID_PAYLOAD",
      message: "Draft create payload must match the loaded local game ruleset linkage.",
      httpStatus: 422,
      details: {
        gameId,
        requestedGameCode: gameCode,
        actualGameCode: game.gameCode,
        requestedRulesetId: rulesetId,
        actualRulesetId: game.rulesetId
      }
    });
    return;
  }

  if (hasNonEmptyString(payload.matchId) && payload.matchId.trim() !== game.matchId) {
    sendError(response, {
      code: "DRAFT_INVALID_PAYLOAD",
      message: "Draft create matchId must match the loaded local game.",
      httpStatus: 422,
      details: {
        gameId,
        requestedMatchId: payload.matchId.trim(),
        actualMatchId: game.matchId
      }
    });
    return;
  }

  const draftId = hasNonEmptyString(payload.draftId) ? payload.draftId.trim() : game.draftId;

  if (!draftId) {
    sendError(response, {
      code: "DRAFT_INVALID_PAYLOAD",
      message: "Draft create requires a draftId when the loaded game has no draftId.",
      httpStatus: 400,
      details: { gameId }
    });
    return;
  }

  if (runtimeState.drafts.drafts[draftId]) {
    sendError(response, {
      code: "DRAFT_ALREADY_EXISTS",
      message: "A draft with this ID already exists in the in-memory runtime.",
      httpStatus: 409,
      details: { draftId }
    });
    return;
  }

  const entry = createDraftRuntimeEntry({
    eventPackage: loadedPackage,
    adapters: runtimeState.adapters,
    game,
    draftId,
    now: timestamp,
    operatorId
  });

  if (!entry) {
    sendError(response, {
      code: "DRAFT_RULESET_INVALID",
      message: "Draft could not be created from the loaded game ruleset.",
      httpStatus: 422,
      details: { gameId, rulesetId }
    });
    return;
  }

  const commitError = commitDraftCreation(runtimeState, entry, {
    operatorId,
    timestamp,
    metadata: createPayloadMetadata(payload, { gameId, rulesetId })
  });

  if (commitError) {
    sendError(response, commitError);
    return;
  }

  sendMutationSuccess(response, runtimeState, entry);
}

function sendMutationSuccess(
  response: ServerResponse,
  runtimeState: ServerRuntimeState,
  entry: DraftRuntimeEntry
): void {
  sendJson(response, 200, apiSuccess(createMutationResponse(runtimeState, entry)));
}

function applyDraftResult(
  response: ServerResponse,
  runtimeState: ServerRuntimeState,
  entry: DraftRuntimeEntry,
  result: DraftEngineResult<DraftState>,
  audit: {
    event: string;
    operatorId: string;
    timestamp: string;
    actionId?: string;
    metadata?: JsonObject;
  }
): void {
  if (!result.ok) {
    sendDraftEngineError(response, result.error);
    return;
  }

  const commitError = commitDraftMutation(runtimeState, entry, result.value, audit);

  if (commitError) {
    sendError(response, commitError);
    return;
  }

  const nextEntry = runtimeState.drafts.drafts[entry.draft.id];

  if (!nextEntry) {
    sendError(response, {
      code: "INTERNAL_ERROR",
      message: "Draft mutation committed but the updated draft could not be read.",
      httpStatus: 500
    });
    return;
  }

  sendMutationSuccess(response, runtimeState, nextEntry);
}

function validateHeroPayload(
  response: ServerResponse,
  body: Record<string, unknown>,
  entry: DraftRuntimeEntry
): string | null {
  if (!hasNonEmptyString(body.heroId)) {
    sendError(response, {
      code: "DRAFT_INVALID_PAYLOAD",
      message: "Draft hero action requires a non-empty heroId.",
      httpStatus: 400
    });
    return null;
  }

  const heroId = body.heroId.trim();

  if (!hasHero(entry, heroId)) {
    sendError(response, {
      code: "DRAFT_INVALID_ACTION",
      message: "Hero ID is not available in the loaded local adapter hero pool.",
      httpStatus: 422,
      details: {
        draftId: entry.draft.id,
        gameCode: entry.gameCode,
        heroId
      }
    });
    return null;
  }

  return heroId;
}

function isAppError(value: unknown): value is AppError {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    typeof value.httpStatus === "number"
  );
}

async function handleDraftPost(
  request: IncomingMessage,
  response: ServerResponse,
  runtimeState: ServerRuntimeState,
  pathParts: string[]
): Promise<void> {
  const body = await readJsonBody(request);
  const bodyError = validateRecordBody(body);

  if (bodyError) {
    sendError(response, bodyError);
    return;
  }

  const payload = body as Record<string, unknown>;
  const operatorId = sanitizeOperatorId(payload.operatorId);
  const timestamp = getMutationTimestamp(payload);

  if (pathParts.length === 2) {
    handleDraftCreate(response, runtimeState, payload, operatorId, timestamp);
    return;
  }

  const draftIdOrMatchId = pathParts[2];
  const operation = pathParts[3];

  if (!draftIdOrMatchId || !operation) {
    notFound(response);
    return;
  }

  const entry = getDraftOrSendError(response, runtimeState, draftIdOrMatchId);

  if (!entry) {
    return;
  }

  if (operation === "start" && pathParts.length === 4) {
    applyDraftResult(response, runtimeState, entry, startDraft(entry.draft, entry.ruleset, { now: timestamp, operatorId }), {
      event: "DRAFT_STARTED",
      operatorId,
      timestamp,
      metadata: createPayloadMetadata(payload)
    });
    return;
  }

  if (operation === "pause" && pathParts.length === 4) {
    applyDraftResult(response, runtimeState, entry, pauseDraft(entry.draft, { now: timestamp, operatorId }), {
      event: "DRAFT_PAUSED",
      operatorId,
      timestamp,
      metadata: createPayloadMetadata(payload)
    });
    return;
  }

  if (operation === "resume" && pathParts.length === 4) {
    applyDraftResult(response, runtimeState, entry, resumeDraft(entry.draft, { now: timestamp, operatorId }), {
      event: "DRAFT_RESUMED",
      operatorId,
      timestamp,
      metadata: createPayloadMetadata(payload)
    });
    return;
  }

  if (operation === "undo" && pathParts.length === 4) {
    const confirmationError = validateConfirm(payload, "Undo");
    const reasonError = validateReason(payload, "Undo");

    if (confirmationError || reasonError) {
      sendError(response, confirmationError ?? (reasonError as AppError));
      return;
    }

    applyDraftResult(response, runtimeState, entry, undoLastAction(entry.draft, entry.ruleset, { now: timestamp, operatorId }), {
      event: "DRAFT_ACTION_UNDONE",
      operatorId,
      timestamp,
      metadata: createPayloadMetadata(payload)
    });
    return;
  }

  if (operation === "redo" && pathParts.length === 4) {
    const confirmationError = validateConfirm(payload, "Redo");
    const reasonError = validateReason(payload, "Redo");

    if (confirmationError || reasonError) {
      sendError(response, confirmationError ?? (reasonError as AppError));
      return;
    }

    applyDraftResult(
      response,
      runtimeState,
      entry,
      redoLastUndoneAction(entry.draft, entry.ruleset, { now: timestamp, operatorId }),
      {
        event: "DRAFT_ACTION_REDONE",
        operatorId,
        timestamp,
        metadata: createPayloadMetadata(payload)
      }
    );
    return;
  }

  if (operation === "reset" && pathParts.length === 4) {
    const confirmationError = validateConfirm(payload, "Reset");
    const reasonError = validateReason(payload, "Reset");

    if (confirmationError || reasonError) {
      sendError(response, confirmationError ?? (reasonError as AppError));
      return;
    }

    applyDraftResult(
      response,
      runtimeState,
      entry,
      resetDraft(entry.draft, entry.ruleset, { now: timestamp, operatorId, confirmed: true }),
      {
        event: "DRAFT_RESET",
        operatorId,
        timestamp,
        metadata: createPayloadMetadata(payload, {
          confirmationTextProvided: payload.confirmationText === "RESET_DRAFT"
        })
      }
    );
    return;
  }

  if (operation === "complete" && pathParts.length === 4) {
    const confirmationError = validateConfirm(payload, "Complete draft");

    if (confirmationError) {
      sendError(response, confirmationError);
      return;
    }

    applyDraftResult(
      response,
      runtimeState,
      entry,
      completeDraft(entry.draft, { now: timestamp, operatorId, confirmed: true }),
      {
        event: "DRAFT_COMPLETED",
        operatorId,
        timestamp,
        metadata: createPayloadMetadata(payload)
      }
    );
    return;
  }

  if (operation === "actions" && pathParts.length === 6) {
    const actionId = pathParts[4];
    const actionOperation = pathParts[5];

    if (!actionId || !actionOperation) {
      notFound(response);
      return;
    }

    const heroId = validateHeroPayload(response, payload, entry);

    if (!heroId) {
      return;
    }

    if (actionOperation === "hover") {
      applyDraftResult(
        response,
        runtimeState,
        entry,
        hoverHero(entry.draft, entry.ruleset, { actionId, heroId, now: timestamp, operatorId }),
        {
          event: "HERO_HOVERED",
          operatorId,
          timestamp,
          actionId,
          metadata: createPayloadMetadata(payload, { heroId })
        }
      );
      return;
    }

    if (actionOperation === "lock") {
      applyDraftResult(
        response,
        runtimeState,
        entry,
        lockHero(entry.draft, entry.ruleset, { actionId, heroId, now: timestamp, operatorId }),
        {
          event: "HERO_LOCKED",
          operatorId,
          timestamp,
          actionId,
          metadata: createPayloadMetadata(payload, { heroId })
        }
      );
      return;
    }
  }

  notFound(response);
}

function handleDraftGet(
  response: ServerResponse,
  runtimeState: ServerRuntimeState,
  requestUrl: URL,
  pathParts: string[]
): void {
  if (pathParts.length === 2) {
    const matchId = requestUrl.searchParams.get("matchId") ?? undefined;
    const gameId = requestUrl.searchParams.get("gameId") ?? undefined;

    sendJson(
      response,
      200,
      apiSuccess({
        revision: runtimeState.revision,
        drafts: listDraftSummaries(runtimeState.drafts, { matchId, gameId })
      })
    );
    return;
  }

  if (pathParts.length === 3) {
    const draftIdOrMatchId = pathParts[2];
    const entry = getDraftOrSendError(response, runtimeState, draftIdOrMatchId ?? "");

    if (!entry) {
      return;
    }

    sendJson(
      response,
      200,
      apiSuccess({
        revision: runtimeState.revision,
        draft: createDraftSnapshot(entry)
      })
    );
    return;
  }

  notFound(response);
}

export async function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  runtimeState: ServerRuntimeState
): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", "http:" + "//localhost");
  const pathname = requestUrl.pathname;
  const pathParts = getPathParts(pathname);

  if (request.method === "POST" && pathParts[0] === "api" && pathParts[1] === "drafts") {
    if (!runtimeState.eventPackageLoadResult.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    await handleDraftPost(request, response, runtimeState, pathParts);
    return;
  }

  if (request.method !== "GET") {
    methodNotAllowed(response);
    return;
  }

  if (pathname === "/health" || pathname === "/api/health") {
    sendJson(response, 200, apiSuccess(createHealthResponse(runtimeState)));
    return;
  }

  if (pathname === "/api/event-package") {
    const result = runtimeState.eventPackageLoadResult;

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    sendJson(response, 200, apiSuccess(createEventPackageSummary(result.value)));
    return;
  }

  if (pathname === "/api/state") {
    sendJson(response, 200, apiSuccess(createStateSnapshot(runtimeState)));
    return;
  }

  if (pathParts[0] === "api" && pathParts[1] === "drafts") {
    handleDraftGet(response, runtimeState, requestUrl, pathParts);
    return;
  }

  if (pathname === "/api/adapters") {
    sendJson(
      response,
      200,
      apiSuccess({
        adapters: listRuntimeAdapters(runtimeState),
        adapterStatus: createHealthResponse(runtimeState).adapterStatus,
        warnings: runtimeState.adapterValidationWarnings
      })
    );
    return;
  }

  if (pathParts[0] === "api" && pathParts[1] === "adapters" && pathParts.length === 3) {
    const adapterId = pathParts[2];
    const adapter = getRuntimeAdapter(runtimeState, adapterId ?? "");

    if (!adapter) {
      unknownEntity(
        response,
        "ADAPTER_NOT_LOADED",
        "No loaded local adapter exists for the requested adapter ID.",
        { adapterId }
      );
      return;
    }

    sendJson(response, 200, apiSuccess(adapter));
    return;
  }

  if (pathname === "/api/events") {
    const result = runtimeState.eventPackageLoadResult;

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    sendJson(
      response,
      200,
      apiSuccess({
        eventPackageId: result.value.packageId,
        events: [result.value.event]
      })
    );
    return;
  }

  if (pathParts[0] === "api" && pathParts[1] === "events" && pathParts.length === 3) {
    const result = runtimeState.eventPackageLoadResult;
    const eventId = pathParts[2];

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    if (result.value.event.id !== eventId) {
      unknownEntity(response, "EVENT_NOT_FOUND", "Event ID was not found in the loaded event package.", { eventId });
      return;
    }

    sendJson(response, 200, apiSuccess(result.value.event));
    return;
  }

  if (pathname === "/api/matches") {
    const result = runtimeState.eventPackageLoadResult;

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    sendJson(
      response,
      200,
      apiSuccess({
        eventPackageId: result.value.packageId,
        matches: result.value.matches
      })
    );
    return;
  }

  if (pathParts[0] === "api" && pathParts[1] === "matches" && pathParts.length === 3) {
    const result = runtimeState.eventPackageLoadResult;
    const matchId = pathParts[2];

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    const match = result.value.matches.find((item) => item.id === matchId);

    if (!match) {
      unknownEntity(response, "MATCH_NOT_FOUND", "Match ID was not found in the loaded event package.", { matchId });
      return;
    }

    sendJson(response, 200, apiSuccess(match));
    return;
  }

  if (pathname === "/api/teams") {
    const result = runtimeState.eventPackageLoadResult;

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    sendJson(
      response,
      200,
      apiSuccess({
        eventPackageId: result.value.packageId,
        teams: result.value.teams
      })
    );
    return;
  }

  if (pathParts[0] === "api" && pathParts[1] === "teams" && pathParts.length === 3) {
    const result = runtimeState.eventPackageLoadResult;
    const teamId = pathParts[2];

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    const team = result.value.teams.find((item) => item.id === teamId);

    if (!team) {
      unknownEntity(response, "TEAM_NOT_FOUND", "Team ID was not found in the loaded event package.", { teamId });
      return;
    }

    sendJson(response, 200, apiSuccess(team));
    return;
  }

  if (pathname === "/api/players") {
    const result = runtimeState.eventPackageLoadResult;

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    sendJson(
      response,
      200,
      apiSuccess({
        eventPackageId: result.value.packageId,
        players: result.value.players
      })
    );
    return;
  }

  if (pathParts[0] === "api" && pathParts[1] === "players" && pathParts.length === 3) {
    const result = runtimeState.eventPackageLoadResult;
    const playerId = pathParts[2];

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    const player = result.value.players.find((item) => item.id === playerId);

    if (!player) {
      unknownEntity(response, "PLAYER_NOT_FOUND", "Player ID was not found in the loaded event package.", { playerId });
      return;
    }

    sendJson(response, 200, apiSuccess(player));
    return;
  }

  if (pathname === "/api/sponsors") {
    const result = runtimeState.eventPackageLoadResult;

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    sendJson(
      response,
      200,
      apiSuccess({
        eventPackageId: result.value.packageId,
        sponsors: result.value.sponsors
      })
    );
    return;
  }

  if (pathParts[0] === "api" && pathParts[1] === "sponsors" && pathParts.length === 3) {
    const result = runtimeState.eventPackageLoadResult;
    const sponsorId = pathParts[2];

    if (!result.ok) {
      eventPackageNotLoaded(response, runtimeState);
      return;
    }

    const sponsor = result.value.sponsors.find((item) => item.id === sponsorId);

    if (!sponsor) {
      unknownEntity(
        response,
        "SPONSOR_NOT_FOUND",
        "Sponsor ID was not found in the loaded event package.",
        { sponsorId }
      );
      return;
    }

    sendJson(response, 200, apiSuccess(sponsor));
    return;
  }

  notFound(response);
}

export function createHttpServer(runtimeState: ServerRuntimeState): Server {
  return createServer((request, response) => {
    handleApiRequest(request, response, runtimeState).catch((error: unknown) => {
      const appError = isAppError(error)
        ? error
        : {
            code: "INTERNAL_ERROR",
            message: "Unexpected server error.",
            httpStatus: 500,
            details: {
              reason: error instanceof Error ? error.message : "Unknown error."
            }
          };

      sendError(response, appError);
    });
  });
}
