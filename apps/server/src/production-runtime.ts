import type { ProductionRuntimeState } from "@mmbt/core-production";
import type { GraphicTakeStatus, GraphicType, JsonObject, JsonValue, ProductionState } from "@mmbt/shared-types";

export interface PublicGraphicTakeState {
  id: string;
  graphicType: GraphicType;
  previewPayload: JsonValue | null;
  programPayload: JsonValue | null;
  status: GraphicTakeStatus;
  updatedAt?: string;
}

export interface PublicProductionState {
  id: string;
  status: ProductionState;
  activeMatchId: string | null;
  activeGameNumber: number | null;
  activeDraftId: string | null;
  graphicTakeState: PublicGraphicTakeState;
  emergency: {
    active: boolean;
    message: string | null;
    triggeredAt?: string;
    clearedAt?: string;
  };
  overlaySafety: ProductionRuntimeState["overlaySafety"];
  createdAt: string;
  updatedAt: string;
}

function cloneJsonValue<TValue extends JsonValue | null>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue;
}

export function createProductionSnapshot(production: ProductionRuntimeState): PublicProductionState {
  return {
    id: production.id,
    status: production.status,
    activeMatchId: production.activeMatchId,
    activeGameNumber: production.activeGameNumber,
    activeDraftId: production.activeDraftId,
    graphicTakeState: {
      id: production.graphicTakeState.id,
      graphicType: production.graphicTakeState.graphicType,
      previewPayload: cloneJsonValue(production.graphicTakeState.previewPayload),
      programPayload: cloneJsonValue(production.graphicTakeState.programPayload),
      status: production.graphicTakeState.status,
      updatedAt: production.graphicTakeState.updatedAt
    },
    emergency: {
      active: production.emergency.active,
      message: production.emergency.message,
      triggeredAt: production.emergency.triggeredAt,
      clearedAt: production.emergency.clearedAt
    },
    overlaySafety: {
      ...production.overlaySafety
    },
    createdAt: production.createdAt,
    updatedAt: production.updatedAt
  };
}

export function createProductionMutationSummary(production: ProductionRuntimeState): JsonObject {
  return {
    id: production.id,
    status: production.status,
    activeMatchId: production.activeMatchId,
    activeGameNumber: production.activeGameNumber,
    activeDraftId: production.activeDraftId,
    graphicType: production.graphicTakeState.graphicType,
    graphicStatus: production.graphicTakeState.status,
    previewPayloadPresent: production.graphicTakeState.previewPayload !== null,
    programPayloadPresent: production.graphicTakeState.programPayload !== null,
    emergencyActive: production.emergency.active,
    emergencyMessage: production.emergency.message,
    updatedAt: production.updatedAt
  };
}
