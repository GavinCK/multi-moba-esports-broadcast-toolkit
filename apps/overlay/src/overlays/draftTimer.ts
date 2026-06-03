import { useEffect, useState } from "react";
import type { DraftTimerState } from "@mmbt/shared-types";

export type DraftTimerDisplayState = "running" | "paused" | "expired" | "complete" | "standby";

export interface DraftTimerDisplay {
  remainingSeconds: number;
  timerText: string;
  timerState: DraftTimerDisplayState;
}

const LOCAL_TIMER_TICK_MS = 250;

function getSafeWholeSeconds(value: number | null | undefined): number {
  const numericValue = Number(value);

  return Math.max(0, Math.floor(Number.isFinite(numericValue) ? numericValue : 0));
}

function parseTimerStartedAt(timer: DraftTimerState | null | undefined): number | null {
  if (!timer?.phaseStartedAt) {
    return null;
  }

  const parsed = Date.parse(timer.phaseStartedAt);

  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDraftTimer(seconds: number | null | undefined): string {
  const safeSeconds = getSafeWholeSeconds(seconds);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const remainder = (safeSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainder}`;
}

export function getDraftTimerDisplayRemainingSeconds(
  timer: DraftTimerState | null | undefined,
  nowMs = Date.now()
): number {
  const serverRemainingSeconds = getSafeWholeSeconds(timer?.remainingSeconds);

  if (!timer?.isRunning) {
    return serverRemainingSeconds;
  }

  const startedAtMs = parseTimerStartedAt(timer);

  if (startedAtMs === null) {
    return serverRemainingSeconds;
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));

  return Math.max(0, serverRemainingSeconds - elapsedSeconds);
}

export function getDraftTimerDisplay(
  draftStatus: string | null | undefined,
  timer: DraftTimerState | null | undefined,
  nowMs = Date.now()
): DraftTimerDisplay {
  const remainingSeconds = getDraftTimerDisplayRemainingSeconds(timer, nowMs);

  if (!timer) {
    return {
      remainingSeconds,
      timerText: "--:--",
      timerState: "standby"
    };
  }

  if (draftStatus === "COMPLETE") {
    return {
      remainingSeconds,
      timerText: formatDraftTimer(remainingSeconds),
      timerState: "complete"
    };
  }

  if (draftStatus === "PAUSED" || !timer.isRunning) {
    return {
      remainingSeconds,
      timerText: formatDraftTimer(remainingSeconds),
      timerState: "paused"
    };
  }

  if (remainingSeconds <= 0) {
    return {
      remainingSeconds: 0,
      timerText: formatDraftTimer(0),
      timerState: "expired"
    };
  }

  return {
    remainingSeconds,
    timerText: formatDraftTimer(remainingSeconds),
    timerState: "running"
  };
}

function isTimerSnapshotTickable(timer: DraftTimerState | null | undefined): boolean {
  return (
    timer?.isRunning === true &&
    getSafeWholeSeconds(timer.remainingSeconds) > 0 &&
    parseTimerStartedAt(timer) !== null
  );
}

export function useDraftTimerDisplay(
  draftStatus: string | null | undefined,
  timer: DraftTimerState | null | undefined
): DraftTimerDisplay {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setNowMs(Date.now());

    if (!isTimerSnapshotTickable(timer)) {
      return undefined;
    }

    let shouldContinue = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      const nextNowMs = Date.now();

      setNowMs(nextNowMs);

      if (getDraftTimerDisplayRemainingSeconds(timer, nextNowMs) <= 0) {
        shouldContinue = false;

        if (intervalId !== undefined) {
          clearInterval(intervalId);
          intervalId = undefined;
        }
      }
    };

    tick();

    if (shouldContinue) {
      intervalId = setInterval(tick, LOCAL_TIMER_TICK_MS);
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [
    draftStatus,
    timer?.isRunning,
    timer?.originalSeconds,
    timer?.phaseStartedAt,
    timer?.remainingSeconds
  ]);

  return getDraftTimerDisplay(draftStatus, timer, nowMs);
}
