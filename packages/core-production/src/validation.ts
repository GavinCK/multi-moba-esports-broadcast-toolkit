import type { GraphicType, ProductionState } from "@mmbt/shared-types";

import {
  ALLOWED_PRODUCTION_TRANSITIONS,
  GRAPHIC_TYPES,
  LIVE_PRODUCTION_STATUSES,
  PRODUCTION_STATUSES
} from "./constants";
import type { ProductionTransitionValidation } from "./types";

export function isProductionStatus(value: unknown): value is ProductionState {
  return (
    typeof value === "string" &&
    (PRODUCTION_STATUSES as readonly string[]).includes(value)
  );
}

export function isGraphicType(value: unknown): value is GraphicType {
  return (
    typeof value === "string" &&
    (GRAPHIC_TYPES as readonly string[]).includes(value)
  );
}

export function isLiveProductionStatus(status: ProductionState): boolean {
  return (LIVE_PRODUCTION_STATUSES as readonly string[]).includes(status);
}

export function canTransitionProductionStatus(
  from: ProductionState,
  to: ProductionState
): boolean {
  if (from === to) {
    return true;
  }

  const allowedTransitions =
    ALLOWED_PRODUCTION_TRANSITIONS as Record<
      ProductionState,
      readonly ProductionState[]
    >;

  return allowedTransitions[from].includes(to);
}

export function validateProductionTransition(
  from: ProductionState,
  to: ProductionState
): ProductionTransitionValidation {
  if (!canTransitionProductionStatus(from, to)) {
    return {
      valid: false,
      from,
      to,
      code: "production-invalid-transition",
      reason: `Cannot transition production status from ${from} to ${to}.`
    };
  }

  return {
    valid: true,
    from,
    to
  };
}
