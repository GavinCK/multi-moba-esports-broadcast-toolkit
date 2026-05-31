import { describe, expect, it } from "vitest";
import {
  areOverlaysReadOnly,
  clearEmergency,
  clearGraphic,
  createInitialProductionState,
  enterEmergencyMode,
  getActiveDraftId,
  getActiveGameNumber,
  getActiveMatchId,
  getCurrentProductionStatus,
  getProductionStatusCategory,
  getProgramGraphicPayload,
  getPreviewGraphicPayload,
  isProductionInEmergencyMode,
  previewGraphic,
  setProductionState,
  takeGraphic,
  triggerEmergency,
  validateProductionTransition
} from "./index";

const CREATED_AT = "2026-05-30T12:00:00.000Z";
const UPDATED_AT = "2026-05-30T12:01:00.000Z";

function expectOk<TValue>(result: { ok: true; value: TValue } | { ok: false }): TValue {
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error("Expected operation to succeed.");
  }

  return result.value;
}

function expectFailure(
  result: { ok: true } | { ok: false; error: { code: string } },
  code: string
): void {
  expect(result.ok).toBe(false);

  if (result.ok) {
    throw new Error("Expected operation to fail.");
  }

  expect(result.error.code).toBe(code);
}

describe("production state machine", () => {
  it("creates a serializable manual-first initial state", () => {
    const state = createInitialProductionState({
      now: CREATED_AT,
      activeMatchId: "match-1",
      activeGameNumber: 1,
      activeDraftId: "draft-1",
      operatorId: "producer-1"
    });

    expect(state.status).toBe("PRE_SHOW");
    expect(state.graphicTakeState.status).toBe("IDLE");
    expect(state.emergency.active).toBe(false);
    expect(state.overlaySafety).toEqual({
      readOnly: true,
      mutationAllowed: false
    });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it("allows valid production status transitions and updates active IDs", () => {
    const state = createInitialProductionState({
      now: CREATED_AT,
      activeMatchId: "match-1"
    });

    const draftReady = expectOk(
      setProductionState(state, {
        status: "DRAFT_READY",
        activeGameNumber: 1,
        activeDraftId: "draft-1",
        now: UPDATED_AT,
        operatorId: "producer-1"
      })
    );

    expect(getCurrentProductionStatus(draftReady)).toBe("DRAFT_READY");
    expect(getActiveMatchId(draftReady)).toBe("match-1");
    expect(getActiveGameNumber(draftReady)).toBe(1);
    expect(getActiveDraftId(draftReady)).toBe("draft-1");
    expect(draftReady.updatedAt).toBe(UPDATED_AT);
  });

  it("rejects invalid production status transitions without mutating previous state", () => {
    const state = createInitialProductionState({ now: CREATED_AT });
    const result = setProductionState(state, {
      status: "GAME_LIVE",
      now: UPDATED_AT
    });

    expectFailure(result, "production-invalid-transition");
    expect(state.status).toBe("PRE_SHOW");
  });

  it("reports transition validation details", () => {
    expect(validateProductionTransition("PRE_SHOW", "DRAFT_READY")).toEqual({
      valid: true,
      from: "PRE_SHOW",
      to: "DRAFT_READY"
    });

    expect(validateProductionTransition("PRE_SHOW", "GAME_LIVE")).toMatchObject({
      valid: false,
      from: "PRE_SHOW",
      to: "GAME_LIVE",
      code: "production-invalid-transition"
    });
  });

  it("requires confirmation before switching active match during live state", () => {
    const draftLive = expectOk(
      setProductionState(
        createInitialProductionState({
          now: CREATED_AT,
          activeMatchId: "match-1"
        }),
        {
          status: "DRAFT_READY",
          activeGameNumber: 1,
          now: "2026-05-30T12:00:10.000Z"
        }
      )
    );
    const liveState = expectOk(
      setProductionState(draftLive, {
        status: "DRAFT_LIVE",
        now: "2026-05-30T12:00:20.000Z"
      })
    );

    const rejected = setProductionState(liveState, {
      status: "DRAFT_LIVE",
      activeMatchId: "match-2",
      now: UPDATED_AT
    });

    expectFailure(rejected, "production-confirmation-required");

    const confirmed = expectOk(
      setProductionState(liveState, {
        status: "DRAFT_LIVE",
        activeMatchId: "match-2",
        confirmed: true,
        now: UPDATED_AT
      })
    );

    expect(confirmed.activeMatchId).toBe("match-2");
  });
});

describe("preview and program graphics", () => {
  it("previews, takes, and clears graphics through deliberate helpers", () => {
    const state = createInitialProductionState({ now: CREATED_AT });
    const previewed = expectOk(
      previewGraphic(state, {
        graphicType: "DRAFT_OVERLAY",
        payload: { matchId: "match-1", draftId: "draft-1" },
        now: UPDATED_AT,
        operatorId: "producer-1"
      })
    );

    expect(previewed.graphicTakeState.status).toBe("PREVIEW");
    expect(getPreviewGraphicPayload(previewed)).toEqual({
      matchId: "match-1",
      draftId: "draft-1"
    });

    const takeRejected = takeGraphic(previewed, { now: UPDATED_AT });
    expectFailure(takeRejected, "graphics-confirmation-required");

    const onProgram = expectOk(
      takeGraphic(previewed, {
        confirmed: true,
        now: "2026-05-30T12:02:00.000Z"
      })
    );

    expect(onProgram.graphicTakeState.status).toBe("ON_PROGRAM");
    expect(getPreviewGraphicPayload(onProgram)).toBeNull();
    expect(getProgramGraphicPayload(onProgram)).toEqual({
      matchId: "match-1",
      draftId: "draft-1"
    });

    const clearRejected = clearGraphic(onProgram, { now: UPDATED_AT });
    expectFailure(clearRejected, "graphics-confirmation-required");

    const cleared = expectOk(
      clearGraphic(onProgram, {
        confirmed: true,
        now: "2026-05-30T12:03:00.000Z"
      })
    );

    expect(cleared.graphicTakeState.status).toBe("IDLE");
    expect(getProgramGraphicPayload(cleared)).toBeNull();
  });

  it("rejects non-serializable preview payloads", () => {
    const state = createInitialProductionState({ now: CREATED_AT });
    const result = previewGraphic(state, {
      graphicType: "SCORE_BUG",
      payload: { callback: () => "not-json" },
      now: UPDATED_AT
    });

    expectFailure(result, "graphics-invalid-payload");
    expect(state.graphicTakeState.previewPayload).toBeNull();
  });
});

describe("emergency mode", () => {
  it("enters emergency mode only with confirmation", () => {
    const state = createInitialProductionState({ now: CREATED_AT });
    const rejected = triggerEmergency(state, {
      message: "Stand by",
      now: UPDATED_AT
    });

    expectFailure(rejected, "emergency-confirmation-required");

    const emergencyState = expectOk(
      enterEmergencyMode(state, {
        confirmed: true,
        message: "Stand by",
        reason: "public technical pause",
        now: UPDATED_AT,
        operatorId: "producer-1"
      })
    );

    expect(isProductionInEmergencyMode(emergencyState)).toBe(true);
    expect(emergencyState.status).toBe("PRE_SHOW");
    expect(emergencyState.emergency.message).toBe("Stand by");
    expect(getProductionStatusCategory(emergencyState)).toBe("EMERGENCY");
  });

  it("exits emergency mode only with explicit confirmation", () => {
    const emergencyState = expectOk(
      enterEmergencyMode(createInitialProductionState({ now: CREATED_AT }), {
        confirmed: true,
        now: UPDATED_AT
      })
    );

    const rejected = clearEmergency(emergencyState, {
      now: "2026-05-30T12:02:00.000Z"
    });

    expectFailure(rejected, "emergency-confirmation-required");

    const cleared = expectOk(
      clearEmergency(emergencyState, {
        confirmed: true,
        now: "2026-05-30T12:03:00.000Z",
        operatorId: "producer-1"
      })
    );

    expect(isProductionInEmergencyMode(cleared)).toBe(false);
    expect(cleared.emergency.message).toBe("Technical Pause");
    expect(cleared.emergency.clearedAt).toBe("2026-05-30T12:03:00.000Z");
  });
});

describe("production selectors", () => {
  it("exposes read-only overlay safety and status categories", () => {
    const draftState = expectOk(
      setProductionState(createInitialProductionState({ now: CREATED_AT }), {
        status: "DRAFT_READY",
        activeMatchId: "match-1",
        activeGameNumber: 1,
        activeDraftId: "draft-1",
        now: UPDATED_AT
      })
    );

    expect(areOverlaysReadOnly(draftState)).toBe(true);
    expect(getProductionStatusCategory(draftState)).toBe("DRAFT");
  });
});
