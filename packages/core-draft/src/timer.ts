import type { DraftPhaseDefinition, DraftStatus, DraftTimerState } from "@mmbt/shared-types";

import { fail, ok, type DraftEngineResult } from "./errors";

export interface CalculateTimerStateInput {
  timer: DraftTimerState;
  now: string;
}

function parseTimestamp(timestamp: string, field: string): DraftEngineResult<number> {
  const parsed = Date.parse(timestamp);

  if (!Number.isFinite(parsed)) {
    return fail({
      code: "draft-timer-invalid-timestamp",
      message: `${field} must be a valid timestamp.`,
      details: { field, timestamp }
    });
  }

  return ok(parsed);
}

function createStoppedTimer(originalSeconds = 0): DraftTimerState {
  return {
    isRunning: false,
    remainingSeconds: originalSeconds,
    originalSeconds
  };
}

export function createTimerForPhase(
  phase: DraftPhaseDefinition | null,
  now: string,
  status: DraftStatus
): DraftTimerState {
  if (!phase) {
    return createStoppedTimer(0);
  }

  const shouldRun = status === "LIVE" && phase.timeSeconds > 0;

  return {
    isRunning: shouldRun,
    phaseStartedAt: shouldRun ? now : undefined,
    pausedAt: status === "PAUSED" ? now : undefined,
    remainingSeconds: phase.timeSeconds,
    originalSeconds: phase.timeSeconds
  };
}

export function calculateTimerState(
  input: CalculateTimerStateInput
): DraftEngineResult<DraftTimerState> {
  const { timer, now } = input;

  if (!timer.isRunning || !timer.phaseStartedAt) {
    return ok({ ...timer });
  }

  const startedAt = parseTimestamp(timer.phaseStartedAt, "timer.phaseStartedAt");

  if (!startedAt.ok) {
    return fail(startedAt.error);
  }

  const nowTimestamp = parseTimestamp(now, "now");

  if (!nowTimestamp.ok) {
    return fail(nowTimestamp.error);
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowTimestamp.value - startedAt.value) / 1000));
  const remainingSeconds = Math.max(0, timer.remainingSeconds - elapsedSeconds);

  if (remainingSeconds === 0) {
    return ok({
      ...timer,
      isRunning: false,
      phaseStartedAt: undefined,
      remainingSeconds: 0
    });
  }

  return ok({
    ...timer,
    remainingSeconds
  });
}

export function pauseTimer(
  timer: DraftTimerState,
  now: string
): DraftEngineResult<DraftTimerState> {
  const calculated = calculateTimerState({ timer, now });

  if (!calculated.ok) {
    return fail(calculated.error);
  }

  return ok({
    ...calculated.value,
    isRunning: false,
    phaseStartedAt: undefined,
    pausedAt: now
  });
}

export function resumeTimer(
  timer: DraftTimerState,
  now: string
): DraftEngineResult<DraftTimerState> {
  const nowTimestamp = parseTimestamp(now, "now");

  if (!nowTimestamp.ok) {
    return fail(nowTimestamp.error);
  }

  const shouldRun = timer.remainingSeconds > 0;

  return ok({
    ...timer,
    isRunning: shouldRun,
    phaseStartedAt: shouldRun ? now : undefined,
    pausedAt: undefined
  });
}
