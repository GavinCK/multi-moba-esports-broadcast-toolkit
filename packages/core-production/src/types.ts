import type {
  GraphicTakeState,
  GraphicType,
  JsonObject,
  JsonValue,
  ProductionState
} from "@mmbt/shared-types";

export type ProductionStatusCategory =
  | "PRE_SHOW"
  | "DRAFT"
  | "IN_GAME"
  | "BREAK"
  | "POST_GAME"
  | "COMPLETED"
  | "EMERGENCY";

export interface ProductionEmergencyState {
  active: boolean;
  message: string | null;
  reason?: string;
  triggeredAt?: string;
  triggeredByOperatorId?: string;
  clearedAt?: string;
  clearedByOperatorId?: string;
}

export interface ProductionOverlaySafetyState {
  readOnly: true;
  mutationAllowed: false;
}

export interface ProductionRuntimeState {
  id: string;
  status: ProductionState;
  activeMatchId: string | null;
  activeGameNumber: number | null;
  activeDraftId: string | null;
  graphicTakeState: GraphicTakeState;
  emergency: ProductionEmergencyState;
  overlaySafety: ProductionOverlaySafetyState;
  createdAt: string;
  updatedAt: string;
  updatedByOperatorId?: string;
  metadata?: JsonObject;
}

export interface CreateInitialProductionStateInput {
  id?: string;
  status?: ProductionState;
  activeMatchId?: string | null;
  activeGameNumber?: number | null;
  activeDraftId?: string | null;
  initialGraphicType?: GraphicType;
  now?: string;
  operatorId?: string;
  metadata?: JsonObject;
}

export interface ProductionOperationOptions {
  now?: string;
  operatorId?: string;
}

export interface ConfirmedProductionOperationOptions
  extends ProductionOperationOptions {
  confirmed?: boolean;
}

export interface SetProductionStateInput
  extends ConfirmedProductionOperationOptions {
  status: ProductionState;
  activeMatchId?: string | null;
  activeGameNumber?: number | null;
  activeDraftId?: string | null;
}

export interface PreviewGraphicInput extends ProductionOperationOptions {
  graphicType: GraphicType;
  payload: JsonValue;
}

export interface EnterEmergencyModeInput
  extends ConfirmedProductionOperationOptions {
  message?: string;
  reason?: string;
}

export type ExitEmergencyModeInput = ConfirmedProductionOperationOptions;

export interface ProductionTransitionValidation {
  valid: boolean;
  from: ProductionState;
  to: ProductionState;
  code?: string;
  reason?: string;
}
