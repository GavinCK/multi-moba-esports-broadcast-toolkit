import type { JsonObject, JsonValue } from "./json";
import type { GameCode, TeamSide } from "./match";

export type DraftActionType = "BAN" | "PICK" | "SIDE_SELECTION" | "BREAK";

export type DraftActionStatus =
  | "PENDING"
  | "HOVER"
  | "LOCKED"
  | "CANCELLED"
  | "SKIPPED";

export interface Hero {
  id: string;
  gameCode: GameCode;
  displayName: string;
  localizedNames?: Record<string, string>;
  roleTags?: string[];
  iconUrl?: string;
  splashUrl?: string;
  squareUrl?: string;
  metadata?: JsonObject;
}

export interface DraftRuleset {
  id: string;
  gameCode: GameCode;
  name: string;
  description?: string;
  version?: string;
  allowDuplicateHeroes: boolean;
  globalBanAcrossSeries: boolean;
  globalPickAcrossSeries: boolean;
  phases: DraftPhaseDefinition[];
  metadata?: JsonObject;
}

export type DraftPhaseTeam = TeamSide | "AUTO" | "NONE";

export interface DraftPhaseDefinition {
  id: string;
  type: DraftActionType;
  team: DraftPhaseTeam;
  count: number;
  timeSeconds: number;
  label?: string;
  allowHover?: boolean;
  autoAdvance?: boolean;
  metadata?: JsonObject;
}

export type DraftStatus =
  | "NOT_STARTED"
  | "READY"
  | "LIVE"
  | "PAUSED"
  | "COMPLETE"
  | "CANCELLED";

export type DraftLineupSide = Extract<TeamSide, "BLUE" | "RED">;

export type DraftFinalLineupStatus = "ACTIVE" | "CONFIRMED";

export interface DraftFinalLineupState {
  status: DraftFinalLineupStatus;
  finalLineupBySide: Partial<Record<DraftLineupSide, string[]>>;
  lineupPhaseStartedAt?: string;
  lineupConfirmedAt?: string;
  confirmedByOperatorId?: string;
  updatedAt?: string;
}

export interface DraftState {
  id: string;
  gameId: string;
  rulesetId: string;
  gameCode: GameCode;
  status: DraftStatus;
  currentPhaseIndex: number;
  timer: DraftTimerState;
  actions: DraftAction[];
  lockedHeroIds: string[];
  bannedHeroIds: string[];
  pickedHeroIds: string[];
  finalLineup?: DraftFinalLineupState;
  history: DraftHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: JsonObject;
}

export interface DraftAction {
  id: string;
  phaseId: string;
  type: DraftActionType;
  team: TeamSide | "NONE";
  slotIndex: number;
  heroId: string | null;
  status: DraftActionStatus;
  selectedSide?: TeamSide | null;
  operatorId?: string;
  createdAt: string;
  hoveredAt?: string;
  lockedAt?: string;
  metadata?: JsonObject;
}

export interface DraftTimerState {
  isRunning: boolean;
  phaseStartedAt?: string;
  pausedAt?: string;
  remainingSeconds: number;
  originalSeconds: number;
}

export interface DraftHistoryEntry {
  id: string;
  timestamp: string;
  operatorId?: string;
  action: string;
  before?: JsonValue;
  after?: JsonValue;
  metadata?: JsonObject;
}

export interface DraftValidationIssue {
  code: string;
  message: string;
  details?: JsonValue;
}

export interface DraftValidationResult {
  valid: boolean;
  reason?: string;
  issues?: DraftValidationIssue[];
}
