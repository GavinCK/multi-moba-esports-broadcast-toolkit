import type { SocketEnvelope } from "@mmbt/shared-types";
import { io, type Socket } from "socket.io-client";

import type {
  DashboardHealthUpdatePayload,
  DashboardStateFullPayload
} from "../client/types";
import type { DashboardSocketStatus } from "./dashboardState";

const SOCKET_EVENTS = {
  CLIENT_HELLO: "client:hello",
  STATE_FULL: "state:full",
  STATE_PATCH: "state:patch",
  STATE_REQUEST_FULL: "state:request-full",
  DRAFT_UPDATED: "draft:updated",
  DRAFT_TIMER: "draft:timer",
  PRODUCTION_STATE: "production:state",
  GRAPHICS_PREVIEW: "graphics:preview",
  GRAPHICS_PROGRAM: "graphics:program",
  GRAPHICS_CLEAR: "graphics:clear",
  HEALTH_UPDATE: "health:update",
  ERROR: "error"
} as const;

export interface DashboardSocketHandlers {
  onStatus(status: DashboardSocketStatus, message?: string): void;
  onStateFull(envelope: SocketEnvelope<DashboardStateFullPayload>): void;
  onHealthUpdate(envelope: SocketEnvelope<DashboardHealthUpdatePayload>): void;
  onSocketError(message: string): void;
}

export interface DashboardSocketOptions {
  url?: string;
  path?: string;
  route?: string;
}

export interface DashboardSocketConnection {
  requestFullState(): void;
  disconnect(): void;
}

function readRoute(options: DashboardSocketOptions): string {
  if (options.route) {
    return options.route;
  }

  return typeof window === "undefined" ? "/admin" : window.location.pathname;
}

function readClientIdentity(route: string): {
  role: "ADMIN" | "DRAFT_OPERATOR";
  panel: "admin-dashboard" | "draft-operator";
  capabilities: string[];
} {
  if (route === "/draft" || route.startsWith("/draft/")) {
    return {
      role: "DRAFT_OPERATOR",
      panel: "draft-operator",
      capabilities: ["read-only", "state:full", "draft:updated", "health:update"]
    };
  }

  return {
    role: "ADMIN",
    panel: "admin-dashboard",
    capabilities: ["read-only", "state:full", "health:update"]
  };
}

function readErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "payload" in payload &&
    typeof (payload as { payload?: { message?: unknown } }).payload?.message === "string"
  ) {
    return (payload as { payload: { message: string } }).payload.message;
  }

  return "Socket error received from server.";
}

export function connectDashboardSocket(
  handlers: DashboardSocketHandlers,
  options: DashboardSocketOptions = {}
): DashboardSocketConnection {
  handlers.onStatus("connecting");

  const socket: Socket = io(options.url, {
    path: options.path ?? "/socket.io",
    reconnection: true,
    transports: ["websocket", "polling"]
  });

  function requestFullState(): void {
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.STATE_REQUEST_FULL);
    }
  }

  socket.on("connect", () => {
    const route = readRoute(options);
    const identity = readClientIdentity(route);

    handlers.onStatus("connected");
    socket.emit(SOCKET_EVENTS.CLIENT_HELLO, {
      role: identity.role,
      panel: identity.panel,
      route,
      version: "0.1",
      capabilities: identity.capabilities
    });
  });

  socket.on("disconnect", (reason) => {
    handlers.onStatus("disconnected", reason);
  });

  socket.io.on("reconnect_attempt", () => {
    handlers.onStatus("connecting");
  });

  socket.on("connect_error", (error) => {
    handlers.onStatus("error", error.message);
  });

  socket.on(SOCKET_EVENTS.STATE_FULL, (envelope: SocketEnvelope<DashboardStateFullPayload>) => {
    handlers.onStateFull(envelope);
  });

  socket.on(SOCKET_EVENTS.HEALTH_UPDATE, (envelope: SocketEnvelope<DashboardHealthUpdatePayload>) => {
    handlers.onHealthUpdate(envelope);
  });

  socket.on(SOCKET_EVENTS.ERROR, (envelope: unknown) => {
    handlers.onSocketError(readErrorMessage(envelope));
  });

  [
    SOCKET_EVENTS.STATE_PATCH,
    SOCKET_EVENTS.DRAFT_UPDATED,
    SOCKET_EVENTS.DRAFT_TIMER,
    SOCKET_EVENTS.PRODUCTION_STATE,
    SOCKET_EVENTS.GRAPHICS_PREVIEW,
    SOCKET_EVENTS.GRAPHICS_PROGRAM,
    SOCKET_EVENTS.GRAPHICS_CLEAR
  ].forEach((eventName) => {
    socket.on(eventName, requestFullState);
  });

  return {
    requestFullState,
    disconnect() {
      socket.removeAllListeners();
      socket.disconnect();
    }
  };
}
