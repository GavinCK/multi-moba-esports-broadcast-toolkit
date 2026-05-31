import type { GraphicType, ProductionState } from "@mmbt/shared-types";

export const PRODUCTION_STATUSES = [
  "PRE_SHOW",
  "OPENING",
  "TEAM_INTRO",
  "DRAFT_READY",
  "DRAFT_LIVE",
  "DRAFT_COMPLETE",
  "LOADING_SCREEN",
  "GAME_LIVE",
  "PAUSE",
  "TECH_PAUSE",
  "POST_GAME",
  "MVP",
  "BREAK",
  "NEXT_GAME",
  "MATCH_COMPLETE"
] as const satisfies readonly ProductionState[];

export const GRAPHIC_TYPES = [
  "DRAFT_OVERLAY",
  "SCORE_BUG",
  "LOWER_THIRD",
  "SPONSOR_BUG",
  "PAUSE_SCREEN",
  "BREAK_SCREEN",
  "POST_GAME_STATS",
  "MVP",
  "EMERGENCY"
] as const satisfies readonly GraphicType[];

export const ALLOWED_PRODUCTION_TRANSITIONS = {
  PRE_SHOW: ["OPENING", "TEAM_INTRO", "DRAFT_READY", "BREAK", "MATCH_COMPLETE"],
  OPENING: ["TEAM_INTRO", "DRAFT_READY", "BREAK", "PRE_SHOW"],
  TEAM_INTRO: ["DRAFT_READY", "BREAK", "PRE_SHOW"],
  DRAFT_READY: ["DRAFT_LIVE", "BREAK", "PRE_SHOW"],
  DRAFT_LIVE: ["DRAFT_COMPLETE", "PAUSE", "TECH_PAUSE", "BREAK"],
  DRAFT_COMPLETE: ["LOADING_SCREEN", "GAME_LIVE", "POST_GAME", "NEXT_GAME", "BREAK"],
  LOADING_SCREEN: ["GAME_LIVE", "TECH_PAUSE", "BREAK"],
  GAME_LIVE: ["PAUSE", "TECH_PAUSE", "POST_GAME", "BREAK"],
  PAUSE: ["DRAFT_LIVE", "GAME_LIVE", "TECH_PAUSE", "BREAK"],
  TECH_PAUSE: ["DRAFT_LIVE", "GAME_LIVE", "PAUSE", "BREAK"],
  POST_GAME: ["MVP", "BREAK", "NEXT_GAME", "MATCH_COMPLETE"],
  MVP: ["BREAK", "NEXT_GAME", "MATCH_COMPLETE"],
  BREAK: [
    "PRE_SHOW",
    "OPENING",
    "TEAM_INTRO",
    "DRAFT_READY",
    "DRAFT_LIVE",
    "LOADING_SCREEN",
    "GAME_LIVE",
    "POST_GAME",
    "NEXT_GAME",
    "MATCH_COMPLETE"
  ],
  NEXT_GAME: ["DRAFT_READY", "BREAK", "MATCH_COMPLETE"],
  MATCH_COMPLETE: ["PRE_SHOW"]
} as const satisfies Record<ProductionState, readonly ProductionState[]>;

export const LIVE_PRODUCTION_STATUSES = [
  "DRAFT_LIVE",
  "DRAFT_COMPLETE",
  "LOADING_SCREEN",
  "GAME_LIVE",
  "PAUSE",
  "TECH_PAUSE",
  "POST_GAME",
  "MVP"
] as const satisfies readonly ProductionState[];

export const DEFAULT_PRODUCTION_STATE_ID = "production:local";

export const DEFAULT_GRAPHIC_TAKE_STATE_ID = "graphics:main";

export const DEFAULT_GRAPHIC_TYPE: GraphicType = "DRAFT_OVERLAY";

export const DEFAULT_EMERGENCY_MESSAGE = "Technical Pause";
