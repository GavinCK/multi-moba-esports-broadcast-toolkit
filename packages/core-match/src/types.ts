import type {
  EventInfo,
  GameInstance,
  Match,
  Player,
  Sponsor,
  Team
} from "@mmbt/shared-types";

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ValidationResult<T> =
  | {
      valid: true;
      value: T;
      issues: [];
    }
  | {
      valid: false;
      value?: undefined;
      issues: ValidationIssue[];
    };

export interface MatchBundle {
  event: EventInfo;
  teams: Team[];
  players: Player[];
  sponsors: Sponsor[];
  matches: Match[];
  games: GameInstance[];
}

export interface MatchTeams {
  blue: Team;
  red: Team;
}
