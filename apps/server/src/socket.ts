import type { Server as HttpServer } from "node:http";

import { Server as SocketIoServer, type Socket } from "socket.io";

import {
  createSocketEnvelope,
  SOCKET_EVENTS,
  SOCKET_MUTATION_EVENTS,
  type RealtimeController,
  type SocketErrorPayload
} from "./realtime.js";
import {
  createHealthResponse,
  createStateSnapshot,
  type RuntimeSocketClientInfo,
  type ServerRuntimeState
} from "./runtime-state.js";
import { flushRuntimeStateSnapshot } from "./state-snapshot.js";

const UNSAFE_CLIENT_METADATA_PATTERN = new RegExp(
  ["api[_-]?key", `sec${"ret"}`, "token", "password"].join("|"),
  "i"
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNow(): string {
  return new Date().toISOString();
}

function readSafeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/[\r\n\t]/g, " ").trim().slice(0, maxLength);

  if (normalized.length === 0) {
    return undefined;
  }

  return UNSAFE_CLIENT_METADATA_PATTERN.test(normalized) ? "redacted" : normalized;
}

function getClientInfo(
  runtimeState: ServerRuntimeState,
  socketId: string
): RuntimeSocketClientInfo | undefined {
  return runtimeState.socketClients.find((client) => client.id === socketId);
}

function isReadOnlyClient(client: Pick<RuntimeSocketClientInfo, "clientType" | "panel" | "role">): boolean {
  const role = client.role?.toUpperCase();
  const panel = client.panel?.toLowerCase();
  const clientType = client.clientType?.toLowerCase();

  return role === "OVERLAY" || panel === "overlay" || panel?.startsWith("overlay-") === true || clientType === "overlay";
}

function upsertClientInfo(
  runtimeState: ServerRuntimeState,
  socketId: string,
  patch: Partial<RuntimeSocketClientInfo>
): RuntimeSocketClientInfo {
  const existing = getClientInfo(runtimeState, socketId);

  if (existing) {
    Object.assign(existing, patch, {
      lastSeenAt: patch.lastSeenAt ?? getNow()
    });
    existing.readOnly = isReadOnlyClient(existing);

    return existing;
  }

  const connectedAt = patch.connectedAt ?? getNow();
  const nextClient: RuntimeSocketClientInfo = {
    id: socketId,
    connectedAt,
    lastSeenAt: patch.lastSeenAt ?? connectedAt,
    readOnly: false,
    ...patch
  };
  nextClient.readOnly = isReadOnlyClient(nextClient);
  runtimeState.socketClients.push(nextClient);

  return nextClient;
}

function removeClientInfo(runtimeState: ServerRuntimeState, socketId: string): void {
  runtimeState.socketClients = runtimeState.socketClients.filter((client) => client.id !== socketId);
}

function emitStateFull(socket: Socket, runtimeState: ServerRuntimeState): void {
  socket.emit(
    SOCKET_EVENTS.STATE_FULL,
    createSocketEnvelope(SOCKET_EVENTS.STATE_FULL, createStateSnapshot(runtimeState))
  );
}

function emitSocketError(
  socket: Socket,
  type: string,
  payload: SocketErrorPayload
): void {
  socket.emit(SOCKET_EVENTS.ERROR, createSocketEnvelope(type, payload));
}

function getCorrelationId(payload: unknown): string | undefined {
  return isRecord(payload) ? readSafeString(payload.correlationId, 120) : undefined;
}

function handleClientHello(
  socket: Socket,
  runtimeState: ServerRuntimeState,
  payload: unknown,
  broadcastHealthUpdate: () => void
): void {
  if (!isRecord(payload)) {
    emitSocketError(socket, "error:socket-invalid-payload", {
      code: "SOCKET_INVALID_PAYLOAD",
      message: "client:hello payload must be a JSON object.",
      correlationId: getCorrelationId(payload)
    });
    emitStateFull(socket, runtimeState);
    return;
  }

  upsertClientInfo(runtimeState, socket.id, {
    role: readSafeString(payload.role, 40),
    panel: readSafeString(payload.panel, 80),
    clientType: readSafeString(payload.clientType, 40),
    route: readSafeString(payload.route, 200),
    matchId: readSafeString(payload.matchId, 120),
    userAgent: readSafeString(payload.userAgent, 200),
    lastSeenAt: getNow()
  });

  emitStateFull(socket, runtimeState);
  broadcastHealthUpdate();
}

function rejectSocketMutation(
  socket: Socket,
  runtimeState: ServerRuntimeState,
  eventName: string,
  payload: unknown
): void {
  const client = getClientInfo(runtimeState, socket.id);

  emitSocketError(socket, "error:socket-mutation-not-allowed", {
    code: "SOCKET_MUTATION_NOT_ALLOWED",
    message: "Socket-side mutations are not enabled for this server-only realtime sync task. Use REST mutation endpoints.",
    details: {
      event: eventName,
      role: client?.role,
      panel: client?.panel,
      clientType: client?.clientType,
      readOnly: client?.readOnly ?? false
    },
    correlationId: getCorrelationId(payload)
  });
}

export function createSocketRealtimeController(
  runtimeState: ServerRuntimeState
): RealtimeController {
  let io: SocketIoServer | null = null;

  const controller: RealtimeController = {
    attach(server: HttpServer) {
      if (io) {
        return;
      }

      io = new SocketIoServer(server, {
        serveClient: false
      });

      io.on("connection", (socket) => {
        upsertClientInfo(runtimeState, socket.id, {
          connectedAt: getNow(),
          lastSeenAt: getNow()
        });

        emitStateFull(socket, runtimeState);
        controller.broadcastHealthUpdate();

        socket.on(SOCKET_EVENTS.CLIENT_HELLO, (payload: unknown) => {
          handleClientHello(socket, runtimeState, payload, () => controller.broadcastHealthUpdate());
        });

        socket.on(SOCKET_EVENTS.STATE_REQUEST_FULL, () => {
          upsertClientInfo(runtimeState, socket.id, { lastSeenAt: getNow() });
          emitStateFull(socket, runtimeState);
        });

        socket.on(SOCKET_EVENTS.STATE_REQUEST_SNAPSHOT, () => {
          upsertClientInfo(runtimeState, socket.id, { lastSeenAt: getNow() });
          emitStateFull(socket, runtimeState);
        });

        socket.on(SOCKET_EVENTS.CLIENT_HEARTBEAT, () => {
          upsertClientInfo(runtimeState, socket.id, { lastSeenAt: getNow() });
        });

        SOCKET_MUTATION_EVENTS.forEach((eventName) => {
          socket.on(eventName, (payload: unknown) => {
            upsertClientInfo(runtimeState, socket.id, { lastSeenAt: getNow() });
            rejectSocketMutation(socket, runtimeState, eventName, payload);
          });
        });

        socket.on("disconnect", () => {
          removeClientInfo(runtimeState, socket.id);
          controller.broadcastHealthUpdate();
        });
      });
    },

    broadcast(eventName, envelope) {
      io?.emit(eventName, envelope);
    },

    broadcastHealthUpdate() {
      io?.emit(
        SOCKET_EVENTS.HEALTH_UPDATE,
        createSocketEnvelope(SOCKET_EVENTS.HEALTH_UPDATE, {
          revision: runtimeState.revision,
          health: createHealthResponse(runtimeState)
        })
      );
    },

    async close() {
      flushRuntimeStateSnapshot(runtimeState);

      if (!io) {
        return;
      }

      const activeIo = io;
      io = null;

      activeIo.disconnectSockets(true);
      activeIo.removeAllListeners();
      runtimeState.socketClients = [];
    }
  };

  return controller;
}
