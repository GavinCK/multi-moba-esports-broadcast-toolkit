import type {
  GraphicTakeState,
  JsonValue,
  ProductionState
} from "@mmbt/shared-types";

import type {
  ProductionRuntimeState,
  ProductionStatusCategory
} from "./types";

export function getCurrentProductionStatus(
  state: ProductionRuntimeState
): ProductionState {
  return state.status;
}

export function getActiveMatchId(state: ProductionRuntimeState): string | null {
  return state.activeMatchId;
}

export function getActiveGameNumber(
  state: ProductionRuntimeState
): number | null {
  return state.activeGameNumber;
}

export function getActiveDraftId(state: ProductionRuntimeState): string | null {
  return state.activeDraftId;
}

export function getGraphicTakeState(
  state: ProductionRuntimeState
): GraphicTakeState {
  return state.graphicTakeState;
}

export function getPreviewGraphicPayload(
  state: ProductionRuntimeState
): JsonValue | null {
  return state.graphicTakeState.previewPayload;
}

export function getProgramGraphicPayload(
  state: ProductionRuntimeState
): JsonValue | null {
  return state.graphicTakeState.programPayload;
}

export function areOverlaysReadOnly(state: ProductionRuntimeState): boolean {
  return state.overlaySafety.readOnly && !state.overlaySafety.mutationAllowed;
}

export function areOverlaysSafeReadOnly(
  state: ProductionRuntimeState
): boolean {
  return areOverlaysReadOnly(state);
}

export function isProductionInEmergencyMode(
  state: ProductionRuntimeState
): boolean {
  return state.emergency.active;
}

export function getProductionStatusCategory(
  state: ProductionRuntimeState
): ProductionStatusCategory {
  if (state.emergency.active) {
    return "EMERGENCY";
  }

  switch (state.status) {
    case "DRAFT_READY":
    case "DRAFT_LIVE":
    case "DRAFT_COMPLETE":
      return "DRAFT";
    case "LOADING_SCREEN":
    case "GAME_LIVE":
    case "PAUSE":
    case "TECH_PAUSE":
      return "IN_GAME";
    case "BREAK":
    case "NEXT_GAME":
      return "BREAK";
    case "POST_GAME":
    case "MVP":
      return "POST_GAME";
    case "MATCH_COMPLETE":
      return "COMPLETED";
    case "PRE_SHOW":
    case "OPENING":
    case "TEAM_INTRO":
      return "PRE_SHOW";
    default:
      return "PRE_SHOW";
  }
}
