import type {
  DraftAction,
  DraftActionStatus,
  DraftActionType,
  DraftHistoryEntry,
  DraftPhaseDefinition,
  DraftRuleset,
  DraftState,
  DraftValidationIssue,
  DraftValidationResult,
  JsonObject,
  JsonValue,
  TeamSide
} from "@mmbt/shared-types";

import { COMPLETE_ACTION_STATUSES, TEAM_SIDES } from "./constants.js";
import { fail, ok, type DraftEngineError, type DraftEngineResult } from "./errors.js";
import { maybeStartFinalLineupPhase } from "./lineup.js";
import { calculateTimerState, createTimerForPhase } from "./timer.js";

export interface DraftActionOperationOptions {
  actionId?: string;
  heroId?: string;
  now?: string;
  operatorId?: string;
  expectedType?: DraftActionType;
  expectedTeam?: TeamSide | "NONE";
  expectedPhaseId?: string;
}

export interface ValidateDraftActionInput extends DraftActionOperationOptions {
  operation: "hover" | "lock";
}

export interface DraftHistoryOperationOptions {
  now?: string;
  operatorId?: string;
}

interface ResolvedDraftAction {
  phase: DraftPhaseDefinition;
  phaseIndex: number;
  action: DraftAction;
  actionIndex: number;
  heroId: string;
}

interface ResolvedDraftActionSlot {
  phase: DraftPhaseDefinition;
  phaseIndex: number;
  action: DraftAction;
  actionIndex: number;
}

interface ResolvedRedoAction {
  resolved: ResolvedDraftActionSlot;
  heroId: string | null;
  previousStatus: DraftActionStatus;
}

function getNow(options?: DraftActionOperationOptions | DraftHistoryOperationOptions): string {
  return options?.now ?? new Date().toISOString();
}

function createHistoryEntry(
  state: Pick<DraftState, "history">,
  action: string,
  timestamp: string,
  operatorId: string | undefined,
  before: JsonValue | undefined,
  after: JsonValue | undefined,
  metadata?: JsonObject
): DraftHistoryEntry {
  return {
    id: `${state.history.length + 1}:${action}:${timestamp}`,
    timestamp,
    operatorId,
    action,
    before,
    after,
    metadata
  };
}

function toValidationIssue(error: DraftEngineError): DraftValidationIssue {
  return {
    code: error.code,
    message: error.message,
    details: error.details
  };
}

function isActionComplete(action: DraftAction): boolean {
  return (COMPLETE_ACTION_STATUSES as readonly string[]).includes(action.status);
}

function isReversibleStatus(status: DraftActionStatus): boolean {
  return status === "LOCKED" || status === "SKIPPED";
}

function isSelectableActionType(type: DraftActionType): boolean {
  return type === "BAN" || type === "PICK";
}

function isConcreteTeamSide(team: string): team is TeamSide {
  return (TEAM_SIDES as readonly string[]).includes(team);
}

function phaseAllowsHover(phase: DraftPhaseDefinition): boolean {
  return phase.allowHover ?? isSelectableActionType(phase.type);
}

function normalizeHeroId(heroId: string | undefined): string | null {
  if (typeof heroId !== "string") {
    return null;
  }

  const normalized = heroId.trim();

  return normalized.length > 0 ? normalized : null;
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

function getPhaseActions(actions: readonly DraftAction[], phaseId: string): DraftAction[] {
  return actions
    .filter((action) => action.phaseId === phaseId)
    .sort((firstAction, secondAction) => firstAction.slotIndex - secondAction.slotIndex);
}

function findPhaseIndexById(ruleset: DraftRuleset, phaseId: string): number {
  return ruleset.phases.findIndex((phase) => phase.id === phaseId);
}

function getNextIncompletePhaseIndexAfter(
  actions: readonly DraftAction[],
  ruleset: DraftRuleset,
  startIndex: number
): number {
  for (let phaseIndex = startIndex; phaseIndex < ruleset.phases.length; phaseIndex += 1) {
    const phase = ruleset.phases[phaseIndex];

    if (phase && getPhaseActions(actions, phase.id).some((action) => !isActionComplete(action))) {
      return phaseIndex;
    }
  }

  return ruleset.phases.length;
}

function summarizeAction(action: DraftAction): JsonObject {
  return {
    id: action.id,
    phaseId: action.phaseId,
    type: action.type,
    team: action.team,
    slotIndex: action.slotIndex,
    heroId: action.heroId,
    status: action.status,
    operatorId: action.operatorId ?? null,
    hoveredAt: action.hoveredAt ?? null,
    lockedAt: action.lockedAt ?? null
  };
}

function createActionMetadata(action: DraftAction, heroId?: string | null): JsonObject {
  return {
    actionId: action.id,
    phaseId: action.phaseId,
    actionType: action.type,
    team: action.team,
    slotIndex: action.slotIndex,
    heroId: heroId ?? null,
    previousStatus: action.status,
    hoveredAt: action.hoveredAt ?? null,
    lockedAt: action.lockedAt ?? null,
    operatorId: action.operatorId ?? null
  };
}

function summarizeDraftActionChange(
  state: Pick<DraftState, "currentPhaseIndex" | "lockedHeroIds" | "bannedHeroIds" | "pickedHeroIds">,
  action: DraftAction
): JsonObject {
  return {
    currentPhaseIndex: state.currentPhaseIndex,
    action: summarizeAction(action),
    lockedHeroIds: [...state.lockedHeroIds],
    bannedHeroIds: [...state.bannedHeroIds],
    pickedHeroIds: [...state.pickedHeroIds]
  };
}

function validateDuplicateHero(
  state: DraftState,
  ruleset: DraftRuleset,
  phase: DraftPhaseDefinition,
  targetAction: DraftAction,
  heroId: string
): DraftEngineResult<undefined> {
  if (ruleset.allowDuplicateHeroes) {
    return ok(undefined);
  }

  const lockedDuplicate = state.actions.find(
    (action) => action.id !== targetAction.id && action.status === "LOCKED" && action.heroId === heroId
  );

  if (lockedDuplicate) {
    return fail({
      code: "draft-duplicate-hero",
      message: "This hero is already locked in the draft.",
      details: {
        heroId,
        existingActionId: lockedDuplicate.id,
        targetActionId: targetAction.id
      }
    });
  }

  const samePhaseHoverDuplicate = state.actions.find(
    (action) =>
      action.id !== targetAction.id &&
      action.phaseId === phase.id &&
      action.status === "HOVER" &&
      action.heroId === heroId
  );

  if (samePhaseHoverDuplicate) {
    return fail({
      code: "draft-duplicate-hover",
      message: "This hero is already hovered in another active slot.",
      details: {
        heroId,
        existingActionId: samePhaseHoverDuplicate.id,
        targetActionId: targetAction.id
      }
    });
  }

  return ok(undefined);
}

function resolveHeroForOperation(
  operation: "hover" | "lock",
  action: DraftAction,
  requestedHeroId: string | undefined
): DraftEngineResult<string> {
  const normalizedHeroId = normalizeHeroId(requestedHeroId);

  if (normalizedHeroId) {
    return ok(normalizedHeroId);
  }

  if (operation === "lock" && action.status === "HOVER" && action.heroId) {
    return ok(action.heroId);
  }

  return fail({
    code: "draft-hero-required",
    message: "A non-empty heroId is required for this draft action.",
    details: { actionId: action.id, operation }
  });
}

function resolveDraftAction(
  state: DraftState,
  ruleset: DraftRuleset,
  input: ValidateDraftActionInput
): DraftEngineResult<ResolvedDraftAction> {
  const stateMatchesRuleset = ensureStateMatchesRuleset(state, ruleset);

  if (!stateMatchesRuleset.ok) {
    return fail(stateMatchesRuleset.error);
  }

  if (state.status !== "LIVE") {
    return fail({
      code: "draft-invalid-status",
      message: "Draft actions can only be applied while the draft is LIVE.",
      details: { currentStatus: state.status, operation: input.operation }
    });
  }

  const phase = ruleset.phases[state.currentPhaseIndex];

  if (!phase) {
    return fail({
      code: "draft-no-current-phase",
      message: "Draft action requires a current phase."
    });
  }

  if (!isSelectableActionType(phase.type)) {
    return fail({
      code: "draft-action-type-unsupported",
      message: "Only BAN and PICK action slots can receive hero actions.",
      details: { phaseId: phase.id, phaseType: phase.type }
    });
  }

  if (input.operation === "hover" && !phaseAllowsHover(phase)) {
    return fail({
      code: "draft-hover-not-allowed",
      message: "Current phase does not allow hover actions.",
      details: { phaseId: phase.id }
    });
  }

  const phaseActions = getPhaseActions(state.actions, phase.id);
  const targetAction = input.actionId
    ? state.actions.find((action) => action.id === input.actionId)
    : phaseActions.find((action) => action.status === "PENDING" || action.status === "HOVER");

  if (!targetAction) {
    return fail({
      code: "draft-action-not-found",
      message: "No actionable draft slot was found.",
      details: { actionId: input.actionId ?? null, phaseId: phase.id }
    });
  }

  if (targetAction.phaseId !== phase.id) {
    return fail({
      code: "draft-action-not-current-phase",
      message: "Draft actions can only affect a slot in the current phase.",
      details: {
        actionId: targetAction.id,
        actionPhaseId: targetAction.phaseId,
        currentPhaseId: phase.id
      }
    });
  }

  if (isActionComplete(targetAction)) {
    return fail({
      code: "draft-action-complete",
      message: "Completed draft action slots cannot be changed by hover or lock.",
      details: { actionId: targetAction.id, status: targetAction.status }
    });
  }

  if (targetAction.type !== phase.type) {
    return fail({
      code: "draft-action-type-mismatch",
      message: "Draft action slot type must match the current phase type.",
      details: { actionId: targetAction.id, actionType: targetAction.type, phaseType: phase.type }
    });
  }

  if (isConcreteTeamSide(phase.team) && targetAction.team !== phase.team) {
    return fail({
      code: "draft-action-team-mismatch",
      message: "Draft action slot team must match the current phase team.",
      details: { actionId: targetAction.id, actionTeam: targetAction.team, phaseTeam: phase.team }
    });
  }

  if (input.expectedType && input.expectedType !== targetAction.type) {
    return fail({
      code: "draft-action-type-mismatch",
      message: "Requested action type does not match the target slot.",
      details: { actionId: targetAction.id, expectedType: input.expectedType, actionType: targetAction.type }
    });
  }

  if (input.expectedTeam && input.expectedTeam !== targetAction.team) {
    return fail({
      code: "draft-action-team-mismatch",
      message: "Requested team does not match the target slot.",
      details: { actionId: targetAction.id, expectedTeam: input.expectedTeam, actionTeam: targetAction.team }
    });
  }

  if (input.expectedPhaseId && input.expectedPhaseId !== targetAction.phaseId) {
    return fail({
      code: "draft-action-phase-mismatch",
      message: "Requested phase does not match the target slot.",
      details: { actionId: targetAction.id, expectedPhaseId: input.expectedPhaseId, actionPhaseId: targetAction.phaseId }
    });
  }

  const heroId = resolveHeroForOperation(input.operation, targetAction, input.heroId);

  if (!heroId.ok) {
    return fail(heroId.error);
  }

  const duplicateCheck = validateDuplicateHero(state, ruleset, phase, targetAction, heroId.value);

  if (!duplicateCheck.ok) {
    return fail(duplicateCheck.error);
  }

  const actionIndex = state.actions.findIndex((action) => action.id === targetAction.id);

  return ok({
    phase,
    phaseIndex: state.currentPhaseIndex,
    action: targetAction,
    actionIndex,
    heroId: heroId.value
  });
}

function resolveSkippableDraftAction(
  state: DraftState,
  ruleset: DraftRuleset,
  input: DraftActionOperationOptions = {}
): DraftEngineResult<ResolvedDraftActionSlot> {
  const stateMatchesRuleset = ensureStateMatchesRuleset(state, ruleset);

  if (!stateMatchesRuleset.ok) {
    return fail(stateMatchesRuleset.error);
  }

  if (state.status !== "LIVE") {
    return fail({
      code: "draft-invalid-status",
      message: "Draft actions can only be skipped while the draft is LIVE.",
      details: { currentStatus: state.status, operation: "skip" }
    });
  }

  const phase = ruleset.phases[state.currentPhaseIndex];

  if (!phase) {
    return fail({
      code: "draft-no-current-phase",
      message: "Draft skip requires a current phase."
    });
  }

  if (phase.type !== "BAN") {
    return fail({
      code: "draft-skip-not-ban",
      message: "Only BAN action slots can be skipped.",
      details: { phaseId: phase.id, phaseType: phase.type }
    });
  }

  const phaseActions = getPhaseActions(state.actions, phase.id);
  const targetAction = input.actionId
    ? state.actions.find((action) => action.id === input.actionId)
    : phaseActions.find((action) => action.status === "PENDING");

  if (!targetAction) {
    return fail({
      code: "draft-action-not-found",
      message: "No pending ban slot was found to skip.",
      details: { actionId: input.actionId ?? null, phaseId: phase.id }
    });
  }

  if (targetAction.phaseId !== phase.id) {
    return fail({
      code: "draft-action-not-current-phase",
      message: "Draft actions can only affect a slot in the current phase.",
      details: {
        actionId: targetAction.id,
        actionPhaseId: targetAction.phaseId,
        currentPhaseId: phase.id
      }
    });
  }

  if (targetAction.type !== "BAN") {
    return fail({
      code: "draft-skip-not-ban",
      message: "Only BAN action slots can be skipped.",
      details: { actionId: targetAction.id, actionType: targetAction.type }
    });
  }

  if (targetAction.status !== "PENDING") {
    return fail({
      code: "draft-action-not-pending",
      message: "Only pending ban slots can be skipped.",
      details: { actionId: targetAction.id, status: targetAction.status }
    });
  }

  if (isConcreteTeamSide(phase.team) && targetAction.team !== phase.team) {
    return fail({
      code: "draft-action-team-mismatch",
      message: "Draft action slot team must match the current phase team.",
      details: { actionId: targetAction.id, actionTeam: targetAction.team, phaseTeam: phase.team }
    });
  }

  if (input.expectedType && input.expectedType !== targetAction.type) {
    return fail({
      code: "draft-action-type-mismatch",
      message: "Requested action type does not match the target slot.",
      details: { actionId: targetAction.id, expectedType: input.expectedType, actionType: targetAction.type }
    });
  }

  if (input.expectedTeam && input.expectedTeam !== targetAction.team) {
    return fail({
      code: "draft-action-team-mismatch",
      message: "Requested team does not match the target slot.",
      details: { actionId: targetAction.id, expectedTeam: input.expectedTeam, actionTeam: targetAction.team }
    });
  }

  if (input.expectedPhaseId && input.expectedPhaseId !== targetAction.phaseId) {
    return fail({
      code: "draft-action-phase-mismatch",
      message: "Requested phase does not match the target slot.",
      details: { actionId: targetAction.id, expectedPhaseId: input.expectedPhaseId, actionPhaseId: targetAction.phaseId }
    });
  }

  const actionIndex = state.actions.findIndex((action) => action.id === targetAction.id);

  return ok({
    phase,
    phaseIndex: state.currentPhaseIndex,
    action: targetAction,
    actionIndex
  });
}

function appendLockedHeroIds(
  state: DraftState,
  action: DraftAction,
  heroId: string
): Pick<DraftState, "lockedHeroIds" | "bannedHeroIds" | "pickedHeroIds"> {
  return {
    lockedHeroIds: [...state.lockedHeroIds, heroId],
    bannedHeroIds: action.type === "BAN" ? [...state.bannedHeroIds, heroId] : [...state.bannedHeroIds],
    pickedHeroIds: action.type === "PICK" ? [...state.pickedHeroIds, heroId] : [...state.pickedHeroIds]
  };
}

function lockResolvedAction(
  state: DraftState,
  ruleset: DraftRuleset,
  resolved: ResolvedDraftAction,
  timestamp: string,
  operatorId: string | undefined,
  historyAction: "HERO_LOCKED" | "ACTION_REDONE"
): DraftEngineResult<DraftState> {
  const lockedAction: DraftAction = {
    ...resolved.action,
    heroId: resolved.heroId,
    status: "LOCKED",
    operatorId,
    lockedAt: timestamp
  };
  const actions = state.actions.map((action, actionIndex) =>
    actionIndex === resolved.actionIndex ? lockedAction : action
  );
  const arrays = appendLockedHeroIds(state, resolved.action, resolved.heroId);
  const phaseComplete = getPhaseActions(actions, resolved.phase.id).every(isActionComplete);
  const shouldAdvance = phaseComplete && resolved.phase.autoAdvance !== false;
  const calculatedTimer = calculateTimerState({ timer: state.timer, now: timestamp });

  if (!calculatedTimer.ok) {
    return fail(calculatedTimer.error);
  }

  const currentPhaseIndex = shouldAdvance
    ? getNextIncompletePhaseIndexAfter(actions, ruleset, resolved.phaseIndex + 1)
    : state.currentPhaseIndex;
  const timer = shouldAdvance
    ? createTimerForPhase(ruleset.phases[currentPhaseIndex] ?? null, timestamp, state.status)
    : calculatedTimer.value;
  const stateAfterLock = {
    currentPhaseIndex,
    lockedHeroIds: arrays.lockedHeroIds,
    bannedHeroIds: arrays.bannedHeroIds,
    pickedHeroIds: arrays.pickedHeroIds
  };
  const lockHistory = createHistoryEntry(
    state,
    historyAction,
    timestamp,
    operatorId,
    summarizeDraftActionChange(state, resolved.action),
    summarizeDraftActionChange(stateAfterLock, lockedAction),
    createActionMetadata(resolved.action, resolved.heroId)
  );
  let history = [...state.history, lockHistory];

  if (shouldAdvance && currentPhaseIndex !== state.currentPhaseIndex) {
    history = [
      ...history,
      createHistoryEntry(
        { history },
        "PHASE_ADVANCED",
        timestamp,
        operatorId,
        { currentPhaseIndex: state.currentPhaseIndex, phaseId: resolved.phase.id },
        {
          currentPhaseIndex,
          phaseId: ruleset.phases[currentPhaseIndex]?.id ?? null
        }
      )
    ];
  }

  const nextState: DraftState = {
    ...state,
    currentPhaseIndex,
    timer,
    actions,
    lockedHeroIds: arrays.lockedHeroIds,
    bannedHeroIds: arrays.bannedHeroIds,
    pickedHeroIds: arrays.pickedHeroIds,
    history,
    updatedAt: timestamp
  };

  return ok(maybeStartFinalLineupPhase(nextState, { now: timestamp, operatorId }));
}

function skipResolvedAction(
  state: DraftState,
  ruleset: DraftRuleset,
  resolved: ResolvedDraftActionSlot,
  timestamp: string,
  operatorId: string | undefined,
  historyAction: "ACTION_SKIPPED" | "ACTION_REDONE"
): DraftEngineResult<DraftState> {
  const skippedAction: DraftAction = {
    ...resolved.action,
    heroId: null,
    status: "SKIPPED",
    operatorId,
    hoveredAt: undefined,
    lockedAt: undefined
  };
  const actions = state.actions.map((action, actionIndex) =>
    actionIndex === resolved.actionIndex ? skippedAction : action
  );
  const phaseComplete = getPhaseActions(actions, resolved.phase.id).every(isActionComplete);
  const shouldAdvance = phaseComplete && resolved.phase.autoAdvance !== false;
  const calculatedTimer = calculateTimerState({ timer: state.timer, now: timestamp });

  if (!calculatedTimer.ok) {
    return fail(calculatedTimer.error);
  }

  const currentPhaseIndex = shouldAdvance
    ? getNextIncompletePhaseIndexAfter(actions, ruleset, resolved.phaseIndex + 1)
    : state.currentPhaseIndex;
  const timer = shouldAdvance
    ? createTimerForPhase(ruleset.phases[currentPhaseIndex] ?? null, timestamp, state.status)
    : calculatedTimer.value;
  const stateAfterSkip = {
    currentPhaseIndex,
    lockedHeroIds: [...state.lockedHeroIds],
    bannedHeroIds: [...state.bannedHeroIds],
    pickedHeroIds: [...state.pickedHeroIds]
  };
  const skipHistory = createHistoryEntry(
    state,
    historyAction,
    timestamp,
    operatorId,
    summarizeDraftActionChange(state, resolved.action),
    summarizeDraftActionChange(stateAfterSkip, skippedAction),
    createActionMetadata(resolved.action)
  );
  let history = [...state.history, skipHistory];

  if (shouldAdvance && currentPhaseIndex !== state.currentPhaseIndex) {
    history = [
      ...history,
      createHistoryEntry(
        { history },
        "PHASE_ADVANCED",
        timestamp,
        operatorId,
        { currentPhaseIndex: state.currentPhaseIndex, phaseId: resolved.phase.id },
        {
          currentPhaseIndex,
          phaseId: ruleset.phases[currentPhaseIndex]?.id ?? null
        }
      )
    ];
  }

  const nextState: DraftState = {
    ...state,
    currentPhaseIndex,
    timer,
    actions,
    history,
    updatedAt: timestamp
  };

  return ok(maybeStartFinalLineupPhase(nextState, { now: timestamp, operatorId }));
}

function removeLastMatchingHero(heroIds: readonly string[], heroId: string): string[] {
  const indexToRemove = heroIds.lastIndexOf(heroId);

  if (indexToRemove === -1) {
    return [...heroIds];
  }

  return heroIds.filter((_, index) => index !== indexToRemove);
}

function removeLockedHeroIds(
  state: DraftState,
  action: DraftAction
): Pick<DraftState, "lockedHeroIds" | "bannedHeroIds" | "pickedHeroIds"> {
  if (!action.heroId || action.status !== "LOCKED") {
    return {
      lockedHeroIds: [...state.lockedHeroIds],
      bannedHeroIds: [...state.bannedHeroIds],
      pickedHeroIds: [...state.pickedHeroIds]
    };
  }

  return {
    lockedHeroIds: removeLastMatchingHero(state.lockedHeroIds, action.heroId),
    bannedHeroIds:
      action.type === "BAN" ? removeLastMatchingHero(state.bannedHeroIds, action.heroId) : [...state.bannedHeroIds],
    pickedHeroIds:
      action.type === "PICK" ? removeLastMatchingHero(state.pickedHeroIds, action.heroId) : [...state.pickedHeroIds]
  };
}

function readMetadataString(metadata: JsonObject | undefined, key: string): string | null {
  const value = metadata?.[key];

  return typeof value === "string" ? value : null;
}

function findLastReversibleActionIndex(state: DraftState): number {
  for (let historyIndex = state.history.length - 1; historyIndex >= 0; historyIndex -= 1) {
    const historyEntry = state.history[historyIndex];

    if (
      historyEntry?.action !== "HERO_LOCKED" &&
      historyEntry?.action !== "ACTION_SKIPPED" &&
      historyEntry?.action !== "ACTION_REDONE"
    ) {
      continue;
    }

    const actionId = readMetadataString(historyEntry.metadata, "actionId");

    if (!actionId) {
      continue;
    }

    const actionIndex = state.actions.findIndex(
      (action) => action.id === actionId && isReversibleStatus(action.status)
    );

    if (actionIndex !== -1) {
      return actionIndex;
    }
  }

  for (let actionIndex = state.actions.length - 1; actionIndex >= 0; actionIndex -= 1) {
    const action = state.actions[actionIndex];

    if (action && isReversibleStatus(action.status)) {
      return actionIndex;
    }
  }

  return -1;
}

function resolveRedoAction(
  state: DraftState,
  ruleset: DraftRuleset
): DraftEngineResult<ResolvedRedoAction> {
  const stateMatchesRuleset = ensureStateMatchesRuleset(state, ruleset);

  if (!stateMatchesRuleset.ok) {
    return fail(stateMatchesRuleset.error);
  }

  const lastHistory = state.history.at(-1);

  if (lastHistory?.action !== "ACTION_UNDONE") {
    return fail({
      code: "draft-no-redo-action",
      message: "Redo requires the latest draft history entry to be an undo."
    });
  }

  const actionId = readMetadataString(lastHistory.metadata, "actionId");
  const heroId = readMetadataString(lastHistory.metadata, "heroId");
  const previousStatus = readMetadataString(lastHistory.metadata, "previousStatus");

  if (!actionId || (previousStatus !== "LOCKED" && previousStatus !== "SKIPPED")) {
    return fail({
      code: "draft-redo-metadata-invalid",
      message: "Redo could not identify a locked or skipped action from the latest undo entry."
    });
  }

  if (previousStatus === "LOCKED" && !heroId) {
    return fail({
      code: "draft-redo-metadata-invalid",
      message: "Redo could not identify the locked hero from the latest undo entry."
    });
  }

  if (state.status !== "LIVE" && state.status !== "PAUSED") {
    return fail({
      code: "draft-invalid-status",
      message: "Redo can only be applied while the draft is LIVE or PAUSED.",
      details: { currentStatus: state.status }
    });
  }

  const actionIndex = state.actions.findIndex((action) => action.id === actionId);
  const action = state.actions[actionIndex];

  if (!action) {
    return fail({
      code: "draft-action-not-found",
      message: "Redo target action no longer exists.",
      details: { actionId }
    });
  }

  if (isActionComplete(action)) {
    return fail({
      code: "draft-action-complete",
      message: "Redo target action is already complete.",
      details: { actionId, status: action.status }
    });
  }

  const phaseIndex = findPhaseIndexById(ruleset, action.phaseId);
  const phase = ruleset.phases[phaseIndex];

  if (!phase || phaseIndex !== state.currentPhaseIndex) {
    return fail({
      code: "draft-action-not-current-phase",
      message: "Redo target action must belong to the current phase.",
      details: { actionId, actionPhaseId: action.phaseId, currentPhaseIndex: state.currentPhaseIndex }
    });
  }

  if (previousStatus === "SKIPPED") {
    if (phase.type !== "BAN" || action.type !== "BAN") {
      return fail({
        code: "draft-skip-not-ban",
        message: "Only BAN action slots can be skipped.",
        details: { actionId: action.id, actionType: action.type, phaseType: phase.type }
      });
    }

    return ok({
      resolved: {
        phase,
        phaseIndex,
        action,
        actionIndex
      },
      heroId: null,
      previousStatus
    });
  }

  const duplicateCheck = validateDuplicateHero(state, ruleset, phase, action, heroId as string);

  if (!duplicateCheck.ok) {
    return fail(duplicateCheck.error);
  }

  return ok({
    resolved: {
      phase,
      phaseIndex,
      action,
      actionIndex
    },
    heroId: heroId as string,
    previousStatus
  });
}

export function validateDraftAction(
  state: DraftState,
  ruleset: DraftRuleset,
  input: ValidateDraftActionInput
): DraftValidationResult {
  const result = resolveDraftAction(state, ruleset, input);

  if (result.ok) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: result.error.message,
    issues: [toValidationIssue(result.error)]
  };
}

export function hoverHero(
  state: DraftState,
  ruleset: DraftRuleset,
  input: DraftActionOperationOptions
): DraftEngineResult<DraftState> {
  const resolved = resolveDraftAction(state, ruleset, { ...input, operation: "hover" });

  if (!resolved.ok) {
    return fail(resolved.error);
  }

  const timestamp = getNow(input);
  const hoveredAction: DraftAction = {
    ...resolved.value.action,
    heroId: resolved.value.heroId,
    status: "HOVER",
    operatorId: input.operatorId,
    hoveredAt: timestamp,
    lockedAt: undefined
  };
  const actions = state.actions.map((action, actionIndex) =>
    actionIndex === resolved.value.actionIndex ? hoveredAction : action
  );
  const history = [
    ...state.history,
    createHistoryEntry(
      state,
      "HERO_HOVERED",
      timestamp,
      input.operatorId,
      summarizeDraftActionChange(state, resolved.value.action),
      summarizeDraftActionChange(state, hoveredAction),
      createActionMetadata(resolved.value.action, resolved.value.heroId)
    )
  ];

  return ok({
    ...state,
    actions,
    history,
    updatedAt: timestamp
  });
}

export function lockHero(
  state: DraftState,
  ruleset: DraftRuleset,
  input: DraftActionOperationOptions
): DraftEngineResult<DraftState> {
  const resolved = resolveDraftAction(state, ruleset, { ...input, operation: "lock" });

  if (!resolved.ok) {
    return fail(resolved.error);
  }

  return lockResolvedAction(
    state,
    ruleset,
    resolved.value,
    getNow(input),
    input.operatorId,
    "HERO_LOCKED"
  );
}

export function skipDraftAction(
  state: DraftState,
  ruleset: DraftRuleset,
  input: DraftActionOperationOptions = {}
): DraftEngineResult<DraftState> {
  const resolved = resolveSkippableDraftAction(state, ruleset, input);

  if (!resolved.ok) {
    return fail(resolved.error);
  }

  return skipResolvedAction(
    state,
    ruleset,
    resolved.value,
    getNow(input),
    input.operatorId,
    "ACTION_SKIPPED"
  );
}

export function validateSkipDraftAction(
  state: DraftState,
  ruleset: DraftRuleset,
  input: DraftActionOperationOptions = {}
): DraftValidationResult {
  const result = resolveSkippableDraftAction(state, ruleset, input);

  if (result.ok) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: result.error.message,
    issues: [toValidationIssue(result.error)]
  };
}

export function advancePhase(
  state: DraftState,
  ruleset: DraftRuleset,
  options: DraftHistoryOperationOptions = {}
): DraftEngineResult<DraftState> {
  const stateMatchesRuleset = ensureStateMatchesRuleset(state, ruleset);

  if (!stateMatchesRuleset.ok) {
    return fail(stateMatchesRuleset.error);
  }

  if (state.status !== "LIVE") {
    return fail({
      code: "draft-invalid-status",
      message: "Phase advancement can only be applied while the draft is LIVE.",
      details: { currentStatus: state.status }
    });
  }

  const phase = ruleset.phases[state.currentPhaseIndex];

  if (!phase) {
    return fail({
      code: "draft-no-current-phase",
      message: "Phase advancement requires a current phase."
    });
  }

  const phaseActions = getPhaseActions(state.actions, phase.id);

  if (phaseActions.some((action) => !isActionComplete(action))) {
    return fail({
      code: "draft-phase-incomplete",
      message: "Current phase cannot advance until all action slots are complete.",
      details: { phaseId: phase.id }
    });
  }

  const timestamp = getNow(options);
  const currentPhaseIndex = getNextIncompletePhaseIndexAfter(
    state.actions,
    ruleset,
    state.currentPhaseIndex + 1
  );
  const timer = createTimerForPhase(ruleset.phases[currentPhaseIndex] ?? null, timestamp, state.status);
  const history = [
    ...state.history,
    createHistoryEntry(
      state,
      "PHASE_ADVANCED",
      timestamp,
      options.operatorId,
      { currentPhaseIndex: state.currentPhaseIndex, phaseId: phase.id },
      { currentPhaseIndex, phaseId: ruleset.phases[currentPhaseIndex]?.id ?? null }
    )
  ];

  return ok({
    ...state,
    currentPhaseIndex,
    timer,
    history,
    updatedAt: timestamp
  });
}

export function undoLastAction(
  state: DraftState,
  ruleset: DraftRuleset,
  options: DraftHistoryOperationOptions = {}
): DraftEngineResult<DraftState> {
  const stateMatchesRuleset = ensureStateMatchesRuleset(state, ruleset);

  if (!stateMatchesRuleset.ok) {
    return fail(stateMatchesRuleset.error);
  }

  if (state.status === "READY" || state.status === "COMPLETE" || state.status === "CANCELLED") {
    return fail({
      code: "draft-invalid-status",
      message: "Undo can only be applied to a LIVE or PAUSED draft with reversible actions.",
      details: { currentStatus: state.status }
    });
  }

  if (state.finalLineup) {
    return fail({
      code: "draft-lineup-active",
      message: "Undo is not allowed after the final lineup phase has started. Reset the draft if pick/ban history must change.",
      details: { lineupStatus: state.finalLineup.status }
    });
  }

  const actionIndex = findLastReversibleActionIndex(state);
  const action = state.actions[actionIndex];

  if (!action) {
    return fail({
      code: "draft-no-reversible-action",
      message: "No reversible locked draft action was found."
    });
  }

  const phaseIndex = findPhaseIndexById(ruleset, action.phaseId);
  const phase = ruleset.phases[phaseIndex];

  if (!phase) {
    return fail({
      code: "draft-phase-not-found",
      message: "Undo target phase no longer exists in the ruleset.",
      details: { actionId: action.id, phaseId: action.phaseId }
    });
  }

  const timestamp = getNow(options);
  const pendingAction: DraftAction = {
    ...action,
    heroId: null,
    status: "PENDING",
    operatorId: undefined,
    hoveredAt: undefined,
    lockedAt: undefined
  };
  const actions = state.actions.map((draftAction, draftActionIndex) =>
    draftActionIndex === actionIndex ? pendingAction : draftAction
  );
  const arrays = removeLockedHeroIds(state, action);
  let timer = state.timer;

  if (phaseIndex !== state.currentPhaseIndex) {
    timer = createTimerForPhase(phase, timestamp, state.status);
  } else if (state.status === "LIVE") {
    const calculatedTimer = calculateTimerState({ timer: state.timer, now: timestamp });

    if (!calculatedTimer.ok) {
      return fail(calculatedTimer.error);
    }

    timer = calculatedTimer.value;
  } else {
    timer = {
      ...state.timer,
      isRunning: false,
      phaseStartedAt: undefined,
      pausedAt: state.timer.pausedAt ?? timestamp
    };
  }

  const stateAfterUndo = {
    currentPhaseIndex: phaseIndex,
    lockedHeroIds: arrays.lockedHeroIds,
    bannedHeroIds: arrays.bannedHeroIds,
    pickedHeroIds: arrays.pickedHeroIds
  };
  const history = [
    ...state.history,
      createHistoryEntry(
      state,
      "ACTION_UNDONE",
      timestamp,
      options.operatorId,
      summarizeDraftActionChange(state, action),
      summarizeDraftActionChange(stateAfterUndo, pendingAction),
      createActionMetadata(action, action.heroId)
    )
  ];

  return ok({
    ...state,
    currentPhaseIndex: phaseIndex,
    timer,
    actions,
    lockedHeroIds: arrays.lockedHeroIds,
    bannedHeroIds: arrays.bannedHeroIds,
    pickedHeroIds: arrays.pickedHeroIds,
    history,
    updatedAt: timestamp
  });
}

export function redoLastUndoneAction(
  state: DraftState,
  ruleset: DraftRuleset,
  options: DraftHistoryOperationOptions = {}
): DraftEngineResult<DraftState> {
  if (state.finalLineup) {
    return fail({
      code: "draft-lineup-active",
      message: "Redo is not allowed after the final lineup phase has started. Reset the draft if pick/ban history must change.",
      details: { lineupStatus: state.finalLineup.status }
    });
  }

  const resolved = resolveRedoAction(state, ruleset);

  if (!resolved.ok) {
    return fail(resolved.error);
  }

  if (resolved.value.previousStatus === "SKIPPED") {
    return skipResolvedAction(
      state,
      ruleset,
      resolved.value.resolved,
      getNow(options),
      options.operatorId,
      "ACTION_REDONE"
    );
  }

  return lockResolvedAction(
    state,
    ruleset,
    {
      ...resolved.value.resolved,
      heroId: resolved.value.heroId as string
    },
    getNow(options),
    options.operatorId,
    "ACTION_REDONE"
  );
}
