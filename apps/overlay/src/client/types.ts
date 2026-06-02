import type {
  DraftPhaseDefinition,
  DraftRuleset,
  DraftTimerState,
  EventInfo,
  GameAdapterCapabilities,
  GameCode,
  GameInstance,
  GraphicTakeStatus,
  GraphicType,
  JsonValue,
  Match,
  ProductionState,
  Sponsor,
  SystemHealth,
  Team
} from "@mmbt/shared-types";

export type OverlaySocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface OverlayGame extends GameInstance {
  rulesetId: string;
  themeId?: string;
}

export interface OverlayMatch extends Match {
  sponsorSlotIds?: string[];
  themeId?: string;
  games: OverlayGame[];
}

export interface OverlayAdapterSummary {
  gameCode: GameCode;
  displayName: string;
  loaded: boolean;
  heroCount: number;
  rulesetCount: number;
  capabilities: GameAdapterCapabilities;
}

export interface OverlayDraftSummary {
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
  updatedAt?: string;
}

export interface OverlayGraphicTakeState {
  id: string;
  graphicType: GraphicType;
  previewPayload: JsonValue | null;
  programPayload: JsonValue | null;
  status: GraphicTakeStatus;
  updatedAt?: string;
}

export interface OverlayProductionState {
  id: string;
  status: ProductionState;
  activeMatchId: string | null;
  activeGameNumber: number | null;
  activeDraftId: string | null;
  graphicTakeState: OverlayGraphicTakeState;
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

export interface OverlayHealthResponse extends SystemHealth {
  now?: string;
  uptimeSeconds?: number;
}

export interface OverlayRuntimeState {
  revision: number;
  timestamp: string;
  eventPackageId?: string;
  event?: EventInfo;
  matches: OverlayMatch[];
  teams: Team[];
  sponsors: Sponsor[];
  games: OverlayGame[];
  rulesets: Array<Pick<DraftRuleset, "id" | "gameCode" | "name" | "version">>;
  themes: Array<{
    id: string;
    name?: string;
    version?: string;
  }>;
  currentMatchId: string | null;
  currentGameId: string | null;
  drafts: Record<string, OverlayDraftSummary>;
  production: OverlayProductionState;
  adapters: OverlayAdapterSummary[];
  adapterStatus: SystemHealth["adapterStatus"];
  availableAdapterIds: GameCode[];
  health: OverlayHealthResponse;
}

export interface OverlayDocumentedStateFullPayload {
  revision: number;
  timestamp: string;
  state: OverlayRuntimeState;
}

export type OverlayStateFullPayload =
  | OverlayRuntimeState
  | OverlayDocumentedStateFullPayload;

export interface OverlayHealthUpdatePayload {
  revision: number;
  health: OverlayHealthResponse;
}

export interface OverlayClientState {
  socketStatus: OverlaySocketStatus;
  snapshot: OverlayRuntimeState | null;
  health: OverlayHealthResponse | null;
  lastUpdatedAt: string | null;
  socketMessage: string | null;
}
