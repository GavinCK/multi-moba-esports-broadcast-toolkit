import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { createEventPackageSummary } from "./event-package-loader.js";
import {
  createHealthResponse,
  createStateSnapshot,
  getRuntimeAdapter,
  listRuntimeAdapters,
  type ServerRuntimeState
} from "./runtime-state.js";
import { apiError, apiSuccess } from "./result.js";

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(payload)}\n`);
}

function notFound(response: ServerResponse): void {
  sendJson(
    response,
    404,
    apiError({
      code: "ROUTE_NOT_FOUND",
      message: "API route not found.",
      httpStatus: 404
    })
  );
}

function methodNotAllowed(response: ServerResponse): void {
  sendJson(
    response,
    405,
    apiError({
      code: "METHOD_NOT_ALLOWED",
      message: "This server foundation only exposes read-only GET endpoints.",
      httpStatus: 405
    })
  );
}

function eventPackageNotLoaded(response: ServerResponse, runtimeState: ServerRuntimeState): void {
  const result = runtimeState.eventPackageLoadResult;

  sendJson(
    response,
    result.ok ? 500 : result.error.httpStatus,
    apiError(
      result.ok
        ? {
            code: "INTERNAL_ERROR",
            message: "Event package load state was inconsistent.",
            httpStatus: 500
          }
        : result.error
    )
  );
}

function unknownEntity(
  response: ServerResponse,
  code: string,
  message: string,
  details: unknown
): void {
  sendJson(
    response,
    404,
    apiError({
      code,
      message,
      httpStatus: 404,
      details
    })
  );
}

function getPathParts(pathname: string): string[] {
  return pathname
    .split("/")
    .filter((part) => part.length > 0)
    .map((part) => decodeURIComponent(part));
}

export function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  runtimeState: ServerRuntimeState
): void {
  if (request.method !== "GET") {
    methodNotAllowed(response);
    return;
  }

  const requestUrl = new URL(request.url ?? "/", "http:" + "//localhost");
  const pathname = requestUrl.pathname;

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

  const pathParts = getPathParts(pathname);

  if (pathParts[0] === "api" && pathParts[1] === "adapters" && pathParts.length === 3) {
    const adapterId = pathParts[2];
    const adapter = getRuntimeAdapter(runtimeState, adapterId);

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
    try {
      handleApiRequest(request, response, runtimeState);
    } catch (error) {
      sendJson(
        response,
        500,
        apiError({
          code: "INTERNAL_ERROR",
          message: "Unexpected server error.",
          httpStatus: 500,
          details: {
            reason: error instanceof Error ? error.message : "Unknown error."
          }
        })
      );
    }
  });
}
