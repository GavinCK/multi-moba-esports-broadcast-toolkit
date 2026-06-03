import type {
  DraftRuleset,
  DraftFinalLineupState,
  DraftState,
  DraftPhaseDefinition,
  DraftTimerState,
  EventInfo,
  GameAdapterCapabilities,
  GameCode,
  GameInstance,
  GraphicTakeStatus,
  GraphicType,
  Hero,
  JsonValue,
  Match,
  Player,
  ProductionState,
  Sponsor,
  SystemHealth,
  Team
} from "@mmbt/shared-types";

export interface DashboardGame extends GameInstance {
  rulesetId: string;
  themeId?: string;
}

export interface DashboardMatch extends Match {
  sponsorSlotIds?: string[];
  themeId?: string;
  games: DashboardGame[];
}

export interface DashboardEventPackageSummary {
  packageId: string;
  packagePath: string;
  schemaVersion: string;
  defaults: {
    matchId: string;
    gameCode: GameCode;
    themeId: string;
    rulesetByGameCode: Record<string, string>;
    productionLogPath: string;
  };
}

export interface DashboardAdapterSummary {
  gameCode: GameCode;
  displayName: string;
  version?: string;
  loaded: boolean;
  heroCount: number;
  rulesetCount: number;
  capabilities: GameAdapterCapabilities;
  source: "LOCAL_STATIC_SAMPLE";
  error?: {
    code: string;
    message: string;
  };
}

export interface DashboardAdapterDetail extends DashboardAdapterSummary {
  heroes: Hero[];
  rulesets: DraftRuleset[];
}

export interface DashboardValidationWarning {
  path: string;
  code: string;
  message: string;
  severity: "warning" | "error";
  adapterId?: GameCode;
}

export interface DashboardDraftSummary {
  id: string;
  matchId: string;
  gameId: string;
  gameNumber: number;
  gameCode: GameCode;
  rulesetId: string;
  status: string;
  currentPhaseIndex: number;
  currentPhase: DraftPhaseDefinition | null;
  currentActionIds: string[];
  timer: DraftTimerState;
  actionCounts: {
    total: number;
    pending: number;
    hover: number;
    locked: number;
    skipped: number;
    cancelled: number;
  };
  lockedHeroIds: string[];
  bannedHeroIds: string[];
  pickedHeroIds: string[];
  finalLineup?: DraftFinalLineupState;
  updatedAt?: string;
}

export interface DashboardDraftSnapshot {
  summary: DashboardDraftSummary;
  draft: DraftState;
}

export interface DashboardDraftListResponse {
  revision: number;
  drafts: DashboardDraftSummary[];
}

export interface DashboardDraftDetailResponse {
  revision: number;
  draft: DashboardDraftSnapshot;
}

export interface DashboardDraftMutationResponse {
  revision: number;
  draft: DashboardDraftSnapshot;
}

export interface DashboardGraphicTakeState {
  id: string;
  graphicType: GraphicType;
  previewPayload: JsonValue | null;
  programPayload: JsonValue | null;
  status: GraphicTakeStatus;
  updatedAt?: string;
}

export interface DashboardProductionState {
  id: string;
  status: ProductionState;
  activeMatchId: string | null;
  activeGameNumber: number | null;
  activeDraftId: string | null;
  graphicTakeState: DashboardGraphicTakeState;
  emergency: {
    active: boolean;
    message: string | null;
    triggeredAt?: string;
    clearedAt?: string;
  };
  overlaySafety: {
    readOnly: true;
    mutationAllowed: false;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardHealthResponse extends SystemHealth {
  now: string;
  uptimeSeconds: number;
  eventPackagePath?: string;
  validationWarnings?: {
    eventPackage: DashboardValidationWarning[];
    adapters: DashboardValidationWarning[];
  };
}

export interface DashboardRuntimeState {
  revision: number;
  timestamp: string;
  eventPackageId?: string;
  eventPackage?: DashboardEventPackageSummary;
  event?: EventInfo;
  matches: DashboardMatch[];
  teams: Team[];
  players: Player[];
  sponsors: Sponsor[];
  games: DashboardGame[];
  rulesets: Array<{
    id: string;
    gameCode: GameCode;
    name: string;
    version?: string;
  }>;
  themes: Array<{
    id: string;
    name?: string;
    version?: string;
  }>;
  currentMatchId: string | null;
  currentGameId: string | null;
  drafts: Record<string, DashboardDraftSummary>;
  production: DashboardProductionState;
  adapters: DashboardAdapterSummary[];
  adapterStatus: SystemHealth["adapterStatus"];
  availableAdapterIds: GameCode[];
  validationWarnings: {
    eventPackage: DashboardValidationWarning[];
    adapters: DashboardValidationWarning[];
  };
  health: DashboardHealthResponse;
}

export interface DashboardDocumentedStateFullPayload {
  revision: number;
  timestamp: string;
  state: DashboardRuntimeState;
}

export type DashboardStateFullPayload =
  | DashboardRuntimeState
  | DashboardDocumentedStateFullPayload;

export interface DashboardHealthUpdatePayload {
  revision: number;
  health: DashboardHealthResponse;
}

export interface DashboardClientError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}
