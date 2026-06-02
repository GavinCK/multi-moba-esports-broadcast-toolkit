import type { SocketEnvelope } from "@mmbt/shared-types";
import { io, type Socket } from "socket.io-client";

import type {
  OverlayHealthUpdatePayload,
  OverlaySocketStatus,
  OverlayStateFullPayload
} from "../client/types";

export const OVERLAY_SOCKET_EVENTS = {
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

export const OVERLAY_ALLOWED_EMIT_EVENTS = [
  OVERLAY_SOCKET_EVENTS.CLIENT_HELLO,
  OVERLAY_SOCKET_EVENTS.STATE_REQUEST_FULL
] as const;

export interface OverlaySocketHandlers {
  onStatus(status: OverlaySocketStatus, message?: string): void;
  onStateFull(envelope: SocketEnvelope<OverlayStateFullPayload>): void;
  onHealthUpdate(envelope: SocketEnvelope<OverlayHealthUpdatePayload>): void;
  onSocketError(message: string): void;
}

export interface OverlaySocketLike {
  connected: boolean;
  io: {
    on(eventName: "reconnect_attempt", handler: () => void): void;
  };
  on(eventName: string, handler: (...args: unknown[]) => void): void;
  emit(eventName: string, payload?: unknown): void;
  removeAllListeners(): void;
  disconnect(): void;
}

export interface OverlaySocketOptions {
  url?: string;
  path?: string;
  route?: string;
  matchId?: string;
  userAgent?: string;
  socketFactory?: (url: string | undefined, options: { path: string }) => OverlaySocketLike;
}

export interface OverlaySocketConnection {
  requestFullState(): void;
  disconnect(): void;
}

export interface OverlayClientHelloPayload {
  role: "OVERLAY";
  panel: "overlay-shell";
  clientType: "overlay";
  route: string;
  matchId?: string;
  version: "0.1";
  capabilities: string[];
  userAgent?: string;
}

const REQUEST_FULL_ON_UPDATE_EVENTS = [
  OVERLAY_SOCKET_EVENTS.STATE_PATCH,
  OVERLAY_SOCKET_EVENTS.DRAFT_UPDATED,
  OVERLAY_SOCKET_EVENTS.DRAFT_TIMER,
  OVERLAY_SOCKET_EVENTS.PRODUCTION_STATE,
  OVERLAY_SOCKET_EVENTS.GRAPHICS_PREVIEW,
  OVERLAY_SOCKET_EVENTS.GRAPHICS_PROGRAM,
  OVERLAY_SOCKET_EVENTS.GRAPHICS_CLEAR
] as const;

function readRoute(options: OverlaySocketOptions): string {
  if (options.route) {
    return options.route;
  }

  return typeof window === "undefined" ? "/overlay/program" : window.location.pathname;
}

function readUserAgent(options: OverlaySocketOptions): string | undefined {
  if (options.userAgent) {
    return options.userAgent;
  }

  return typeof navigator === "undefined" ? undefined : navigator.userAgent;
}

export function createOverlayClientHelloPayload(
  options: OverlaySocketOptions = {}
): OverlayClientHelloPayload {
  const payload: OverlayClientHelloPayload = {
    role: "OVERLAY",
    panel: "overlay-shell",
    clientType: "overlay",
    route: readRoute(options),
    version: "0.1",
    capabilities: [
      "read-only",
      "state:full",
      "state:request-full",
      "draft:updated",
      "production:state",
      "health:update",
      "debug-safe"
    ]
  };
  const userAgent = readUserAgent(options);

  if (options.matchId) {
    payload.matchId = options.matchId;
  }

  if (userAgent) {
    payload.userAgent = userAgent;
  }

  return payload;
}

function readErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "payload" in payload &&
    typeof (payload as { payload?: { code?: unknown } }).payload?.code === "string"
  ) {
    return `Socket error: ${(payload as { payload: { code: string } }).payload.code}`;
  }

  return "Socket error received.";
}

function defaultSocketFactory(
  url: string | undefined,
  options: { path: string }
): OverlaySocketLike {
  return io(url, {
    path: options.path,
    reconnection: true,
    transports: ["websocket", "polling"]
  }) as Socket & OverlaySocketLike;
}

export function connectOverlaySocket(
  handlers: OverlaySocketHandlers,
  options: OverlaySocketOptions = {}
): OverlaySocketConnection {
  handlers.onStatus("connecting");

  const socket = (options.socketFactory ?? defaultSocketFactory)(options.url, {
    path: options.path ?? "/socket.io"
  });

  function requestFullState(): void {
    if (socket.connected) {
      socket.emit(OVERLAY_SOCKET_EVENTS.STATE_REQUEST_FULL);
    }
  }

  socket.on("connect", () => {
    handlers.onStatus("connected");
    socket.emit(
      OVERLAY_SOCKET_EVENTS.CLIENT_HELLO,
      createOverlayClientHelloPayload(options)
    );
  });

  socket.on("disconnect", (reason: unknown) => {
    handlers.onStatus("disconnected", typeof reason === "string" ? reason : undefined);
  });

  socket.io.on("reconnect_attempt", () => {
    handlers.onStatus("connecting");
  });

  socket.on("connect_error", (error: unknown) => {
    handlers.onStatus(
      "error",
      error instanceof Error ? error.message : "Unable to connect to realtime server."
    );
  });

  socket.on(OVERLAY_SOCKET_EVENTS.STATE_FULL, (envelope: unknown) => {
    handlers.onStateFull(envelope as SocketEnvelope<OverlayStateFullPayload>);
  });

  socket.on(OVERLAY_SOCKET_EVENTS.HEALTH_UPDATE, (envelope: unknown) => {
    handlers.onHealthUpdate(envelope as SocketEnvelope<OverlayHealthUpdatePayload>);
  });

  socket.on(OVERLAY_SOCKET_EVENTS.ERROR, (envelope: unknown) => {
    handlers.onSocketError(readErrorMessage(envelope));
  });

  REQUEST_FULL_ON_UPDATE_EVENTS.forEach((eventName) => {
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
