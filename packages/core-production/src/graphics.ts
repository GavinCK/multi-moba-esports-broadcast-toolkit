import { fail, ok, type ProductionEngineResult } from "./errors";
import { isJsonValue } from "./json";
import type {
  ConfirmedProductionOperationOptions,
  PreviewGraphicInput,
  ProductionRuntimeState
} from "./types";
import { isGraphicType } from "./validation";

function getNow(options?: { now?: string }): string {
  return options?.now ?? new Date().toISOString();
}

export function previewGraphic(
  state: ProductionRuntimeState,
  input: PreviewGraphicInput
): ProductionEngineResult<ProductionRuntimeState> {
  if (!isGraphicType(input.graphicType)) {
    return fail({
      code: "graphics-invalid-type",
      message: "Requested graphic type is not supported.",
      details: { graphicType: input.graphicType }
    });
  }

  if (!isJsonValue(input.payload)) {
    return fail({
      code: "graphics-invalid-payload",
      message: "Graphic preview payload must be JSON-serializable."
    });
  }

  const timestamp = getNow(input);

  return ok({
    ...state,
    graphicTakeState: {
      ...state.graphicTakeState,
      graphicType: input.graphicType,
      previewPayload: input.payload,
      status: "PREVIEW",
      updatedAt: timestamp,
      updatedByOperatorId: input.operatorId
    },
    updatedAt: timestamp,
    updatedByOperatorId: input.operatorId
  });
}

export function takeGraphic(
  state: ProductionRuntimeState,
  options: ConfirmedProductionOperationOptions = {}
): ProductionEngineResult<ProductionRuntimeState> {
  if (!options.confirmed) {
    return fail({
      code: "graphics-confirmation-required",
      message: "Taking a graphic to Program requires explicit confirmation.",
      details: { operation: "takeGraphic" }
    });
  }

  if (state.graphicTakeState.previewPayload === null) {
    return fail({
      code: "graphics-preview-required",
      message: "Cannot take a graphic to Program without a preview payload."
    });
  }

  const timestamp = getNow(options);

  return ok({
    ...state,
    graphicTakeState: {
      ...state.graphicTakeState,
      previewPayload: null,
      programPayload: state.graphicTakeState.previewPayload,
      status: "ON_PROGRAM",
      updatedAt: timestamp,
      updatedByOperatorId: options.operatorId
    },
    updatedAt: timestamp,
    updatedByOperatorId: options.operatorId
  });
}

export function clearGraphic(
  state: ProductionRuntimeState,
  options: ConfirmedProductionOperationOptions = {}
): ProductionEngineResult<ProductionRuntimeState> {
  if (!options.confirmed) {
    return fail({
      code: "graphics-confirmation-required",
      message: "Clearing Program graphics requires explicit confirmation.",
      details: { operation: "clearGraphic" }
    });
  }

  if (state.graphicTakeState.programPayload === null) {
    return fail({
      code: "graphics-program-empty",
      message: "Cannot clear Program graphics because Program is already empty."
    });
  }

  const timestamp = getNow(options);

  return ok({
    ...state,
    graphicTakeState: {
      ...state.graphicTakeState,
      programPayload: null,
      status:
        state.graphicTakeState.previewPayload === null ? "IDLE" : "PREVIEW",
      updatedAt: timestamp,
      updatedByOperatorId: options.operatorId
    },
    updatedAt: timestamp,
    updatedByOperatorId: options.operatorId
  });
}
