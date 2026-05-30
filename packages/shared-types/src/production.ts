import type { JsonValue } from "./json";

export type ProductionState =
  | "PRE_SHOW"
  | "OPENING"
  | "TEAM_INTRO"
  | "DRAFT_READY"
  | "DRAFT_LIVE"
  | "DRAFT_COMPLETE"
  | "LOADING_SCREEN"
  | "GAME_LIVE"
  | "PAUSE"
  | "TECH_PAUSE"
  | "POST_GAME"
  | "MVP"
  | "BREAK"
  | "NEXT_GAME"
  | "MATCH_COMPLETE";

export type GraphicType =
  | "DRAFT_OVERLAY"
  | "SCORE_BUG"
  | "LOWER_THIRD"
  | "SPONSOR_BUG"
  | "PAUSE_SCREEN"
  | "BREAK_SCREEN"
  | "POST_GAME_STATS"
  | "MVP"
  | "EMERGENCY";

export type GraphicTakeStatus = "IDLE" | "PREVIEW" | "ON_PROGRAM";

export interface GraphicTakeState {
  id: string;
  graphicType: GraphicType;
  previewPayload: JsonValue | null;
  programPayload: JsonValue | null;
  status: GraphicTakeStatus;
  updatedAt?: string;
  updatedByOperatorId?: string;
}
