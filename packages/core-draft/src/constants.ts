import type {
  DraftActionStatus,
  DraftActionType,
  DraftPhaseTeam,
  DraftStatus,
  TeamSide
} from "@mmbt/shared-types";

export const DRAFT_ACTION_TYPES = ["BAN", "PICK", "SIDE_SELECTION", "BREAK"] as const satisfies readonly DraftActionType[];

export const SUPPORTED_PHASE_TYPES = ["BAN", "PICK", "BREAK"] as const satisfies readonly DraftActionType[];

export const DRAFT_PHASE_TEAMS = [
  "BLUE",
  "RED",
  "LEFT",
  "RIGHT",
  "AUTO",
  "NONE"
] as const satisfies readonly DraftPhaseTeam[];

export const ACTION_SLOT_TEAMS = ["BLUE", "RED", "LEFT", "RIGHT", "NONE"] as const satisfies readonly (TeamSide | "NONE")[];

export const TEAM_SIDES = ["BLUE", "RED", "LEFT", "RIGHT"] as const satisfies readonly TeamSide[];

export const DRAFT_STATUSES = [
  "NOT_STARTED",
  "READY",
  "LIVE",
  "PAUSED",
  "COMPLETE",
  "CANCELLED"
] as const satisfies readonly DraftStatus[];

export const COMPLETE_ACTION_STATUSES = [
  "LOCKED",
  "SKIPPED",
  "CANCELLED"
] as const satisfies readonly DraftActionStatus[];
