import type { DraftAction, DraftActionType } from "@mmbt/shared-types";

export type DraftActionLabelCasing = "title" | "upper";

function formatSide(team: DraftAction["team"] | string | undefined): string {
  switch (team) {
    case "BLUE":
      return "Blue";
    case "RED":
      return "Red";
    case "NONE":
      return "No Side";
    default:
      return "Unknown";
  }
}

function formatActionType(type: DraftActionType | string | undefined): string {
  switch (type) {
    case "BAN":
      return "Ban";
    case "PICK":
      return "Pick";
    case "BREAK":
      return "Break";
    case "SIDE_SELECTION":
      return "Side Selection";
    default:
      return "Action";
  }
}

export function getDraftActionOrdinal(action: DraftAction, actions: readonly DraftAction[]): number {
  const actionIndex = actions.findIndex((candidate) => candidate.id === action.id);

  if (actionIndex >= 0) {
    return (
      actions
        .slice(0, actionIndex + 1)
        .filter((candidate) => candidate.team === action.team && candidate.type === action.type).length || 1
    );
  }

  return Math.max(1, action.slotIndex + 1);
}

export function formatDraftActionSlotLabel(
  action: DraftAction | null | undefined,
  actions: readonly DraftAction[],
  options: { casing?: DraftActionLabelCasing } = {}
): string {
  if (!action) {
    return options.casing === "upper" ? "NO ACTION SELECTED" : "No Action Selected";
  }

  const label = `${formatSide(action.team)} ${formatActionType(action.type)} ${getDraftActionOrdinal(
    action,
    actions
  )}`;

  return options.casing === "upper" ? label.toLocaleUpperCase("en-US") : label;
}
