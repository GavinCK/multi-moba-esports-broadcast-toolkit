import type { DraftAction, DraftRuleset, DraftState } from "@mmbt/shared-types";
import { describe, expect, it } from "vitest";

import {
  completeDraft,
  createDraftState,
  getCurrentActionSlots,
  getCurrentPhase,
  getNextIncompletePhaseIndex,
  pauseDraft,
  resetDraft,
  resumeDraft,
  startDraft,
  validateDraftRuleset
} from "./index";
import type { DraftEngineResult } from "./index";

const timestamp = "2026-05-30T12:00:00.000Z";

const ruleset: DraftRuleset = {
  id: "generic-lifecycle-test",
  gameCode: "generic-moba",
  name: "Generic Lifecycle Test",
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
    }
  ]
};

function unwrap<TValue>(result: DraftEngineResult<TValue>): TValue {
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function createReadyDraft(): DraftState {
  return unwrap(
    createDraftState({
      gameId: "game-1",
      ruleset,
      now: timestamp,
      operatorId: "operator-1"
    })
  );
}

function createLiveDraft(): DraftState {
  return unwrap(startDraft(createReadyDraft(), ruleset, { now: timestamp, operatorId: "operator-1" }));
}

function completeActions(actions: readonly DraftAction[]): DraftAction[] {
  return actions.map((action, index) => ({
    ...action,
    heroId: `hero-${index + 1}`,
    status: "LOCKED",
    lockedAt: "2026-05-30T12:01:00.000Z"
  }));
}

describe("validateDraftRuleset", () => {
  it("accepts a valid game-agnostic ruleset", () => {
    expect(validateDraftRuleset(ruleset)).toEqual({ valid: true });
  });

  it("rejects invalid phases and unsupported lifecycle scope", () => {
    const result = validateDraftRuleset({
      ...ruleset,
      id: "",
      phases: [
        {
          id: "duplicate",
          type: "BAN",
          team: "NONE",
          count: 0,
          timeSeconds: -1
        },
        {
          id: "duplicate",
          type: "SIDE_SELECTION",
          team: "AUTO",
          count: 1,
          timeSeconds: 0
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.issues?.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "draft-required-string",
        "draft-invalid-phase-team",
        "draft-phase-count-invalid",
        "draft-phase-time-invalid",
        "draft-phase-id-duplicate",
        "draft-unsupported-phase-type",
        "draft-unsupported-auto-team"
      ])
    );
  });
});

describe("createDraftState and selectors", () => {
  it("creates a READY draft with deterministic action slots and serializable state", () => {
    const draft = createReadyDraft();

    expect(draft.status).toBe("READY");
    expect(draft.currentPhaseIndex).toBe(0);
    expect(draft.timer).toEqual({
      isRunning: false,
      remainingSeconds: 30,
      originalSeconds: 30
    });
    expect(draft.actions.map((action) => action.id)).toEqual([
      "blue-ban-1:slot-0",
      "red-pick-1-2:slot-0",
      "red-pick-1-2:slot-1"
    ]);
    expect(draft.actions.map((action) => action.slotIndex)).toEqual([0, 0, 1]);
    expect(draft.history.at(-1)?.action).toBe("DRAFT_CREATED");
    expect(JSON.parse(JSON.stringify(draft))).toEqual(draft);
  });

  it("returns the current phase and current phase action slots", () => {
    const draft = createReadyDraft();

    expect(getCurrentPhase(draft, ruleset)?.id).toBe("blue-ban-1");
    expect(getCurrentActionSlots(draft, ruleset).map((action) => action.id)).toEqual([
      "blue-ban-1:slot-0"
    ]);

    const secondPhaseDraft: DraftState = {
      ...draft,
      currentPhaseIndex: 1
    };

    expect(getCurrentPhase(secondPhaseDraft, ruleset)?.id).toBe("red-pick-1-2");
    expect(getCurrentActionSlots(secondPhaseDraft, ruleset).map((action) => action.id)).toEqual([
      "red-pick-1-2:slot-0",
      "red-pick-1-2:slot-1"
    ]);
  });

  it("can identify the next incomplete phase index from action statuses", () => {
    const draft = createReadyDraft();
    const withFirstPhaseComplete: DraftState = {
      ...draft,
      actions: draft.actions.map((action) =>
        action.phaseId === "blue-ban-1" ? { ...action, status: "LOCKED", heroId: "hero-1" } : action
      )
    };

    expect(getNextIncompletePhaseIndex(withFirstPhaseComplete, ruleset)).toBe(1);
  });
});

describe("draft lifecycle transitions", () => {
  it("starts a READY draft and initializes the current phase timer", () => {
    const readyDraft = createReadyDraft();
    const result = startDraft(readyDraft, ruleset, {
      now: timestamp,
      operatorId: "operator-1"
    });
    const liveDraft = unwrap(result);

    expect(liveDraft).not.toBe(readyDraft);
    expect(readyDraft.status).toBe("READY");
    expect(liveDraft.status).toBe("LIVE");
    expect(liveDraft.timer).toEqual({
      isRunning: true,
      phaseStartedAt: timestamp,
      remainingSeconds: 30,
      originalSeconds: 30
    });
    expect(liveDraft.history.at(-1)?.action).toBe("DRAFT_STARTED");
  });

  it("rejects invalid start transitions without mutating state", () => {
    const liveDraft = createLiveDraft();
    const before = JSON.stringify(liveDraft);
    const result = startDraft(liveDraft, ruleset, {
      now: "2026-05-30T12:00:05.000Z"
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("draft-invalid-transition");
    expect(JSON.stringify(liveDraft)).toBe(before);
  });

  it("pauses a LIVE draft and freezes the current phase timer", () => {
    const liveDraft = createLiveDraft();
    const pausedDraft = unwrap(
      pauseDraft(liveDraft, {
        now: "2026-05-30T12:00:10.000Z",
        operatorId: "operator-1"
      })
    );

    expect(pausedDraft.status).toBe("PAUSED");
    expect(pausedDraft.timer).toEqual({
      isRunning: false,
      phaseStartedAt: undefined,
      pausedAt: "2026-05-30T12:00:10.000Z",
      remainingSeconds: 20,
      originalSeconds: 30
    });
    expect(pausedDraft.history.at(-1)?.action).toBe("DRAFT_PAUSED");
  });

  it("resumes a PAUSED draft and preserves the saved remaining time", () => {
    const pausedDraft = unwrap(
      pauseDraft(createLiveDraft(), {
        now: "2026-05-30T12:00:10.000Z"
      })
    );
    const resumedDraft = unwrap(
      resumeDraft(pausedDraft, {
        now: "2026-05-30T12:00:20.000Z",
        operatorId: "operator-1"
      })
    );

    expect(resumedDraft.status).toBe("LIVE");
    expect(resumedDraft.timer).toEqual({
      isRunning: true,
      phaseStartedAt: "2026-05-30T12:00:20.000Z",
      pausedAt: undefined,
      remainingSeconds: 20,
      originalSeconds: 30
    });
    expect(resumedDraft.history.at(-1)?.action).toBe("DRAFT_RESUMED");
  });

  it("rejects invalid resume transitions without mutating state", () => {
    const readyDraft = createReadyDraft();
    const before = JSON.stringify(readyDraft);
    const result = resumeDraft(readyDraft, {
      now: "2026-05-30T12:00:20.000Z"
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("draft-invalid-transition");
    expect(JSON.stringify(readyDraft)).toBe(before);
  });

  it("requires confirmation before resetting and then rebuilds clean READY state", () => {
    const liveDraft = createLiveDraft();
    const dirtyDraft: DraftState = {
      ...liveDraft,
      actions: completeActions(liveDraft.actions),
      lockedHeroIds: ["hero-1", "hero-2"],
      bannedHeroIds: ["hero-1"],
      pickedHeroIds: ["hero-2"]
    };

    const rejected = resetDraft(dirtyDraft, ruleset, {
      now: "2026-05-30T12:02:00.000Z"
    });
    expect(rejected.ok).toBe(false);
    expect(rejected.error.code).toBe("draft-confirmation-required");

    const reset = unwrap(
      resetDraft(dirtyDraft, ruleset, {
        confirmed: true,
        now: "2026-05-30T12:02:00.000Z",
        operatorId: "operator-1"
      })
    );

    expect(reset.status).toBe("READY");
    expect(reset.actions.every((action) => action.status === "PENDING" && action.heroId === null)).toBe(true);
    expect(reset.lockedHeroIds).toEqual([]);
    expect(reset.bannedHeroIds).toEqual([]);
    expect(reset.pickedHeroIds).toEqual([]);
    expect(reset.history.at(-1)?.action).toBe("DRAFT_RESET");
  });

  it("requires confirmation and complete action slots before completing", () => {
    const liveDraft = createLiveDraft();

    const missingConfirmation = completeDraft(liveDraft, {
      now: "2026-05-30T12:03:00.000Z"
    });
    expect(missingConfirmation.ok).toBe(false);
    expect(missingConfirmation.error.code).toBe("draft-confirmation-required");

    const incomplete = completeDraft(liveDraft, {
      confirmed: true,
      now: "2026-05-30T12:03:00.000Z"
    });
    expect(incomplete.ok).toBe(false);
    expect(incomplete.error.code).toBe("draft-incomplete");

    const completeReadyDraft: DraftState = {
      ...liveDraft,
      actions: completeActions(liveDraft.actions),
      lockedHeroIds: ["hero-1", "hero-2", "hero-3"],
      bannedHeroIds: ["hero-1"],
      pickedHeroIds: ["hero-2", "hero-3"]
    };
    const completed = unwrap(
      completeDraft(completeReadyDraft, {
        confirmed: true,
        now: "2026-05-30T12:03:00.000Z",
        operatorId: "operator-1"
      })
    );

    expect(completed.status).toBe("COMPLETE");
    expect(completed.timer.isRunning).toBe(false);
    expect(completed.history.at(-1)?.action).toBe("DRAFT_COMPLETED");
  });
});
