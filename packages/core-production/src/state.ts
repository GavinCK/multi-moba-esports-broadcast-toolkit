import type { GraphicTakeState } from "@mmbt/shared-types";

import {
  DEFAULT_GRAPHIC_TAKE_STATE_ID,
  DEFAULT_GRAPHIC_TYPE,
  DEFAULT_PRODUCTION_STATE_ID
} from "./constants.js";
import { fail, ok, type ProductionEngineResult } from "./errors.js";
import type {
  CreateInitialProductionStateInput,
  ProductionRuntimeState,
  SetProductionStateInput
} from "./types.js";
import {
  isLiveProductionStatus,
  isProductionStatus,
  validateProductionTransition
} from "./validation.js";

function getNow(options?: { now?: string }): string {
  return options?.now ?? new Date().toISOString();
}

function createGraphicTakeState(
  timestamp: string,
  input: CreateInitialProductionStateInput
): GraphicTakeState {
  return {
    id: DEFAULT_GRAPHIC_TAKE_STATE_ID,
    graphicType: input.initialGraphicType ?? DEFAULT_GRAPHIC_TYPE,
    previewPayload: null,
    programPayload: null,
    status: "IDLE",
    updatedAt: timestamp,
    updatedByOperatorId: input.operatorId
  };
}

function validateGameNumber(
  gameNumber: number | null | undefined
): ProductionEngineResult<undefined> {
  if (gameNumber === undefined || gameNumber === null) {
    return ok(undefined);
  }

  if (!Number.isInteger(gameNumber) || gameNumber < 1) {
    return fail({
      code: "production-invalid-game-number",
      message: "Active game number must be a positive integer when provided.",
      details: { activeGameNumber: gameNumber }
    });
  }

  return ok(undefined);
}

export function createInitialProductionState(
  input: CreateInitialProductionStateInput = {}
): ProductionRuntimeState {
  const timestamp = getNow(input);

  return {
    id: input.id ?? DEFAULT_PRODUCTION_STATE_ID,
    status: input.status ?? "PRE_SHOW",
    activeMatchId: input.activeMatchId ?? null,
    activeGameNumber: input.activeGameNumber ?? null,
    activeDraftId: input.activeDraftId ?? null,
    graphicTakeState: createGraphicTakeState(timestamp, input),
    emergency: {
      active: false,
      message: null
    },
    overlaySafety: {
      readOnly: true,
      mutationAllowed: false
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedByOperatorId: input.operatorId,
    metadata: input.metadata
  };
}

export function setProductionState(
  state: ProductionRuntimeState,
  input: SetProductionStateInput
): ProductionEngineResult<ProductionRuntimeState> {
  if (!isProductionStatus(input.status)) {
    return fail({
      code: "production-invalid-state",
      message: "Requested production status is not supported.",
      details: { requestedStatus: input.status }
    });
  }

  const transition = validateProductionTransition(state.status, input.status);

  if (!transition.valid) {
    return fail({
      code: transition.code ?? "production-invalid-transition",
      message: transition.reason ?? "Production status transition is invalid.",
      details: { currentStatus: state.status, requestedStatus: input.status }
    });
  }

  const gameNumberValidation = validateGameNumber(input.activeGameNumber);

  if (!gameNumberValidation.ok) {
    return fail(gameNumberValidation.error);
  }

  const changesActiveMatch =
    input.activeMatchId !== undefined &&
    input.activeMatchId !== state.activeMatchId;

  if (
    changesActiveMatch &&
    isLiveProductionStatus(state.status) &&
    !input.confirmed
  ) {
    return fail({
      code: "production-confirmation-required",
      message:
        "Switching the active match during a live production state requires explicit confirmation.",
      details: {
        currentStatus: state.status,
        currentMatchId: state.activeMatchId,
        requestedMatchId: input.activeMatchId ?? null
      }
    });
  }

  const timestamp = getNow(input);

  return ok({
    ...state,
    status: input.status,
    activeMatchId:
      input.activeMatchId === undefined
        ? state.activeMatchId
        : input.activeMatchId,
    activeGameNumber:
      input.activeGameNumber === undefined
        ? state.activeGameNumber
        : input.activeGameNumber,
    activeDraftId:
      input.activeDraftId === undefined
        ? state.activeDraftId
        : input.activeDraftId,
    updatedAt: timestamp,
    updatedByOperatorId: input.operatorId
  });
}
