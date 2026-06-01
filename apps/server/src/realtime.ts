import type { Server as HttpServer } from "node:http";

import type { SocketEnvelope } from "@mmbt/shared-types";

export const SOCKET_EVENTS = {
  CLIENT_HELLO: "client:hello",
  CLIENT_HEARTBEAT: "client:heartbeat",
  STATE_FULL: "state:full",
  STATE_PATCH: "state:patch",
  STATE_REQUEST_FULL: "state:request-full",
  STATE_REQUEST_SNAPSHOT: "state:requestSnapshot",
  DRAFT_UPDATED: "draft:updated",
  DRAFT_TIMER: "draft:timer",
  PRODUCTION_STATE: "production:state",
  GRAPHICS_PREVIEW: "graphics:preview",
  GRAPHICS_PROGRAM: "graphics:program",
  GRAPHICS_CLEAR: "graphics:clear",
  HEALTH_UPDATE: "health:update",
  LOG_ENTRY: "log:entry",
  ERROR: "error"
} as const;

export const SOCKET_MUTATION_EVENTS = [
  "draft:start",
  "draft:pause",
  "draft:resume",
  "draft:hover",
  "draft:lock",
  "draft:undo",
  "draft:reset",
  "production:set-state",
  "graphics:preview",
  "graphics:take",
  "graphics:clear",
  "emergency:trigger",
  "emergency:clear"
] as const;

export interface StatePatchPayload {
  revision: number;
  previousRevision: number;
  timestamp: string;
  reason: string;
  changed: string[];
  entityId?: string;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}

export interface RealtimeBroadcaster {
  broadcast<TPayload>(eventName: string, envelope: SocketEnvelope<TPayload>): void;
  broadcastHealthUpdate(): void;
}

export interface RealtimeController extends RealtimeBroadcaster {
  attach(server: HttpServer): void;
  close(): Promise<void>;
}

export function createSocketEnvelope<TPayload>(
  type: string,
  payload: TPayload,
  timestamp = new Date().toISOString(),
  operatorId?: string
): SocketEnvelope<TPayload> {
  return {
    type,
    timestamp,
    operatorId,
    payload
  };
}

export function createNoopRealtimeBroadcaster(): RealtimeBroadcaster {
  return {
    broadcast() {
      // No-op fallback for unit tests or callers that intentionally skip Socket.IO.
    },
    broadcastHealthUpdate() {
      // No-op fallback for unit tests or callers that intentionally skip Socket.IO.
    }
  };
}
