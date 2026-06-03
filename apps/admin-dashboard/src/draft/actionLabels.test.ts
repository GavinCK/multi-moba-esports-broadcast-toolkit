import type { DraftAction } from "@mmbt/shared-types";
import { describe, expect, it } from "vitest";

import { formatDraftActionSlotLabel, getDraftActionOrdinal } from "./actionLabels";

function createAction(input: {
  id: string;
  phaseId: string;
  type: DraftAction["type"];
  team: DraftAction["team"];
  slotIndex?: number;
}): DraftAction {
  return {
    id: input.id,
    phaseId: input.phaseId,
    type: input.type,
    team: input.team,
    slotIndex: input.slotIndex ?? 0,
    heroId: null,
    status: "PENDING",
    createdAt: "2026-06-01T00:00:00.000Z"
  };
}

describe("dashboard draft action labels", () => {
  it("uses the side/action ordinal across all draft actions", () => {
    const actions = [
      createAction({ id: "ban-blue-1:slot-0", phaseId: "ban-blue-1", type: "BAN", team: "BLUE" }),
      createAction({ id: "ban-red-1:slot-0", phaseId: "ban-red-1", type: "BAN", team: "RED" }),
      createAction({ id: "ban-blue-2:slot-0", phaseId: "ban-blue-2", type: "BAN", team: "BLUE" }),
      createAction({ id: "ban-red-2:slot-0", phaseId: "ban-red-2", type: "BAN", team: "RED" }),
      createAction({ id: "ban-blue-3:slot-0", phaseId: "ban-blue-3", type: "BAN", team: "BLUE" }),
      createAction({ id: "ban-red-3:slot-0", phaseId: "ban-red-3", type: "BAN", team: "RED" }),
      createAction({ id: "pick-blue-1:slot-0", phaseId: "pick-blue-1", type: "PICK", team: "BLUE" }),
      createAction({ id: "pick-red-1-2:slot-0", phaseId: "pick-red-1-2", type: "PICK", team: "RED", slotIndex: 0 }),
      createAction({ id: "pick-red-1-2:slot-1", phaseId: "pick-red-1-2", type: "PICK", team: "RED", slotIndex: 1 }),
      createAction({ id: "pick-blue-2-3:slot-0", phaseId: "pick-blue-2-3", type: "PICK", team: "BLUE", slotIndex: 0 }),
      createAction({ id: "pick-blue-2-3:slot-1", phaseId: "pick-blue-2-3", type: "PICK", team: "BLUE", slotIndex: 1 }),
      createAction({ id: "pick-red-3:slot-0", phaseId: "pick-red-3", type: "PICK", team: "RED" }),
      createAction({ id: "ban-red-4:slot-0", phaseId: "ban-red-4", type: "BAN", team: "RED" }),
      createAction({ id: "ban-blue-4:slot-0", phaseId: "ban-blue-4", type: "BAN", team: "BLUE" }),
      createAction({ id: "ban-red-5:slot-0", phaseId: "ban-red-5", type: "BAN", team: "RED" }),
      createAction({ id: "ban-blue-5:slot-0", phaseId: "ban-blue-5", type: "BAN", team: "BLUE" }),
      createAction({ id: "pick-red-4:slot-0", phaseId: "pick-red-4", type: "PICK", team: "RED" }),
      createAction({ id: "pick-blue-4-5:slot-0", phaseId: "pick-blue-4-5", type: "PICK", team: "BLUE", slotIndex: 0 }),
      createAction({ id: "pick-blue-4-5:slot-1", phaseId: "pick-blue-4-5", type: "PICK", team: "BLUE", slotIndex: 1 }),
      createAction({ id: "pick-red-5:slot-0", phaseId: "pick-red-5", type: "PICK", team: "RED" })
    ];
    const labels = actions.map((action) =>
      formatDraftActionSlotLabel(action, actions, { casing: "upper" })
    );

    expect(labels).toContain("BLUE BAN 5");
    expect(labels).toContain("RED BAN 5");
    expect(labels).toContain("BLUE PICK 5");
    expect(labels).toContain("RED PICK 5");
    expect(getDraftActionOrdinal(actions[17] as DraftAction, actions)).toBe(4);
    expect(getDraftActionOrdinal(actions[18] as DraftAction, actions)).toBe(5);
    expect(labels.filter((label) => label === "BLUE PICK 1")).toHaveLength(1);
    expect(labels.filter((label) => label === "BLUE PICK 5")).toHaveLength(1);
  });
});
