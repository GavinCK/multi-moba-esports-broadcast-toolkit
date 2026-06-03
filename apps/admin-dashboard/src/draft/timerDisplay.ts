import type { DraftTimerState } from "@mmbt/shared-types";

export function deriveDisplayedDraftTimer(
  timer: DraftTimerState | null | undefined,
  nowMs: number = Date.now()
): DraftTimerState {
  if (!timer) {
    return {
      isRunning: false,
      remainingSeconds: 0,
      originalSeconds: 0
    };
  }

  if (!timer.isRunning || !timer.phaseStartedAt) {
    return { ...timer };
  }

  const startedAtMs = Date.parse(timer.phaseStartedAt);

  if (!Number.isFinite(startedAtMs)) {
    return { ...timer };
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const remainingSeconds = Math.max(0, timer.remainingSeconds - elapsedSeconds);

  return {
    ...timer,
    isRunning: remainingSeconds > 0,
    phaseStartedAt: remainingSeconds > 0 ? timer.phaseStartedAt : undefined,
    remainingSeconds
  };
}
