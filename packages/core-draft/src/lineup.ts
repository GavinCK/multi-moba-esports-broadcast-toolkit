import type {
  DraftAction,
  DraftFinalLineupState,
  DraftHistoryEntry,
  DraftLineupSide,
  DraftState,
  JsonObject,
  JsonValue
} from "@mmbt/shared-types";

import { COMPLETE_ACTION_STATUSES } from "./constants.js";
import { fail, ok, type DraftEngineResult } from "./errors.js";
import { calculateTimerState } from "./timer.js";

export const FINAL_LINEUP_TIMER_SECONDS = 60;
export const DRAFT_LINEUP_SIDES = ["BLUE", "RED"] as const satisfies readonly DraftLineupSide[];

export interface DraftLineupOperationOptions {
  side?: string;
  actionIds?: string[];
  now?: string;
  operatorId?: string;
  confirmed?: boolean;
}

interface DraftLineupSnapshot {
  finalLineup?: DraftFinalLineupState;
  timer: DraftState["timer"];
}

function getNow(options?: DraftLineupOperationOptions): string {
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

function isActionComplete(action: DraftAction): boolean {
  return (COMPLETE_ACTION_STATUSES as readonly string[]).includes(action.status);
}

export function isDraftLineupSide(value: string | undefined): value is DraftLineupSide {
  return value === "BLUE" || value === "RED";
}

export function getPickActionsForSide(state: DraftState, side: DraftLineupSide): DraftAction[] {
  return state.actions.filter((action) => action.type === "PICK" && action.team === side);
}

export function getLockedPickActionsForSide(state: DraftState, side: DraftLineupSide): DraftAction[] {
  return getPickActionsForSide(state, side).filter(
    (action) => action.status === "LOCKED" && typeof action.heroId === "string" && action.heroId.length > 0
  );
}

function hasAllPickActionsLockedForSide(state: DraftState, side: DraftLineupSide): boolean {
  const pickActions = getPickActionsForSide(state, side);

  return pickActions.length > 0 && pickActions.every((action) => action.status === "LOCKED" && action.heroId);
}

export function hasFinalLineupReadyPicks(state: DraftState): boolean {
  return DRAFT_LINEUP_SIDES.every((side) => hasAllPickActionsLockedForSide(state, side));
}

export function shouldStartFinalLineupPhase(state: DraftState): boolean {
  return (
    !state.finalLineup &&
    state.actions.length > 0 &&
    state.actions.every(isActionComplete) &&
    hasFinalLineupReadyPicks(state)
  );
}

export function getDefaultFinalLineupBySide(
  state: DraftState
): Partial<Record<DraftLineupSide, string[]>> {
  return Object.fromEntries(
    DRAFT_LINEUP_SIDES.map((side) => [
      side,
      getLockedPickActionsForSide(state, side).map((action) => action.id)
    ])
  ) as Partial<Record<DraftLineupSide, string[]>>;
}

export function getFinalLineupActionIdsForSide(
  state: DraftState,
  side: DraftLineupSide
): string[] {
  const configured = state.finalLineup?.finalLineupBySide[side];

  return configured ? [...configured] : getLockedPickActionsForSide(state, side).map((action) => action.id);
}

function createLineupTimer(timestamp: string, isRunning: boolean): DraftState["timer"] {
  return {
    isRunning,
    phaseStartedAt: isRunning ? timestamp : undefined,
    remainingSeconds: FINAL_LINEUP_TIMER_SECONDS,
    originalSeconds: FINAL_LINEUP_TIMER_SECONDS
  };
}

function summarizeLineup(state: DraftState): DraftLineupSnapshot {
  return {
    finalLineup: state.finalLineup
      ? {
          ...state.finalLineup,
          finalLineupBySide: {
            BLUE: [...(state.finalLineup.finalLineupBySide.BLUE ?? [])],
            RED: [...(state.finalLineup.finalLineupBySide.RED ?? [])]
          }
        }
      : undefined,
    timer: { ...state.timer }
  };
}

function startFinalLineupPhase(
  state: DraftState,
  timestamp: string,
  operatorId: string | undefined
): DraftEngineResult<DraftState> {
  if (!hasFinalLineupReadyPicks(state) || !state.actions.every(isActionComplete)) {
    return fail({
      code: "draft-lineup-not-ready",
      message: "Final lineup cannot start until all required picks are locked."
    });
  }

  const existingLineup = state.finalLineup;

  if (existingLineup?.status === "CONFIRMED") {
    return fail({
      code: "draft-lineup-confirmed",
      message: "Final lineup has already been confirmed."
    });
  }

  const finalLineupBySide = {
    ...getDefaultFinalLineupBySide(state),
    ...(existingLineup?.finalLineupBySide ?? {})
  };
  const finalLineup: DraftFinalLineupState = {
    status: "ACTIVE",
    finalLineupBySide,
    lineupPhaseStartedAt: existingLineup?.lineupPhaseStartedAt ?? timestamp,
    updatedAt: timestamp
  };
  const before = summarizeLineup(state);
  const nextState: DraftState = {
    ...state,
    timer: createLineupTimer(timestamp, state.status === "LIVE"),
    finalLineup,
    history: [
      ...state.history,
      createHistoryEntry(
        state,
        "FINAL_LINEUP_STARTED",
        timestamp,
        operatorId,
        before as unknown as JsonValue,
        {
          finalLineup,
          timer: createLineupTimer(timestamp, state.status === "LIVE")
        } as unknown as JsonValue
      )
    ],
    updatedAt: timestamp
  };

  return ok(nextState);
}

export function maybeStartFinalLineupPhase(
  state: DraftState,
  options: DraftLineupOperationOptions = {}
): DraftState {
  if (!shouldStartFinalLineupPhase(state)) {
    return state;
  }

  const result = startFinalLineupPhase(state, getNow(options), options.operatorId);

  return result.ok ? result.value : state;
}

function ensureMutableLineup(
  state: DraftState,
  timestamp: string,
  operatorId: string | undefined
): DraftEngineResult<DraftState> {
  if (state.finalLineup?.status === "CONFIRMED") {
    return fail({
      code: "draft-lineup-confirmed",
      message: "Final lineup cannot be changed after confirmation."
    });
  }

  if (state.finalLineup?.status === "ACTIVE") {
    return ok(state);
  }

  return startFinalLineupPhase(state, timestamp, operatorId);
}

function validateSideReady(state: DraftState, side: DraftLineupSide): DraftEngineResult<DraftAction[]> {
  const picks = getPickActionsForSide(state, side);
  const lockedPicks = getLockedPickActionsForSide(state, side);

  if (picks.length === 0 || lockedPicks.length !== picks.length) {
    return fail({
      code: "draft-lineup-side-not-ready",
      message: "Final lineup reorder requires all picks for the requested side to be locked.",
      details: {
        side,
        requiredPickCount: picks.length,
        lockedPickCount: lockedPicks.length
      }
    });
  }

  return ok(lockedPicks);
}

function validateActionOrder(
  side: DraftLineupSide,
  lockedPicks: readonly DraftAction[],
  actionIds: readonly string[] | undefined
): DraftEngineResult<string[]> {
  if (!actionIds) {
    return fail({
      code: "draft-lineup-order-required",
      message: "Final lineup reorder requires an actionIds array.",
      details: { side }
    });
  }

  if (actionIds.length !== lockedPicks.length) {
    return fail({
      code: "draft-lineup-order-length-invalid",
      message: "Final lineup order must include exactly the side's locked pick actions.",
      details: {
        side,
        expectedCount: lockedPicks.length,
        receivedCount: actionIds.length
      }
    });
  }

  const uniqueActionIds = new Set(actionIds);

  if (uniqueActionIds.size !== actionIds.length) {
    return fail({
      code: "draft-lineup-order-duplicate",
      message: "Final lineup order cannot contain duplicate actions.",
      details: { side }
    });
  }

  const sidePickIds = new Set(lockedPicks.map((action) => action.id));
  const invalidActionIds = actionIds.filter((actionId) => !sidePickIds.has(actionId));

  if (invalidActionIds.length > 0) {
    return fail({
      code: "draft-lineup-action-not-on-side",
      message: "Final lineup order can only include locked pick actions from the requested side.",
      details: {
        side,
        invalidActionIds
      }
    });
  }

  return ok([...actionIds]);
}

export function reorderFinalLineup(
  state: DraftState,
  options: DraftLineupOperationOptions
): DraftEngineResult<DraftState> {
  const timestamp = getNow(options);

  if (!isDraftLineupSide(options.side)) {
    return fail({
      code: "draft-lineup-side-invalid",
      message: "Final lineup side must be BLUE or RED.",
      details: { side: options.side ?? null }
    });
  }

  const mutableState = ensureMutableLineup(state, timestamp, options.operatorId);

  if (!mutableState.ok) {
    return fail(mutableState.error);
  }

  const lockedPicks = validateSideReady(mutableState.value, options.side);

  if (!lockedPicks.ok) {
    return fail(lockedPicks.error);
  }

  const nextOrder = validateActionOrder(options.side, lockedPicks.value, options.actionIds);

  if (!nextOrder.ok) {
    return fail(nextOrder.error);
  }

  const before = summarizeLineup(mutableState.value);
  const finalLineup: DraftFinalLineupState = {
    ...(mutableState.value.finalLineup as DraftFinalLineupState),
    status: "ACTIVE",
    finalLineupBySide: {
      ...(mutableState.value.finalLineup?.finalLineupBySide ?? getDefaultFinalLineupBySide(mutableState.value)),
      [options.side]: nextOrder.value
    },
    updatedAt: timestamp
  };
  const nextState: DraftState = {
    ...mutableState.value,
    finalLineup,
    history: [
      ...mutableState.value.history,
      createHistoryEntry(
        mutableState.value,
        "FINAL_LINEUP_REORDERED",
        timestamp,
        options.operatorId,
        before as unknown as JsonValue,
        summarizeLineup({ ...mutableState.value, finalLineup }) as unknown as JsonValue,
        {
          side: options.side,
          actionIds: nextOrder.value
        }
      )
    ],
    updatedAt: timestamp
  };

  return ok(nextState);
}

export function resetFinalLineupSide(
  state: DraftState,
  options: DraftLineupOperationOptions
): DraftEngineResult<DraftState> {
  const timestamp = getNow(options);

  if (!isDraftLineupSide(options.side)) {
    return fail({
      code: "draft-lineup-side-invalid",
      message: "Final lineup side must be BLUE or RED.",
      details: { side: options.side ?? null }
    });
  }

  const mutableState = ensureMutableLineup(state, timestamp, options.operatorId);

  if (!mutableState.ok) {
    return fail(mutableState.error);
  }

  const lockedPicks = validateSideReady(mutableState.value, options.side);

  if (!lockedPicks.ok) {
    return fail(lockedPicks.error);
  }

  const defaultOrder = lockedPicks.value.map((action) => action.id);
  const before = summarizeLineup(mutableState.value);
  const finalLineup: DraftFinalLineupState = {
    ...(mutableState.value.finalLineup as DraftFinalLineupState),
    status: "ACTIVE",
    finalLineupBySide: {
      ...(mutableState.value.finalLineup?.finalLineupBySide ?? getDefaultFinalLineupBySide(mutableState.value)),
      [options.side]: defaultOrder
    },
    updatedAt: timestamp
  };
  const nextState: DraftState = {
    ...mutableState.value,
    finalLineup,
    history: [
      ...mutableState.value.history,
      createHistoryEntry(
        mutableState.value,
        "FINAL_LINEUP_RESET",
        timestamp,
        options.operatorId,
        before as unknown as JsonValue,
        summarizeLineup({ ...mutableState.value, finalLineup }) as unknown as JsonValue,
        {
          side: options.side,
          actionIds: defaultOrder
        }
      )
    ],
    updatedAt: timestamp
  };

  return ok(nextState);
}

function validateCurrentLineupOrders(state: DraftState): DraftEngineResult<undefined> {
  for (const side of DRAFT_LINEUP_SIDES) {
    const lockedPicks = validateSideReady(state, side);

    if (!lockedPicks.ok) {
      return fail(lockedPicks.error);
    }

    const order = getFinalLineupActionIdsForSide(state, side);
    const orderValidation = validateActionOrder(side, lockedPicks.value, order);

    if (!orderValidation.ok) {
      return fail(orderValidation.error);
    }
  }

  return ok(undefined);
}

export function confirmFinalLineup(
  state: DraftState,
  options: DraftLineupOperationOptions = {}
): DraftEngineResult<DraftState> {
  if (!options.confirmed) {
    return fail({
      code: "draft-confirmation-required",
      message: "Confirming final lineup requires explicit confirmation.",
      details: { operation: "confirmFinalLineup" }
    });
  }

  const timestamp = getNow(options);
  const mutableState = ensureMutableLineup(state, timestamp, options.operatorId);

  if (!mutableState.ok) {
    return fail(mutableState.error);
  }

  const validation = validateCurrentLineupOrders(mutableState.value);

  if (!validation.ok) {
    return fail(validation.error);
  }

  const calculatedTimer = calculateTimerState({ timer: mutableState.value.timer, now: timestamp });

  if (!calculatedTimer.ok) {
    return fail(calculatedTimer.error);
  }

  const before = summarizeLineup(mutableState.value);
  const finalLineup: DraftFinalLineupState = {
    ...(mutableState.value.finalLineup as DraftFinalLineupState),
    status: "CONFIRMED",
    finalLineupBySide: {
      BLUE: getFinalLineupActionIdsForSide(mutableState.value, "BLUE"),
      RED: getFinalLineupActionIdsForSide(mutableState.value, "RED")
    },
    lineupConfirmedAt: timestamp,
    confirmedByOperatorId: options.operatorId,
    updatedAt: timestamp
  };
  const timer = {
    ...calculatedTimer.value,
    isRunning: false,
    phaseStartedAt: undefined,
    pausedAt: undefined
  };
  const nextState: DraftState = {
    ...mutableState.value,
    timer,
    finalLineup,
    history: [
      ...mutableState.value.history,
      createHistoryEntry(
        mutableState.value,
        "FINAL_LINEUP_CONFIRMED",
        timestamp,
        options.operatorId,
        before as unknown as JsonValue,
        {
          finalLineup,
          timer
        } as unknown as JsonValue
      )
    ],
    updatedAt: timestamp
  };

  return ok(nextState);
}

export function isFinalLineupConfirmed(state: DraftState): boolean {
  return state.finalLineup?.status === "CONFIRMED";
}
