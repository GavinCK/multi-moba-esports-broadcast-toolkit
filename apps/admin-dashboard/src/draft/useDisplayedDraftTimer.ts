import { useEffect, useMemo, useState } from "react";
import type { DraftTimerState } from "@mmbt/shared-types";

import { deriveDisplayedDraftTimer } from "./timerDisplay";

export function useDisplayedDraftTimer(timer: DraftTimerState | null | undefined): DraftTimerState {
  const [timerNowMs, setTimerNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!timer?.isRunning || !timer.phaseStartedAt) {
      return undefined;
    }

    setTimerNowMs(Date.now());

    const timerInterval = window.setInterval(() => {
      setTimerNowMs(Date.now());
    }, 250);

    return () => window.clearInterval(timerInterval);
  }, [timer?.isRunning, timer?.originalSeconds, timer?.phaseStartedAt, timer?.remainingSeconds]);

  return useMemo(
    () => deriveDisplayedDraftTimer(timer, timerNowMs),
    [timer?.isRunning, timer?.originalSeconds, timer?.pausedAt, timer?.phaseStartedAt, timer?.remainingSeconds, timerNowMs]
  );
}
