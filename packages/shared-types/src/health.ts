import type { GameCode } from "./match";
import type { ProductionState } from "./production";

export type ClientRole =
  | "ADMIN"
  | "PRODUCER"
  | "DRAFT_OPERATOR"
  | "REFEREE"
  | "GRAPHICS_OPERATOR"
  | "CASTER"
  | "OBSERVER"
  | "VIEWER";

export type HealthStatus = "OK" | "WARN" | "ERROR";

export interface SystemHealth {
  status: HealthStatus;
  serverStartedAt: string;
  stateRevision?: number;
  socketClients: SocketClientInfo[];
  clientSummary?: SocketClientSummary;
  clientGroups?: SocketClientGroup[];
  connectionStatus?: HealthConnectionStatus;
  loadedEventPackageId?: string;
  currentProductionState: ProductionState;
  adapterStatus: Record<GameCode, AdapterHealth>;
  assetStatus: AssetHealth;
  auditLogStatus?: AuditLogHealth;
  emergencyReady: boolean;
  emergencyStatus?: EmergencyHealth;
  lastStateUpdateAt?: string;
}

export interface SocketClientInfo {
  id: string;
  role?: ClientRole;
  panel?: string;
  connectedAt: string;
  lastSeenAt: string;
}

export type HealthClientCategory =
  | "dashboard"
  | "overlay"
  | "draft-operator"
  | "producer"
  | "caster"
  | "other";

export interface SocketClientSummary {
  total: number;
  readOnlyCount: number;
  byRole: Record<string, number>;
  byPanel: Record<string, number>;
  byClientType: Record<string, number>;
  lastSeenAt?: string;
}

export interface SocketClientGroup {
  category: HealthClientCategory;
  role?: string;
  panel?: string;
  clientType?: string;
  route?: string;
  matchId?: string;
  count: number;
  readOnlyCount: number;
  lastSeenAt?: string;
}

export interface HealthConnectionTargetStatus {
  category: Exclude<HealthClientCategory, "other">;
  connected: boolean;
  state: "connected" | "not-reported";
  count: number;
  panels: string[];
  roles: string[];
  routes: string[];
  matchIds: string[];
  lastSeenAt?: string;
}

export interface HealthConnectionStatus {
  dashboard: HealthConnectionTargetStatus;
  overlay: HealthConnectionTargetStatus;
  draftOperator: HealthConnectionTargetStatus;
  producer: HealthConnectionTargetStatus;
  caster: HealthConnectionTargetStatus;
}

export interface AdapterHealth {
  loaded: boolean;
  displayName?: string;
  heroCount: number;
  rulesetCount?: number;
  lastLoadedAt?: string;
  error?: string;
}

export interface AssetHealth {
  missingAssets: string[];
  warnings: string[];
}

export interface AuditLogHealth {
  writable: boolean;
  path?: string;
  lastWriteAt?: string;
  error?: string;
}

export interface EmergencyHealth {
  ready: boolean;
  active: boolean;
  triggeredAt?: string;
  clearedAt?: string;
}
