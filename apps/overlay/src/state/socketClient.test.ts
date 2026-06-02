import { describe, expect, it, vi } from "vitest";

import {
  connectOverlaySocket,
  createOverlayClientHelloPayload,
  OVERLAY_ALLOWED_EMIT_EVENTS,
  OVERLAY_SOCKET_EVENTS,
  type OverlaySocketLike
} from "./socketClient";

type SocketHandler = (...args: unknown[]) => void;

const MUTATION_SOCKET_EVENTS = [
  "draft:start",
  "draft:pause",
  "draft:resume",
  "draft:hover",
  "draft:lock",
  "draft:undo",
  "draft:reset",
  "draft:complete",
  "production:set-state",
  "graphics:take",
  "emergency:trigger",
  "emergency:clear"
] as const;

function createFakeSocket() {
  const handlers = new Map<string, SocketHandler>();
  const ioHandlers = new Map<string, () => void>();
  const emitted: Array<{ eventName: string; payload?: unknown }> = [];

  const socket: OverlaySocketLike = {
    connected: true,
    io: {
      on(eventName, handler) {
        ioHandlers.set(eventName, handler);
      }
    },
    on(eventName, handler) {
      handlers.set(eventName, handler);
    },
    emit(eventName, payload) {
      emitted.push({ eventName, payload });
    },
    removeAllListeners() {
      handlers.clear();
    },
    disconnect() {
      socket.connected = false;
    }
  };

  return {
    socket,
    emitted,
    trigger(eventName: string, ...args: unknown[]) {
      handlers.get(eventName)?.(...args);
    },
    triggerReconnectAttempt() {
      ioHandlers.get("reconnect_attempt")?.();
    }
  };
}

describe("overlay socket client", () => {
  it("identifies as a read-only overlay shell client", () => {
    expect(
      createOverlayClientHelloPayload({
        route: "/overlay/draft/match_grand-final",
        matchId: "match_grand-final",
        userAgent: "test-agent"
      })
    ).toEqual({
      role: "OVERLAY",
      panel: "overlay-shell",
      clientType: "overlay",
      route: "/overlay/draft/match_grand-final",
      matchId: "match_grand-final",
      version: "0.1",
      capabilities: [
        "read-only",
        "state:full",
        "state:request-full",
        "draft:updated",
        "production:state",
        "health:update",
        "debug-safe"
      ],
      userAgent: "test-agent"
    });
  });

  it("emits only allowed read-only events", () => {
    const fake = createFakeSocket();
    const handlers = {
      onStatus: vi.fn(),
      onStateFull: vi.fn(),
      onHealthUpdate: vi.fn(),
      onSocketError: vi.fn()
    };
    const connection = connectOverlaySocket(handlers, {
      route: "/overlay/program",
      socketFactory: () => fake.socket
    });

    fake.trigger("connect");
    connection.requestFullState();
    fake.trigger(OVERLAY_SOCKET_EVENTS.STATE_PATCH, {});
    fake.trigger(OVERLAY_SOCKET_EVENTS.DRAFT_UPDATED, {});
    fake.trigger(OVERLAY_SOCKET_EVENTS.PRODUCTION_STATE, {});
    fake.trigger(OVERLAY_SOCKET_EVENTS.GRAPHICS_PREVIEW, {});
    fake.trigger(OVERLAY_SOCKET_EVENTS.GRAPHICS_PROGRAM, {});
    fake.trigger(OVERLAY_SOCKET_EVENTS.GRAPHICS_CLEAR, {});

    const emittedEventNames = fake.emitted.map((event) => event.eventName);

    expect(new Set(emittedEventNames)).toEqual(new Set(OVERLAY_ALLOWED_EMIT_EVENTS));
    MUTATION_SOCKET_EVENTS.forEach((eventName) => {
      expect(emittedEventNames).not.toContain(eventName);
    });
  });

  it("handles state, health, errors, and reconnect status without mutation emits", () => {
    const fake = createFakeSocket();
    const handlers = {
      onStatus: vi.fn(),
      onStateFull: vi.fn(),
      onHealthUpdate: vi.fn(),
      onSocketError: vi.fn()
    };

    connectOverlaySocket(handlers, {
      route: "/overlay/preview",
      socketFactory: () => fake.socket
    });

    fake.trigger("connect");
    fake.trigger(OVERLAY_SOCKET_EVENTS.STATE_FULL, { payload: { revision: 1 } });
    fake.trigger(OVERLAY_SOCKET_EVENTS.HEALTH_UPDATE, { payload: { revision: 1 } });
    fake.trigger(OVERLAY_SOCKET_EVENTS.ERROR, {
      payload: {
        code: "SOCKET_MUTATION_NOT_ALLOWED",
        message: "private detail"
      }
    });
    fake.triggerReconnectAttempt();

    expect(handlers.onStateFull).toHaveBeenCalledOnce();
    expect(handlers.onHealthUpdate).toHaveBeenCalledOnce();
    expect(handlers.onSocketError).toHaveBeenCalledWith(
      "Socket error: SOCKET_MUTATION_NOT_ALLOWED"
    );
    expect(handlers.onStatus).toHaveBeenCalledWith("connecting");
  });
});
