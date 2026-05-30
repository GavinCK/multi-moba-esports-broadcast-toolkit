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
  socketClients: SocketClientInfo[];
  loadedEventPackageId?: string;
  currentProductionState: ProductionState;
  adapterStatus: Record<GameCode, AdapterHealth>;
  assetStatus: AssetHealth;
  auditLogStatus?: AuditLogHealth;
  emergencyReady: boolean;
  lastStateUpdateAt?: string;
}

export interface SocketClientInfo {
  id: string;
  role?: ClientRole;
  panel?: string;
  connectedAt: string;
  lastSeenAt: string;
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
