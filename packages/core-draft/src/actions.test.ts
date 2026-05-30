import type { DraftRuleset, DraftState } from "@mmbt/shared-types";
import { describe, expect, it } from "vitest";

import {
  calculateTimerState,
  createDraftState,
  hoverHero,
  lockHero,
  pauseDraft,
  redoLastUndoneAction,
  resumeDraft,
  startDraft,
  undoLastAction,
  validateDraftAction
} from "./index";
import type { DraftEngineResult } from "./index";

const startAt = "2026-05-30T12:00:00.000Z";
const plusOneSecond = "2026-05-30T12:00:01.000Z";
const plusTwoSeconds = "2026-05-30T12:00:02.000Z";
const plusThreeSeconds = "2026-05-30T12:00:03.000Z";

const actionRuleset: DraftRuleset = {
  id: "generic-action-test",
  gameCode: "generic-moba",
  name: "Generic Action Test",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: false,
  globalPickAcrossSeries: false,
  phases: [
    {
      id: "blue-ban-1",
      type: "BAN",
      team: "BLUE",
      count: 1,
      timeSeconds: 30,
      allowHover: true,
      autoAdvance: true
    },
    {
      id: "red-pick-1-2",
      type: "PICK",
      team: "RED",
      count: 2,
      timeSeconds: 60,
      allowHover: true,
      autoAdvance: true
    },
    {
      id: "red-ban-1",
      type: "BAN",
      team: "RED",
      count: 1,
      timeSeconds: 30,
      allowHover: true,
      autoAdvance: true
    }
  ]
};

const twoBanRuleset: DraftRuleset = {
  ...actionRuleset,
  id: "generic-two-ban-test",
  phases: [
    {
      id: "blue-ban-1",
      type: "BAN",
      team: "BLUE",
      count: 1,
      timeSeconds: 30,
      allowHover: true,
      autoAdvance: true
    },
    {
      id: "red-ban-1",
      type: "BAN",
      team: "RED",
      count: 1,
      timeSeconds: 30,
      allowHover: true,
      autoAdvance: true
    }
  ]
};

function unwrap<TValue>(result: DraftEngineResult<TValue>): TValue {
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function createLiveDraft(ruleset: DraftRuleset = actionRuleset): DraftState {
  const readyDraft = unwrap(
    createDraftState({
      gameId: "game-action-test",
      ruleset,
      now: startAt,
      operatorId: "operator-1"
    })
  );

  return unwrap(startDraft(readyDraft, ruleset, { now: startAt, operatorId: "operator-1" }));
}

describe("draft hover actions", () => {
  it("applies a valid hover without locking or advancing", () => {
    const liveDraft = createLiveDraft();
    const validation = validateDraftAction(liveDraft, actionRuleset, {
      operation: "hover",
      actionId: "blue-ban-1:slot-0",
      heroId: "hero-hover",
      expectedType: "BAN",
      expectedTeam: "BLUE"
    });
    const hoveredDraft = unwrap(
      hoverHero(liveDraft, actionRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-hover",
        now: plusOneSecond,
        operatorId: "operator-1"
      })
    );

    expect(validation).toEqual({ valid: true });
    expect(hoveredDraft.actions[0]).toMatchObject({
      status: "HOVER",
      heroId: "hero-hover",
      hoveredAt: plusOneSecond
    });
    expect(hoveredDraft.lockedHeroIds).toEqual([]);
    expect(hoveredDraft.bannedHeroIds).toEqual([]);
    expect(hoveredDraft.pickedHeroIds).toEqual([]);
    expect(hoveredDraft.currentPhaseIndex).toBe(0);
    expect(hoveredDraft.history.at(-1)?.action).toBe("HERO_HOVERED");
  });

  it("rejects an invalid hover on a non-current slot without mutating state", () => {
    const liveDraft = createLiveDraft();
    const before = JSON.stringify(liveDraft);
    const validation = validateDraftAction(liveDraft, actionRuleset, {
      operation: "hover",
      actionId: "red-pick-1-2:slot-0",
      heroId: "hero-hover"
    });
    const result = hoverHero(liveDraft, actionRuleset, {
      actionId: "red-pick-1-2:slot-0",
      heroId: "hero-hover",
      now: plusOneSecond
    });

    expect(validation.valid).toBe(false);
    expect(validation.issues?.[0]?.code).toBe("draft-action-not-current-phase");
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("draft-action-not-current-phase");
    expect(JSON.stringify(liveDraft)).toBe(before);
  });
});

describe("draft lock actions and duplicate blocking", () => {
  it("locks a valid ban and advances to the next phase", () => {
    const liveDraft = createLiveDraft();
    const lockedDraft = unwrap(
      lockHero(liveDraft, actionRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-ban-1",
        now: plusOneSecond,
        operatorId: "operator-1"
      })
    );

    expect(lockedDraft.actions[0]).toMatchObject({
      status: "LOCKED",
      heroId: "hero-ban-1",
      lockedAt: plusOneSecond
    });
    expect(lockedDraft.lockedHeroIds).toEqual(["hero-ban-1"]);
    expect(lockedDraft.bannedHeroIds).toEqual(["hero-ban-1"]);
    expect(lockedDraft.pickedHeroIds).toEqual([]);
    expect(lockedDraft.currentPhaseIndex).toBe(1);
    expect(lockedDraft.timer).toEqual({
      isRunning: true,
      phaseStartedAt: plusOneSecond,
      remainingSeconds: 60,
      originalSeconds: 60
    });
  });

  it("locks a valid pick without advancing a count greater than one phase early", () => {
    const afterBan = unwrap(
      lockHero(createLiveDraft(), actionRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-ban-1",
        now: plusOneSecond
      })
    );
    const afterPick = unwrap(
      lockHero(afterBan, actionRuleset, {
        actionId: "red-pick-1-2:slot-0",
        heroId: "hero-pick-1",
        now: plusTwoSeconds,
        operatorId: "operator-1"
      })
    );

    expect(afterPick.actions[1]).toMatchObject({
      status: "LOCKED",
      heroId: "hero-pick-1",
      lockedAt: plusTwoSeconds
    });
    expect(afterPick.pickedHeroIds).toEqual(["hero-pick-1"]);
    expect(afterPick.lockedHeroIds).toEqual(["hero-ban-1", "hero-pick-1"]);
    expect(afterPick.currentPhaseIndex).toBe(1);
  });

  it("rejects a lock on the wrong slot without mutating state", () => {
    const liveDraft = createLiveDraft();
    const before = JSON.stringify(liveDraft);
    const result = lockHero(liveDraft, actionRuleset, {
      actionId: "red-pick-1-2:slot-0",
      heroId: "hero-pick-1",
      now: plusOneSecond
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("draft-action-not-current-phase");
    expect(JSON.stringify(liveDraft)).toBe(before);
  });

  it("blocks duplicate locked picks when duplicates are disabled", () => {
    const afterBan = unwrap(
      lockHero(createLiveDraft(), actionRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-ban-1",
        now: plusOneSecond
      })
    );
    const afterFirstPick = unwrap(
      lockHero(afterBan, actionRuleset, {
        actionId: "red-pick-1-2:slot-0",
        heroId: "hero-pick-duplicate",
        now: plusTwoSeconds
      })
    );
    const before = JSON.stringify(afterFirstPick);
    const result = lockHero(afterFirstPick, actionRuleset, {
      actionId: "red-pick-1-2:slot-1",
      heroId: "hero-pick-duplicate",
      now: plusThreeSeconds
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("draft-duplicate-hero");
    expect(JSON.stringify(afterFirstPick)).toBe(before);
  });

  it("blocks duplicate locked bans when duplicates are disabled", () => {
    const afterFirstBan = unwrap(
      lockHero(createLiveDraft(twoBanRuleset), twoBanRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-ban-duplicate",
        now: plusOneSecond
      })
    );
    const result = lockHero(afterFirstBan, twoBanRuleset, {
      actionId: "red-ban-1:slot-0",
      heroId: "hero-ban-duplicate",
      now: plusTwoSeconds
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("draft-duplicate-hero");
  });

  it("allows duplicates when the ruleset permits them", () => {
    const duplicateAllowedRuleset: DraftRuleset = {
      ...actionRuleset,
      id: "generic-duplicate-allowed-test",
      allowDuplicateHeroes: true
    };
    const afterBan = unwrap(
      lockHero(createLiveDraft(duplicateAllowedRuleset), duplicateAllowedRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-ban-1",
        now: plusOneSecond
      })
    );
    const afterFirstPick = unwrap(
      lockHero(afterBan, duplicateAllowedRuleset, {
        actionId: "red-pick-1-2:slot-0",
        heroId: "hero-repeat",
        now: plusTwoSeconds
      })
    );
    const afterSecondPick = unwrap(
      lockHero(afterFirstPick, duplicateAllowedRuleset, {
        actionId: "red-pick-1-2:slot-1",
        heroId: "hero-repeat",
        now: plusThreeSeconds
      })
    );

    expect(afterSecondPick.pickedHeroIds).toEqual(["hero-repeat", "hero-repeat"]);
    expect(afterSecondPick.lockedHeroIds).toEqual(["hero-ban-1", "hero-repeat", "hero-repeat"]);
    expect(afterSecondPick.currentPhaseIndex).toBe(2);
  });
});

describe("draft timer helpers", () => {
  it("calculates timeout state without locking, banning, picking, or advancing", () => {
    const liveDraft = createLiveDraft();
    const timer = unwrap(
      calculateTimerState({
        timer: liveDraft.timer,
        now: "2026-05-30T12:00:31.000Z"
      })
    );

    expect(timer).toEqual({
      isRunning: false,
      phaseStartedAt: undefined,
      remainingSeconds: 0,
      originalSeconds: 30
    });
    expect(liveDraft.actions.every((action) => action.status === "PENDING")).toBe(true);
    expect(liveDraft.lockedHeroIds).toEqual([]);
    expect(liveDraft.currentPhaseIndex).toBe(0);
  });

  it("pauses and resumes using explicit timestamps", () => {
    const liveDraft = createLiveDraft();
    const pausedDraft = unwrap(
      pauseDraft(liveDraft, {
        now: "2026-05-30T12:00:10.000Z"
      })
    );
    const resumedDraft = unwrap(
      resumeDraft(pausedDraft, {
        now: "2026-05-30T12:00:20.000Z"
      })
    );

    expect(pausedDraft.timer).toMatchObject({
      isRunning: false,
      pausedAt: "2026-05-30T12:00:10.000Z",
      remainingSeconds: 20
    });
    expect(resumedDraft.timer).toEqual({
      isRunning: true,
      phaseStartedAt: "2026-05-30T12:00:20.000Z",
      pausedAt: undefined,
      remainingSeconds: 20,
      originalSeconds: 30
    });
  });
});

describe("draft undo and redo helpers", () => {
  it("undoes and redoes the last locked action immutably", () => {
    const lockedDraft = unwrap(
      lockHero(createLiveDraft(), actionRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-ban-1",
        now: plusOneSecond,
        operatorId: "operator-1"
      })
    );
    const undoneDraft = unwrap(
      undoLastAction(lockedDraft, actionRuleset, {
        now: plusTwoSeconds,
        operatorId: "operator-1"
      })
    );
    const redoneDraft = unwrap(
      redoLastUndoneAction(undoneDraft, actionRuleset, {
        now: plusThreeSeconds,
        operatorId: "operator-1"
      })
    );

    expect(lockedDraft.actions[0]?.status).toBe("LOCKED");
    expect(undoneDraft.actions[0]).toMatchObject({
      status: "PENDING",
      heroId: null,
      lockedAt: undefined
    });
    expect(undoneDraft.lockedHeroIds).toEqual([]);
    expect(undoneDraft.bannedHeroIds).toEqual([]);
    expect(undoneDraft.currentPhaseIndex).toBe(0);
    expect(undoneDraft.history.at(-1)?.action).toBe("ACTION_UNDONE");

    expect(redoneDraft.actions[0]).toMatchObject({
      status: "LOCKED",
      heroId: "hero-ban-1",
      lockedAt: plusThreeSeconds
    });
    expect(redoneDraft.lockedHeroIds).toEqual(["hero-ban-1"]);
    expect(redoneDraft.bannedHeroIds).toEqual(["hero-ban-1"]);
    expect(redoneDraft.currentPhaseIndex).toBe(1);
    expect(redoneDraft.history.some((entry) => entry.action === "ACTION_REDONE")).toBe(true);
  });

  it("rejects undo and redo boundary cases", () => {
    const liveDraft = createLiveDraft();
    const undoResult = undoLastAction(liveDraft, actionRuleset, {
      now: plusOneSecond
    });
    const redoResult = redoLastUndoneAction(liveDraft, actionRuleset, {
      now: plusOneSecond
    });

    expect(undoResult.ok).toBe(false);
    expect(undoResult.error.code).toBe("draft-no-reversible-action");
    expect(redoResult.ok).toBe(false);
    expect(redoResult.error.code).toBe("draft-no-redo-action");
  });
});
