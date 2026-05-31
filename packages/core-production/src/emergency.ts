import { DEFAULT_EMERGENCY_MESSAGE } from "./constants.js";
import { fail, ok, type ProductionEngineResult } from "./errors.js";
import type {
  EnterEmergencyModeInput,
  ExitEmergencyModeInput,
  ProductionRuntimeState
} from "./types.js";

function getNow(options?: { now?: string }): string {
  return options?.now ?? new Date().toISOString();
}

function normalizeNonEmptyString(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function enterEmergencyMode(
  state: ProductionRuntimeState,
  input: EnterEmergencyModeInput = {}
): ProductionEngineResult<ProductionRuntimeState> {
  if (!input.confirmed) {
    return fail({
      code: "emergency-confirmation-required",
      message: "Entering emergency mode requires explicit confirmation.",
      details: { operation: "enterEmergencyMode" }
    });
  }

  if (state.emergency.active) {
    return fail({
      code: "emergency-already-active",
      message: "Emergency mode is already active."
    });
  }

  const message =
    normalizeNonEmptyString(input.message) ?? DEFAULT_EMERGENCY_MESSAGE;
  const reason = normalizeNonEmptyString(input.reason);
  const timestamp = getNow(input);

  return ok({
    ...state,
    emergency: {
      active: true,
      message,
      reason,
      triggeredAt: timestamp,
      triggeredByOperatorId: input.operatorId,
      clearedAt: undefined,
      clearedByOperatorId: undefined
    },
    updatedAt: timestamp,
    updatedByOperatorId: input.operatorId
  });
}

export function exitEmergencyMode(
  state: ProductionRuntimeState,
  input: ExitEmergencyModeInput = {}
): ProductionEngineResult<ProductionRuntimeState> {
  if (!input.confirmed) {
    return fail({
      code: "emergency-confirmation-required",
      message: "Exiting emergency mode requires explicit confirmation.",
      details: { operation: "exitEmergencyMode" }
    });
  }

  if (!state.emergency.active) {
    return fail({
      code: "emergency-not-active",
      message: "Cannot exit emergency mode because it is not active."
    });
  }

  const timestamp = getNow(input);

  return ok({
    ...state,
    emergency: {
      ...state.emergency,
      active: false,
      clearedAt: timestamp,
      clearedByOperatorId: input.operatorId
    },
    updatedAt: timestamp,
    updatedByOperatorId: input.operatorId
  });
}

export const triggerEmergency = enterEmergencyMode;

export const clearEmergency = exitEmergencyMode;
