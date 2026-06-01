import { afterEach, describe, expect, it, vi } from "vitest";
import { io } from "socket.io-client";

import { connectDashboardSocket } from "./socketClient";

type SocketHandler = (...args: unknown[]) => void;

const socketMock = vi.hoisted(() => {
  const handlers = new Map<string, SocketHandler>();
  const emit = vi.fn();
  const socket = {
    connected: true,
    emit,
    on: vi.fn((eventName: string, handler: SocketHandler) => {
      handlers.set(eventName, handler);
      return socket;
    }),
    io: {
      on: vi.fn()
    },
    removeAllListeners: vi.fn(),
    disconnect: vi.fn()
  };

  return { handlers, emit, socket };
});

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => socketMock.socket)
}));

describe("connectDashboardSocket", () => {
  afterEach(() => {
    socketMock.handlers.clear();
    socketMock.emit.mockClear();
    socketMock.socket.on.mockClear();
    socketMock.socket.io.on.mockClear();
    socketMock.socket.removeAllListeners.mockClear();
    socketMock.socket.disconnect.mockClear();
    vi.mocked(io).mockClear();
  });

  it("uses read-only draft operator socket events on the draft route", () => {
    const onStatus = vi.fn();
    const onStateFull = vi.fn();
    const onHealthUpdate = vi.fn();
    const onSocketError = vi.fn();

    connectDashboardSocket(
      {
        onStatus,
        onStateFull,
        onHealthUpdate,
        onSocketError
      },
      { route: "/draft/match_grand-final" }
    );

    socketMock.handlers.get("connect")?.();

    expect(io).toHaveBeenCalled();
    expect(socketMock.emit).toHaveBeenCalledWith("client:hello", {
      role: "DRAFT_OPERATOR",
      panel: "draft-operator",
      route: "/draft/match_grand-final",
      version: "0.1",
      capabilities: ["read-only", "state:full", "draft:updated", "health:update"]
    });

    socketMock.handlers.get("draft:updated")?.();

    const emittedEvents = socketMock.emit.mock.calls.map((call) => call[0]);

    expect(emittedEvents).toContain("state:request-full");
    expect(emittedEvents).not.toContain("draft:start");
    expect(emittedEvents).not.toContain("draft:hover");
    expect(emittedEvents).not.toContain("draft:lock");
    expect(emittedEvents).not.toContain("production:set-state");
    expect(emittedEvents).not.toContain("graphics:take");
    expect(emittedEvents).not.toContain("emergency:trigger");
  });

  it("uses read-only producer socket events on the producer route", () => {
    const onStatus = vi.fn();
    const onStateFull = vi.fn();
    const onHealthUpdate = vi.fn();
    const onSocketError = vi.fn();

    connectDashboardSocket(
      {
        onStatus,
        onStateFull,
        onHealthUpdate,
        onSocketError
      },
      { route: "/producer/match_grand-final" }
    );

    socketMock.handlers.get("connect")?.();

    expect(io).toHaveBeenCalled();
    expect(socketMock.emit).toHaveBeenCalledWith("client:hello", {
      role: "PRODUCER",
      panel: "producer-panel",
      route: "/producer/match_grand-final",
      version: "0.1",
      capabilities: ["read-only", "state:full", "production:state", "health:update"]
    });

    socketMock.handlers.get("production:state")?.();
    socketMock.handlers.get("graphics:preview")?.();

    const emittedEvents = socketMock.emit.mock.calls.map((call) => call[0]);

    expect(emittedEvents).toContain("state:request-full");
    expect(emittedEvents).not.toContain("production:set-state");
    expect(emittedEvents).not.toContain("graphics:take");
    expect(emittedEvents).not.toContain("graphics:clear");
    expect(emittedEvents).not.toContain("emergency:trigger");
    expect(emittedEvents).not.toContain("emergency:clear");
    expect(emittedEvents).not.toContain("draft:hover");
    expect(emittedEvents).not.toContain("draft:lock");
  });
});
