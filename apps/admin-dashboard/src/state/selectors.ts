import type { Team } from "@mmbt/shared-types";

import type {
  DashboardDraftSummary,
  DashboardGame,
  DashboardMatch,
  DashboardRuntimeState
} from "../client/types";

export interface DashboardCurrentContext {
  match: DashboardMatch | null;
  game: DashboardGame | null;
  draft: DashboardDraftSummary | null;
  blueTeam: Team | null;
  redTeam: Team | null;
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

export function getCurrentMatch(
  snapshot: DashboardRuntimeState | null
): DashboardMatch | null {
  if (!snapshot || !snapshot.currentMatchId) {
    return null;
  }

  return snapshot.matches.find((match) => match.id === snapshot.currentMatchId) ?? null;
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
