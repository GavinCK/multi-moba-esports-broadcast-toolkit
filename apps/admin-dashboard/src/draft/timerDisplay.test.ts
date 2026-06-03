import { describe, expect, it } from "vitest";

import { deriveDisplayedDraftTimer } from "./timerDisplay";

describe("dashboard draft timer display", () => {
  it("derives a visible countdown from authoritative running timer state", () => {
    const displayed = deriveDisplayedDraftTimer(
      {
        isRunning: true,
        phaseStartedAt: "2026-06-01T00:00:00.000Z",
        remainingSeconds: 30,
        originalSeconds: 30
      },
      Date.parse("2026-06-01T00:00:05.000Z")
    );

    expect(displayed).toMatchObject({
      isRunning: true,
      phaseStartedAt: "2026-06-01T00:00:00.000Z",
      remainingSeconds: 25,
      originalSeconds: 30
    });
  });

  it("freezes paused timers and never mutates the supplied timer", () => {
    const pausedTimer = {
      isRunning: false,
      pausedAt: "2026-06-01T00:00:10.000Z",
      remainingSeconds: 20,
      originalSeconds: 30
    };
    const displayed = deriveDisplayedDraftTimer(
      pausedTimer,
      Date.parse("2026-06-01T00:00:25.000Z")
    );

    expect(displayed).toEqual(pausedTimer);
    expect(displayed).not.toBe(pausedTimer);
  });

  it("shows zero at expiry without implying a state mutation", () => {
    const displayed = deriveDisplayedDraftTimer(
      {
        isRunning: true,
        phaseStartedAt: "2026-06-01T00:00:00.000Z",
        remainingSeconds: 30,
        originalSeconds: 30
      },
      Date.parse("2026-06-01T00:00:31.000Z")
    );

    expect(displayed).toEqual({
      isRunning: false,
      phaseStartedAt: undefined,
      remainingSeconds: 0,
      originalSeconds: 30
    });
  });
});
