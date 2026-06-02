import type { Player, Sponsor, Team } from "@mmbt/shared-types";

import type {
  DashboardAdapterSummary,
  DashboardDraftSummary,
  DashboardGame,
  DashboardHealthResponse,
  DashboardMatch,
  DashboardRuntimeState
} from "../client/types";
import type { DashboardLoadStatus, DashboardSocketStatus } from "./dashboardState";

export interface DashboardCurrentContext {
  match: DashboardMatch | null;
  game: DashboardGame | null;
  draft: DashboardDraftSummary | null;
  blueTeam: Team | null;
  redTeam: Team | null;
}

export interface DashboardMatchSetupWarning {
  code: string;
  message: string;
}

export interface DashboardHealthSummary {
  serverStatus: DashboardHealthResponse["status"] | "UNKNOWN";
  restStatus: DashboardLoadStatus;
  socketStatus: DashboardSocketStatus;
  loadedEventPackageId: string;
  revision: number | null;
  productionState: string;
  emergencyStatus: "ACTIVE" | "READY" | "UNKNOWN";
  connectedClientCount: number;
  connectedClientGroups: string[];
  loadedAdapterCount: number;
  knownAdapterCount: number;
  missingAssetCount: number;
  healthWarningCount: number;
  latestSnapshotAt: string | null;
}

export function findTeam(
  snapshot: DashboardRuntimeState | null,
  teamId: string | null | undefined
): Team | null {
  if (!snapshot || !teamId) {
    return null;
  }

  return snapshot.teams.find((team) => team.id === teamId) ?? null;
}

export function getMatchById(
  snapshot: DashboardRuntimeState | null,
  matchId: string | null | undefined
): DashboardMatch | null {
  if (!snapshot || !matchId) {
    return null;
  }

  return snapshot.matches.find((match) => match.id === matchId) ?? null;
}

export function getCurrentMatch(
  snapshot: DashboardRuntimeState | null
): DashboardMatch | null {
  return getMatchById(snapshot, snapshot?.currentMatchId);
}

export function getCurrentGame(
  snapshot: DashboardRuntimeState | null,
  match: DashboardMatch | null = getCurrentMatch(snapshot)
): DashboardGame | null {
  if (!snapshot) {
    return null;
  }

  if (snapshot.currentGameId) {
    return snapshot.games.find((game) => game.id === snapshot.currentGameId) ?? null;
  }

  if (!match) {
    return null;
  }

  return match.games.find((game) => game.gameNumber === match.currentGameNumber) ?? match.games[0] ?? null;
}

export function getCurrentDraft(
  snapshot: DashboardRuntimeState | null,
  game: DashboardGame | null = getCurrentGame(snapshot)
): DashboardDraftSummary | null {
  if (!snapshot || !game?.draftId) {
    return null;
  }

  return snapshot.drafts[game.draftId] ?? null;
}

export function getDraftForGame(
  snapshot: DashboardRuntimeState | null,
  game: DashboardGame | null | undefined
): DashboardDraftSummary | null {
  if (!snapshot || !game?.draftId) {
    return null;
  }

  return snapshot.drafts[game.draftId] ?? null;
}

export function getCurrentContext(
  snapshot: DashboardRuntimeState | null
): DashboardCurrentContext {
  const match = getCurrentMatch(snapshot);
  const game = getCurrentGame(snapshot, match);
  const draft = getCurrentDraft(snapshot, game);

  return {
    match,
    game,
    draft,
    blueTeam: findTeam(snapshot, game?.blueTeamId ?? match?.teams.blue),
    redTeam: findTeam(snapshot, game?.redTeamId ?? match?.teams.red)
  };
}

export function getSelectedMatch(
  snapshot: DashboardRuntimeState | null,
  selectedMatchId: string | null
): DashboardMatch | null {
  if (!snapshot) {
    return null;
  }

  return (
    getMatchById(snapshot, selectedMatchId) ??
    getCurrentMatch(snapshot) ??
    snapshot.matches[0] ??
    null
  );
}

export function getPlayersForTeam(
  snapshot: DashboardRuntimeState | null,
  teamId: string | null | undefined
): Player[] {
  if (!snapshot || !teamId) {
    return [];
  }

  return snapshot.players.filter((player) => player.teamId === teamId);
}

export function getSponsorsForMatch(
  snapshot: DashboardRuntimeState | null,
  match: DashboardMatch | null | undefined
): Sponsor[] {
  if (!snapshot || !match?.sponsorSlotIds) {
    return [];
  }

  const sponsorIds = new Set(match.sponsorSlotIds);

  return snapshot.sponsors.filter((sponsor) => sponsorIds.has(sponsor.id));
}

export function getAdapterForGameCode(
  snapshot: DashboardRuntimeState | null,
  gameCode: string | null | undefined
): DashboardAdapterSummary | null {
  if (!snapshot || !gameCode) {
    return null;
  }

  return snapshot.adapters.find((adapter) => adapter.gameCode === gameCode) ?? null;
}

export function getRulesetLabel(
  snapshot: DashboardRuntimeState | null,
  rulesetId: string | null | undefined
): string {
  if (!rulesetId) {
    return "Not selected";
  }

  const ruleset = snapshot?.rulesets.find((item) => item.id === rulesetId);

  return ruleset ? `${ruleset.name} (${ruleset.id})` : rulesetId;
}

export function getThemeLabel(
  snapshot: DashboardRuntimeState | null,
  themeId: string | null | undefined
): string {
  if (!themeId) {
    return "Default / not selected";
  }

  const theme = snapshot?.themes.find((item) => item.id === themeId);

  return theme?.name ? `${theme.name} (${theme.id})` : themeId;
}

export function getMatchSetupWarnings(
  snapshot: DashboardRuntimeState | null,
  match: DashboardMatch | null
): DashboardMatchSetupWarning[] {
  if (!snapshot || !match) {
    return [
      {
        code: "MATCH_NOT_SELECTED",
        message: "No match is selected for setup review."
      }
    ];
  }

  const warnings: DashboardMatchSetupWarning[] = [];
  const blueTeam = findTeam(snapshot, match.teams.blue);
  const redTeam = findTeam(snapshot, match.teams.red);

  if (!blueTeam) {
    warnings.push({
      code: "BLUE_TEAM_MISSING",
      message: "Blue team reference does not resolve to a loaded team."
    });
  }

  if (!redTeam) {
    warnings.push({
      code: "RED_TEAM_MISSING",
      message: "Red team reference does not resolve to a loaded team."
    });
  }

  if (match.games.length === 0) {
    warnings.push({
      code: "MATCH_HAS_NO_GAMES",
      message: "Match has no game instances."
    });
  }

  match.games.forEach((game) => {
    if (!getAdapterForGameCode(snapshot, game.gameCode)?.loaded) {
      warnings.push({
        code: "GAME_ADAPTER_UNAVAILABLE",
        message: `Game ${game.gameNumber} references an unavailable adapter.`
      });
    }

    if (!snapshot.rulesets.some((ruleset) => ruleset.id === game.rulesetId)) {
      warnings.push({
        code: "RULESET_NOT_LISTED",
        message: `Game ${game.gameNumber} references a ruleset not exposed in package state.`
      });
    }

    if (game.draftId && !snapshot.drafts[game.draftId]) {
      warnings.push({
        code: "DRAFT_NOT_READY",
        message: `Game ${game.gameNumber} references a draft that is not available in runtime state.`
      });
    }
  });

  return warnings;
}

export function createDashboardHealthSummary(input: {
  snapshot: DashboardRuntimeState | null;
  health: DashboardHealthResponse | null;
  socketStatus: DashboardSocketStatus;
  loadStatus: DashboardLoadStatus;
}): DashboardHealthSummary {
  const health = input.health ?? input.snapshot?.health ?? null;
  const socketClients = health?.socketClients ?? [];
  const connectedClientGroups = health?.clientGroups
    ? health.clientGroups.map((group) => `${group.role ?? group.category} / ${group.panel ?? "unknown panel"}`)
    : Array.from(
        new Set(
          socketClients.map((client) => `${client.role ?? "VIEWER"} / ${client.panel ?? "unknown panel"}`)
        )
      ).sort();
  const adapterEntries = Object.values(health?.adapterStatus ?? {});

  return {
    serverStatus: health?.status ?? "UNKNOWN",
    restStatus: input.loadStatus,
    socketStatus: input.socketStatus,
    loadedEventPackageId: health?.loadedEventPackageId ?? input.snapshot?.eventPackageId ?? "Not loaded",
    revision: health?.stateRevision ?? input.snapshot?.revision ?? null,
    productionState: health?.currentProductionState ?? input.snapshot?.production.status ?? "Unknown",
    emergencyStatus: health?.emergencyStatus
      ? health.emergencyStatus.active
        ? "ACTIVE"
        : "READY"
      : input.snapshot
      ? input.snapshot.production.emergency.active
        ? "ACTIVE"
        : "READY"
      : health?.emergencyReady
        ? "READY"
        : "UNKNOWN",
    connectedClientCount: health?.clientSummary?.total ?? socketClients.length,
    connectedClientGroups,
    loadedAdapterCount: adapterEntries.filter((adapter) => adapter.loaded).length,
    knownAdapterCount: adapterEntries.length,
    missingAssetCount: health?.assetStatus.missingAssets.length ?? 0,
    healthWarningCount:
      (health?.assetStatus.warnings.length ?? 0) +
      (health?.validationWarnings?.eventPackage.length ?? 0) +
      (health?.validationWarnings?.adapters.length ?? 0) +
      (health?.auditLogStatus && !health.auditLogStatus.writable ? 1 : 0),
    latestSnapshotAt: health?.lastStateUpdateAt ?? input.snapshot?.timestamp ?? null
  };
}

export function formatTeamName(team: Team | null): string {
  return team ? `${team.shortName} - ${team.name}` : "Unassigned";
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not reported";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!Number.isFinite(seconds)) {
    return "0s";
  }

  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}
