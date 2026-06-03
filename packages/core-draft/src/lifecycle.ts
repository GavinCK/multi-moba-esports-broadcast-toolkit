import type {
  DraftAction,
  DraftHistoryEntry,
  DraftPhaseDefinition,
  DraftRuleset,
  DraftState,
  DraftValidationIssue,
  DraftTimerState,
  JsonObject,
  JsonValue
} from "@mmbt/shared-types";

import { COMPLETE_ACTION_STATUSES } from "./constants.js";
import { fail, ok, type DraftEngineResult } from "./errors.js";
import { isFinalLineupConfirmed } from "./lineup.js";
import { createTimerForPhase, pauseTimer, resumeTimer } from "./timer.js";
import { validateDraftRuleset } from "./validation.js";

export interface CreateDraftStateInput {
  id?: string;
  gameId: string;
  ruleset: DraftRuleset;
  now?: string;
  metadata?: JsonObject;
  operatorId?: string;
}

export interface DraftOperationOptions {
  now?: string;
  operatorId?: string;
}

export interface ConfirmedDraftOperationOptions extends DraftOperationOptions {
  confirmed?: boolean;
}

function getNow(options?: DraftOperationOptions | CreateDraftStateInput): string {
  return options?.now ?? new Date().toISOString();
}

function toJsonIssues(issues: readonly DraftValidationIssue[] | undefined): JsonValue {
  return (issues ?? []).map((issue) => ({
    code: issue.code,
    message: issue.message,
    details: issue.details ?? null
  }));
}

function createHistoryEntry(
  state: Pick<DraftState, "history">,
  action: string,
  timestamp: string,
  operatorId: string | undefined,
  before: JsonValue | undefined,
  after: JsonValue | undefined
): DraftHistoryEntry {
  return {
    id: `${state.history.length + 1}:${action}:${timestamp}`,
    timestamp,
    operatorId,
    action,
    before,
    after
  };
}

function createActionSlots(ruleset: DraftRuleset, timestamp: string): DraftAction[] {
  return ruleset.phases.flatMap((phase) =>
    Array.from({ length: phase.count }, (_, slotIndex): DraftAction => {
      const team = phase.team === "AUTO" ? "NONE" : phase.team;

      return {
        id: `${phase.id}:slot-${slotIndex}`,
        phaseId: phase.id,
        type: phase.type,
        team,
        slotIndex,
        heroId: null,
        status: "PENDING",
        createdAt: timestamp
      };
    })
  );
}

function isActionComplete(action: DraftAction): boolean {
  return (COMPLETE_ACTION_STATUSES as readonly string[]).includes(action.status);
}

function getFirstIncompletePhaseIndex(state: DraftState, ruleset: DraftRuleset): number {
  const incompletePhase = ruleset.phases.findIndex((phase) =>
    state.actions.some((action) => action.phaseId === phase.id && !isActionComplete(action))
  );

  return incompletePhase === -1 ? ruleset.phases.length : incompletePhase;
}

function ensureStateMatchesRuleset(
  state: DraftState,
  ruleset: DraftRuleset
): DraftEngineResult<undefined> {
  if (state.rulesetId !== ruleset.id) {
    return fail({
      code: "draft-ruleset-mismatch",
      message: "Draft state rulesetId must match the supplied ruleset.",
      details: { stateRulesetId: state.rulesetId, rulesetId: ruleset.id }
    });
  }

  if (state.gameCode !== ruleset.gameCode) {
    return fail({
      code: "draft-game-code-mismatch",
      message: "Draft state gameCode must match the supplied ruleset gameCode.",
      details: { stateGameCode: state.gameCode, rulesetGameCode: ruleset.gameCode }
    });
  }

  return ok(undefined);
}

function hasAllActionsComplete(state: DraftState): boolean {
  return state.actions.every(isActionComplete);
}

export function createDraftState(input: CreateDraftStateInput): DraftEngineResult<DraftState> {
  const validation = validateDraftRuleset(input.ruleset);

  if (!validation.valid) {
    return fail({
      code: "draft-ruleset-invalid",
      message: validation.reason ?? "Draft ruleset is invalid.",
      details: toJsonIssues(validation.issues)
    });
  }

  const timestamp = getNow(input);
  const draftId = input.id ?? `draft:${input.gameId}:${input.ruleset.id}`;
  const timer = createTimerForPhase(input.ruleset.phases[0] ?? null, timestamp, "READY");
  const baseState = {
    history: []
  };
  const historyEntry = createHistoryEntry(
    baseState,
    "DRAFT_CREATED",
    timestamp,
    input.operatorId,
    undefined,
    {
      id: draftId,
      gameId: input.gameId,
      rulesetId: input.ruleset.id,
      status: "READY"
    }
  );

  return ok({
    id: draftId,
    gameId: input.gameId,
    rulesetId: input.ruleset.id,
    gameCode: input.ruleset.gameCode,
    status: "READY",
    currentPhaseIndex: 0,
    timer,
    actions: createActionSlots(input.ruleset, timestamp),
    lockedHeroIds: [],
    bannedHeroIds: [],
    pickedHeroIds: [],
    history: [historyEntry],
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: input.metadata
  });
}

export function startDraft(
  state: DraftState,
  ruleset: DraftRuleset,
  options: DraftOperationOptions = {}
): DraftEngineResult<DraftState> {
  const stateMatchesRuleset = ensureStateMatchesRuleset(state, ruleset);

  if (!stateMatchesRuleset.ok) {
    return fail(stateMatchesRuleset.error);
  }

  if (state.status !== "READY") {
    return fail({
      code: "draft-invalid-transition",
      message: "Only a READY draft can be started.",
      details: { currentStatus: state.status, requestedStatus: "LIVE" }
    });
  }

  const currentPhase = getCurrentPhase(state, ruleset);

  if (!currentPhase) {
    return fail({
      code: "draft-no-current-phase",
      message: "Draft cannot start without a current phase."
    });
  }

  const timestamp = getNow(options);
  const history = [
    ...state.history,
    createHistoryEntry(
      state,
      "DRAFT_STARTED",
      timestamp,
      options.operatorId,
      { status: state.status },
      { status: "LIVE" }
    )
  ];

  return ok({
    ...state,
    status: "LIVE",
    timer: createTimerForPhase(currentPhase, timestamp, "LIVE"),
    history,
    updatedAt: timestamp
  });
}

export function pauseDraft(
  state: DraftState,
  options: DraftOperationOptions = {}
): DraftEngineResult<DraftState> {
  if (state.status !== "LIVE") {
    return fail({
      code: "draft-invalid-transition",
      message: "Only a LIVE draft can be paused.",
      details: { currentStatus: state.status, requestedStatus: "PAUSED" }
    });
  }

  const timestamp = getNow(options);
  const timer = pauseTimer(state.timer, timestamp);

  if (!timer.ok) {
    return fail(timer.error);
  }

  const history = [
    ...state.history,
    createHistoryEntry(
      state,
      "DRAFT_PAUSED",
      timestamp,
      options.operatorId,
      { status: state.status },
      { status: "PAUSED" }
    )
  ];

  return ok({
    ...state,
    status: "PAUSED",
    timer: timer.value,
    history,
    updatedAt: timestamp
  });
}

export function resumeDraft(
  state: DraftState,
  options: DraftOperationOptions = {}
): DraftEngineResult<DraftState> {
  if (state.status !== "PAUSED") {
    return fail({
      code: "draft-invalid-transition",
      message: "Only a PAUSED draft can be resumed.",
      details: { currentStatus: state.status, requestedStatus: "LIVE" }
    });
  }

  const timestamp = getNow(options);
  const timer = resumeTimer(state.timer, timestamp);

  if (!timer.ok) {
    return fail(timer.error);
  }

  const history = [
    ...state.history,
    createHistoryEntry(
      state,
      "DRAFT_RESUMED",
      timestamp,
      options.operatorId,
      { status: state.status },
      { status: "LIVE" }
    )
  ];

  return ok({
    ...state,
    status: "LIVE",
    timer: timer.value,
    history,
    updatedAt: timestamp
  });
}

export function resetDraft(
  state: DraftState,
  ruleset: DraftRuleset,
  options: ConfirmedDraftOperationOptions = {}
): DraftEngineResult<DraftState> {
  const stateMatchesRuleset = ensureStateMatchesRuleset(state, ruleset);

  if (!stateMatchesRuleset.ok) {
    return fail(stateMatchesRuleset.error);
  }

  if (!options.confirmed) {
    return fail({
      code: "draft-confirmation-required",
      message: "Resetting a draft requires explicit confirmation.",
      details: { operation: "resetDraft" }
    });
  }

  if (state.status === "CANCELLED") {
    return fail({
      code: "draft-invalid-transition",
      message: "A CANCELLED draft cannot be reset by the lifecycle helper.",
      details: { currentStatus: state.status, requestedStatus: "READY" }
    });
  }

  const timestamp = getNow(options);
  const timer = createTimerForPhase(ruleset.phases[0] ?? null, timestamp, "READY");
  const history = [
    ...state.history,
    createHistoryEntry(
      state,
      "DRAFT_RESET",
      timestamp,
      options.operatorId,
      {
        status: state.status,
        currentPhaseIndex: state.currentPhaseIndex,
        lockedHeroIds: state.lockedHeroIds,
        bannedHeroIds: state.bannedHeroIds,
        pickedHeroIds: state.pickedHeroIds
      },
      { status: "READY", currentPhaseIndex: 0 }
    )
  ];

  return ok({
    ...state,
    status: "READY",
    currentPhaseIndex: 0,
    timer,
    actions: createActionSlots(ruleset, timestamp),
    lockedHeroIds: [],
    bannedHeroIds: [],
    pickedHeroIds: [],
    finalLineup: undefined,
    history,
    updatedAt: timestamp
  });
}

export function completeDraft(
  state: DraftState,
  options: ConfirmedDraftOperationOptions = {}
): DraftEngineResult<DraftState> {
  if (!options.confirmed) {
    return fail({
      code: "draft-confirmation-required",
      message: "Completing a draft requires explicit confirmation.",
      details: { operation: "completeDraft" }
    });
  }

  if (state.status !== "LIVE" && state.status !== "PAUSED") {
    return fail({
      code: "draft-invalid-transition",
      message: "Only a LIVE or PAUSED draft can be completed.",
      details: { currentStatus: state.status, requestedStatus: "COMPLETE" }
    });
  }

  if (!hasAllActionsComplete(state)) {
    return fail({
      code: "draft-incomplete",
      message: "Draft cannot be completed while required action slots are incomplete."
    });
  }

  if (state.finalLineup && !isFinalLineupConfirmed(state)) {
    return fail({
      code: "draft-lineup-unconfirmed",
      message: "Draft cannot be completed until the final lineup is confirmed."
    });
  }

  const timestamp = getNow(options);
  const timer: DraftTimerState = {
    ...state.timer,
    isRunning: false,
    phaseStartedAt: undefined,
    pausedAt: undefined
  };
  const history = [
    ...state.history,
    createHistoryEntry(
      state,
      "DRAFT_COMPLETED",
      timestamp,
      options.operatorId,
      { status: state.status },
      { status: "COMPLETE" }
    )
  ];

  return ok({
    ...state,
    status: "COMPLETE",
    currentPhaseIndex: state.currentPhaseIndex,
    timer,
    history,
    updatedAt: timestamp
  });
}

export function getCurrentPhase(
  state: DraftState,
  ruleset: DraftRuleset
): DraftPhaseDefinition | null {
  return ruleset.phases[state.currentPhaseIndex] ?? null;
}

export function getCurrentActionSlots(
  state: DraftState,
  ruleset: DraftRuleset
): DraftAction[] {
  const currentPhase = getCurrentPhase(state, ruleset);

  if (!currentPhase) {
    return [];
  }

  return state.actions
    .filter((action) => action.phaseId === currentPhase.id)
    .sort((firstAction, secondAction) => firstAction.slotIndex - secondAction.slotIndex);
}

export function getNextIncompletePhaseIndex(
  state: DraftState,
  ruleset: DraftRuleset
): number {
  return getFirstIncompletePhaseIndex(state, ruleset);
}
