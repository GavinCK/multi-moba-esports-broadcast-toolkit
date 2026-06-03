import type {
  GameStatus,
  MatchFormat,
  MatchStatus,
  SeriesFormat,
  SponsorSlot,
  TeamSide
} from "@mmbt/shared-types";

export const MATCH_FORMATS = ["BO1", "BO3", "BO5", "BO7"] as const satisfies readonly MatchFormat[];

export const SERIES_FORMATS = ["BO1", "BO3", "BO5"] as const satisfies readonly SeriesFormat[];

export const TEAM_SIDES = ["BLUE", "RED", "LEFT", "RIGHT"] as const satisfies readonly TeamSide[];

export const MATCH_STATUSES = [
  "SCHEDULED",
  "READY",
  "LIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED"
] as const satisfies readonly MatchStatus[];

export const GAME_STATUSES = [
  "NOT_STARTED",
  "DRAFT_READY",
  "DRAFT_LIVE",
  "DRAFT_COMPLETE",
  "LOADING",
  "GAME_LIVE",
  "PAUSED",
  "POST_GAME",
  "COMPLETED"
] as const satisfies readonly GameStatus[];

export const SPONSOR_SLOTS = [
  "PRESENTED_BY",
  "DRAFT",
  "SCORE_BUG",
  "LOWER_THIRD",
  "REPLAY",
  "OBJECTIVE",
  "MVP",
  "BREAK_SCREEN"
] as const satisfies readonly SponsorSlot[];
