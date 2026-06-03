import { describe, expect, it } from "vitest";
import type { DraftTimerState } from "@mmbt/shared-types";

import {
  formatDraftTimer,
  getDraftTimerDisplay,
  getDraftTimerDisplayRemainingSeconds
} from "./draftTimer";

const phaseStartedAt = "2026-06-03T12:00:00.000Z";
const phaseStartedAtMs = Date.parse(phaseStartedAt);

function createTimer(overrides: Partial<DraftTimerState> = {}): DraftTimerState {
  return {
    isRunning: true,
    phaseStartedAt,
    remainingSeconds: 30,
    originalSeconds: 30,
    ...overrides
  };
}

describe("draft overlay timer display", () => {
  it("formats server remainingSeconds when the timer is not running", () => {
    const display = getDraftTimerDisplay(
      "PAUSED",
      createTimer({
        isRunning: false,
        phaseStartedAt: undefined,
        remainingSeconds: 17
      }),
      phaseStartedAtMs + 10_000
    );

    expect(display).toEqual({
      remainingSeconds: 17,
      timerText: "00:17",
      timerState: "paused"
    });
  });

  it("ticks down locally when running and phaseStartedAt is available", () => {
    const display = getDraftTimerDisplay("LIVE", createTimer({ remainingSeconds: 24 }), phaseStartedAtMs + 5_000);

    expect(display.remainingSeconds).toBe(19);
    expect(display.timerText).toBe("00:19");
    expect(display.timerState).toBe("running");
  });

  it("does not display negative time after expiry", () => {
    const display = getDraftTimerDisplay("LIVE", createTimer({ remainingSeconds: 3 }), phaseStartedAtMs + 10_000);

    expect(display.remainingSeconds).toBe(0);
    expect(display.timerText).toBe("00:00");
    expect(display.timerState).toBe("expired");
  });

  it("does not tick down while paused", () => {
    const display = getDraftTimerDisplay(
      "PAUSED",
      createTimer({
        isRunning: false,
        phaseStartedAt: undefined,
        remainingSeconds: 12
      }),
      phaseStartedAtMs + 30_000
    );

    expect(display.remainingSeconds).toBe(12);
    expect(display.timerText).toBe("00:12");
    expect(display.timerState).toBe("paused");
  });

  it("resets display from a new phase timer snapshot", () => {
    const expiredPhaseTimer = createTimer({ remainingSeconds: 2 });
    const nextPhaseStartedAt = "2026-06-03T12:00:10.000Z";
    const nextPhaseTimer = createTimer({
      phaseStartedAt: nextPhaseStartedAt,
      remainingSeconds: 60,
      originalSeconds: 60
    });

    expect(getDraftTimerDisplayRemainingSeconds(expiredPhaseTimer, phaseStartedAtMs + 5_000)).toBe(0);
    expect(getDraftTimerDisplay("LIVE", nextPhaseTimer, Date.parse(nextPhaseStartedAt)).timerText).toBe("01:00");
  });

  it("falls back to server remainingSeconds when phaseStartedAt is missing or invalid", () => {
    expect(
      getDraftTimerDisplayRemainingSeconds(
        createTimer({
          phaseStartedAt: undefined,
          remainingSeconds: 22
        }),
        phaseStartedAtMs + 5_000
      )
    ).toBe(22);

    expect(
      getDraftTimerDisplayRemainingSeconds(
        createTimer({
          phaseStartedAt: "not-a-timestamp",
          remainingSeconds: 21
        }),
        phaseStartedAtMs + 5_000
      )
    ).toBe(21);
  });

  it("formats invalid or fractional seconds safely", () => {
    expect(formatDraftTimer(undefined)).toBe("00:00");
    expect(formatDraftTimer(-1)).toBe("00:00");
    expect(formatDraftTimer(61.9)).toBe("01:01");
  });
});
