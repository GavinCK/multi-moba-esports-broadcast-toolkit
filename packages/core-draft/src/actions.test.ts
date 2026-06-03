import type { DraftRuleset, DraftState } from "@mmbt/shared-types";
import { describe, expect, it } from "vitest";

import {
  calculateTimerState,
  completeDraft,
  confirmFinalLineup,
  createDraftState,
  formatDraftActionSlotLabel,
  getFinalLineupActionIdsForSide,
  hoverHero,
  lockHero,
  pauseDraft,
  redoLastUndoneAction,
  reorderFinalLineup,
  resetFinalLineupSide,
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

const countTwoThirtySecondRuleset: DraftRuleset = {
  ...actionRuleset,
  id: "generic-count-two-thirty-second-test",
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
      timeSeconds: 30,
      allowHover: true,
      autoAdvance: true
    }
  ]
};

const lineupRuleset: DraftRuleset = {
  id: "generic-lineup-test",
  gameCode: "generic-moba",
  name: "Generic Lineup Test",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: false,
  globalPickAcrossSeries: false,
  phases: [
    ...Array.from({ length: 5 }, (_, index) => ({
      id: `blue-pick-${index + 1}`,
      type: "PICK" as const,
      team: "BLUE" as const,
      count: 1,
      timeSeconds: 30,
      allowHover: true,
      autoAdvance: true
    })),
    ...Array.from({ length: 5 }, (_, index) => ({
      id: `red-pick-${index + 1}`,
      type: "PICK" as const,
      team: "RED" as const,
      count: 1,
      timeSeconds: 30,
      allowHover: true,
      autoAdvance: true
    }))
  ]
};

const labelRuleset: DraftRuleset = {
  id: "generic-label-test",
  gameCode: "generic-moba",
  name: "Generic Label Test",
  allowDuplicateHeroes: false,
  globalBanAcrossSeries: false,
  globalPickAcrossSeries: false,
  phases: [
    { id: "ban-blue-1", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30 },
    { id: "ban-red-1", type: "BAN", team: "RED", count: 1, timeSeconds: 30 },
    { id: "ban-blue-2", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30 },
    { id: "ban-red-2", type: "BAN", team: "RED", count: 1, timeSeconds: 30 },
    { id: "ban-blue-3", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30 },
    { id: "ban-red-3", type: "BAN", team: "RED", count: 1, timeSeconds: 30 },
    { id: "pick-blue-1", type: "PICK", team: "BLUE", count: 1, timeSeconds: 30 },
    { id: "pick-red-1-2", type: "PICK", team: "RED", count: 2, timeSeconds: 60 },
    { id: "pick-blue-2-3", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60 },
    { id: "pick-red-3", type: "PICK", team: "RED", count: 1, timeSeconds: 30 },
    { id: "ban-red-4", type: "BAN", team: "RED", count: 1, timeSeconds: 30 },
    { id: "ban-blue-4", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30 },
    { id: "ban-red-5", type: "BAN", team: "RED", count: 1, timeSeconds: 30 },
    { id: "ban-blue-5", type: "BAN", team: "BLUE", count: 1, timeSeconds: 30 },
    { id: "pick-red-4", type: "PICK", team: "RED", count: 1, timeSeconds: 30 },
    { id: "pick-blue-4-5", type: "PICK", team: "BLUE", count: 2, timeSeconds: 60 },
    { id: "pick-red-5", type: "PICK", team: "RED", count: 1, timeSeconds: 30 }
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

function createLineupDraft(): DraftState {
  return lineupRuleset.phases.reduce((draft, phase, index) => {
    const actionId = `${phase.id}:slot-0`;

    return unwrap(
      lockHero(draft, lineupRuleset, {
        actionId,
        heroId: `hero-lineup-${index + 1}`,
        now: `2026-05-30T12:00:${String(index + 1).padStart(2, "0")}.000Z`,
        operatorId: "operator-1"
      })
    );
  }, createLiveDraft(lineupRuleset));
}

describe("draft action label helpers", () => {
  it("derives side/action ordinals across the whole draft instead of repeating phase-local slot numbers", () => {
    const draft = unwrap(
      createDraftState({
        gameId: "game-label-test",
        ruleset: labelRuleset,
        now: startAt
      })
    );
    const labels = draft.actions.map((action) =>
      formatDraftActionSlotLabel(action, draft.actions, { casing: "upper" })
    );

    expect(labels).toEqual([
      "BLUE BAN 1",
      "RED BAN 1",
      "BLUE BAN 2",
      "RED BAN 2",
      "BLUE BAN 3",
      "RED BAN 3",
      "BLUE PICK 1",
      "RED PICK 1",
      "RED PICK 2",
      "BLUE PICK 2",
      "BLUE PICK 3",
      "RED PICK 3",
      "RED BAN 4",
      "BLUE BAN 4",
      "RED BAN 5",
      "BLUE BAN 5",
      "RED PICK 4",
      "BLUE PICK 4",
      "BLUE PICK 5",
      "RED PICK 5"
    ]);
    expect(labels.filter((label) => label === "BLUE BAN 1")).toHaveLength(1);
    expect(labels.filter((label) => label === "RED PICK 1")).toHaveLength(1);
    expect(labels).toContain("BLUE BAN 5");
    expect(labels).toContain("RED BAN 5");
    expect(labels).toContain("BLUE PICK 5");
    expect(labels).toContain("RED PICK 5");
  });
});

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

  it("uses the declared phase timer for count greater than one instead of multiplying by slot count", () => {
    const lockedDraft = unwrap(
      lockHero(createLiveDraft(countTwoThirtySecondRuleset), countTwoThirtySecondRuleset, {
        actionId: "blue-ban-1:slot-0",
        heroId: "hero-ban-1",
        now: plusOneSecond,
        operatorId: "operator-1"
      })
    );

    expect(lockedDraft.currentPhaseIndex).toBe(1);
    expect(lockedDraft.timer).toEqual({
      isRunning: true,
      phaseStartedAt: plusOneSecond,
      remainingSeconds: 30,
      originalSeconds: 30
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
  it("rebases a running timer snapshot to the calculation timestamp", () => {
    const liveDraft = createLiveDraft();
    const timer = unwrap(
      calculateTimerState({
        timer: liveDraft.timer,
        now: "2026-05-30T12:00:05.000Z"
      })
    );

    expect(timer).toEqual({
      isRunning: true,
      phaseStartedAt: "2026-05-30T12:00:05.000Z",
      remainingSeconds: 25,
      originalSeconds: 30
    });
  });

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

describe("final lineup helpers", () => {
  it("starts a 60-second final lineup phase with default order matching locked pick order", () => {
    const lineupDraft = createLineupDraft();

    expect(lineupDraft.finalLineup).toMatchObject({
      status: "ACTIVE",
      finalLineupBySide: {
        BLUE: [
          "blue-pick-1:slot-0",
          "blue-pick-2:slot-0",
          "blue-pick-3:slot-0",
          "blue-pick-4:slot-0",
          "blue-pick-5:slot-0"
        ],
        RED: [
          "red-pick-1:slot-0",
          "red-pick-2:slot-0",
          "red-pick-3:slot-0",
          "red-pick-4:slot-0",
          "red-pick-5:slot-0"
        ]
      },
      lineupPhaseStartedAt: "2026-05-30T12:00:10.000Z"
    });
    expect(lineupDraft.timer).toEqual({
      isRunning: true,
      phaseStartedAt: "2026-05-30T12:00:10.000Z",
      remainingSeconds: 60,
      originalSeconds: 60
    });
    expect(lineupDraft.history.some((entry) => entry.action === "FINAL_LINEUP_STARTED")).toBe(true);
  });

  it("supports same-side lineup swaps through reordered action IDs without changing picks or bans", () => {
    const lineupDraft = createLineupDraft();
    const originalBlueOrder = getFinalLineupActionIdsForSide(lineupDraft, "BLUE");
    const originalRedOrder = getFinalLineupActionIdsForSide(lineupDraft, "RED");
    const reorderedBlue = unwrap(
      reorderFinalLineup(lineupDraft, {
        side: "BLUE",
        actionIds: [
          "blue-pick-2:slot-0",
          "blue-pick-1:slot-0",
          "blue-pick-3:slot-0",
          "blue-pick-4:slot-0",
          "blue-pick-5:slot-0"
        ],
        now: "2026-05-30T12:00:20.000Z",
        operatorId: "operator-1"
      })
    );
    const reorderedRed = unwrap(
      reorderFinalLineup(reorderedBlue, {
        side: "RED",
        actionIds: [
          "red-pick-1:slot-0",
          "red-pick-3:slot-0",
          "red-pick-2:slot-0",
          "red-pick-4:slot-0",
          "red-pick-5:slot-0"
        ],
        now: "2026-05-30T12:00:25.000Z",
        operatorId: "operator-1"
      })
    );

    expect(getFinalLineupActionIdsForSide(reorderedRed, "BLUE")).toEqual([
      "blue-pick-2:slot-0",
      "blue-pick-1:slot-0",
      "blue-pick-3:slot-0",
      "blue-pick-4:slot-0",
      "blue-pick-5:slot-0"
    ]);
    expect(getFinalLineupActionIdsForSide(reorderedRed, "RED")).toEqual([
      "red-pick-1:slot-0",
      "red-pick-3:slot-0",
      "red-pick-2:slot-0",
      "red-pick-4:slot-0",
      "red-pick-5:slot-0"
    ]);
    expect(reorderedRed.pickedHeroIds).toEqual(lineupDraft.pickedHeroIds);
    expect(reorderedRed.bannedHeroIds).toEqual([]);
    expect(new Set(getFinalLineupActionIdsForSide(reorderedRed, "BLUE"))).toEqual(new Set(originalBlueOrder));
    expect(new Set(getFinalLineupActionIdsForSide(reorderedRed, "RED"))).toEqual(new Set(originalRedOrder));
    expect(reorderedRed.history.at(-1)?.action).toBe("FINAL_LINEUP_REORDERED");
  });

  it("rejects cross-team, duplicate, missing, and early final lineup reorder attempts without mutation", () => {
    const lineupDraft = createLineupDraft();
    const before = JSON.stringify(lineupDraft);
    const crossTeam = reorderFinalLineup(lineupDraft, {
      side: "BLUE",
      actionIds: [
        "blue-pick-1:slot-0",
        "blue-pick-2:slot-0",
        "blue-pick-3:slot-0",
        "blue-pick-4:slot-0",
        "red-pick-1:slot-0"
      ]
    });
    const duplicate = reorderFinalLineup(lineupDraft, {
      side: "RED",
      actionIds: [
        "red-pick-1:slot-0",
        "red-pick-1:slot-0",
        "red-pick-2:slot-0",
        "red-pick-3:slot-0",
        "red-pick-4:slot-0"
      ]
    });
    const missing = reorderFinalLineup(lineupDraft, {
      side: "BLUE",
      actionIds: ["blue-pick-1:slot-0"]
    });
    const early = reorderFinalLineup(createLiveDraft(lineupRuleset), {
      side: "BLUE",
      actionIds: ["blue-pick-1:slot-0"]
    });

    expect(crossTeam.ok).toBe(false);
    expect(crossTeam.error.code).toBe("draft-lineup-action-not-on-side");
    expect(duplicate.ok).toBe(false);
    expect(duplicate.error.code).toBe("draft-lineup-order-duplicate");
    expect(missing.ok).toBe(false);
    expect(missing.error.code).toBe("draft-lineup-order-length-invalid");
    expect(early.ok).toBe(false);
    expect(early.error.code).toBe("draft-lineup-not-ready");
    expect(JSON.stringify(lineupDraft)).toBe(before);
  });

  it("resets one side to pick order and confirms the lineup before draft completion", () => {
    const lineupDraft = createLineupDraft();
    const reordered = unwrap(
      reorderFinalLineup(lineupDraft, {
        side: "BLUE",
        actionIds: [
          "blue-pick-2:slot-0",
          "blue-pick-1:slot-0",
          "blue-pick-3:slot-0",
          "blue-pick-4:slot-0",
          "blue-pick-5:slot-0"
        ],
        now: "2026-05-30T12:00:20.000Z"
      })
    );
    const reset = unwrap(
      resetFinalLineupSide(reordered, {
        side: "BLUE",
        now: "2026-05-30T12:00:25.000Z",
        operatorId: "operator-1"
      })
    );
    const unconfirmedComplete = completeDraft(reset, { confirmed: true, now: "2026-05-30T12:00:28.000Z" });
    const confirmed = unwrap(
      confirmFinalLineup(reset, {
        confirmed: true,
        now: "2026-05-30T12:00:30.000Z",
        operatorId: "operator-1"
      })
    );

    expect(getFinalLineupActionIdsForSide(reset, "BLUE")).toEqual([
      "blue-pick-1:slot-0",
      "blue-pick-2:slot-0",
      "blue-pick-3:slot-0",
      "blue-pick-4:slot-0",
      "blue-pick-5:slot-0"
    ]);
    expect(reset.history.at(-1)?.action).toBe("FINAL_LINEUP_RESET");
    expect(confirmed.finalLineup).toMatchObject({
      status: "CONFIRMED",
      lineupConfirmedAt: "2026-05-30T12:00:30.000Z",
      confirmedByOperatorId: "operator-1"
    });
    expect(confirmed.timer.isRunning).toBe(false);

    expect(unconfirmedComplete).toMatchObject({
      ok: false,
      error: {
        code: "draft-lineup-unconfirmed"
      }
    });
  });

  it("does not mutate picks, bans, or lineup when the lineup timer reaches zero", () => {
    const lineupDraft = createLineupDraft();
    const timer = unwrap(
      calculateTimerState({
        timer: lineupDraft.timer,
        now: "2026-05-30T12:01:11.000Z"
      })
    );

    expect(timer).toEqual({
      isRunning: false,
      phaseStartedAt: undefined,
      remainingSeconds: 0,
      originalSeconds: 60
    });
    expect(lineupDraft.finalLineup?.status).toBe("ACTIVE");
    expect(lineupDraft.pickedHeroIds).toHaveLength(10);
    expect(lineupDraft.bannedHeroIds).toEqual([]);
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
