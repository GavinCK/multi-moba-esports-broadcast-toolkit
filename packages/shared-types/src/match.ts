import type { JsonObject } from "./json";

export type GameCode = "generic-moba" | "lol" | "aov" | "hok" | string;

export type MatchFormat = "BO1" | "BO3" | "BO5" | "BO7";

export type TeamSide = "BLUE" | "RED" | "LEFT" | "RIGHT";

export interface EventInfo {
  id: string;
  name: string;
  shortName?: string;
  organizer?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  timezone: string;
  defaultLanguage: string;
  gameCodes: GameCode[];
  metadata?: JsonObject;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  countryCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  metadata?: JsonObject;
}

export interface Player {
  id: string;
  teamId: string;
  displayName: string;
  realName?: string;
  role?: string;
  nationality?: string;
  photoUrl?: string;
  metadata?: JsonObject;
}

export type SponsorSlot =
  | "PRESENTED_BY"
  | "DRAFT"
  | "SCORE_BUG"
  | "LOWER_THIRD"
  | "REPLAY"
  | "OBJECTIVE"
  | "MVP"
  | "BREAK_SCREEN";

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  slots: SponsorSlot[];
  websiteUrl?: string;
  metadata?: JsonObject;
}

export type MatchStatus =
  | "SCHEDULED"
  | "READY"
  | "LIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export interface Match {
  id: string;
  eventId: string;
  gameCode: GameCode;
  title: string;
  format: MatchFormat;
  teams: {
    blue: string;
    red: string;
  };
  score: {
    blue: number;
    red: number;
  };
  currentGameNumber: number;
  status: MatchStatus;
  scheduledStartTime?: string;
  metadata?: JsonObject;
}

export type GameStatus =
  | "NOT_STARTED"
  | "DRAFT_READY"
  | "DRAFT_LIVE"
  | "DRAFT_COMPLETE"
  | "LOADING"
  | "GAME_LIVE"
  | "PAUSED"
  | "POST_GAME"
  | "COMPLETED";

export interface GameInstance {
  id: string;
  matchId: string;
  gameNumber: number;
  gameCode: GameCode;
  blueTeamId: string;
  redTeamId: string;
  winnerTeamId?: string;
  draftId?: string;
  status: GameStatus;
  startedAt?: string;
  completedAt?: string;
  metadata?: JsonObject;
}
