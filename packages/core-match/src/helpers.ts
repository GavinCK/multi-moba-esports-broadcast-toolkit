import type { GameInstance, Match, MatchFormat, Team } from "@mmbt/shared-types";

import { MATCH_FORMATS } from "./constants.js";
import type { MatchTeams } from "./types.js";

export function isMatchFormat(value: unknown): value is MatchFormat {
  return typeof value === "string" && MATCH_FORMATS.includes(value as MatchFormat);
}

export function getMatchFormatGameCount(format: MatchFormat): number {
  switch (format) {
    case "BO1":
      return 1;
    case "BO3":
      return 3;
    case "BO5":
      return 5;
    case "BO7":
      return 7;
  }
}

export function getMatchFormatWinsRequired(format: MatchFormat): number {
  return Math.floor(getMatchFormatGameCount(format) / 2) + 1;
}

export function getMatchGames(matchOrId: Match | string, games: readonly GameInstance[]): GameInstance[] {
  const matchId = typeof matchOrId === "string" ? matchOrId : matchOrId.id;

  return [...games]
    .filter((game) => game.matchId === matchId)
    .sort((firstGame, secondGame) => firstGame.gameNumber - secondGame.gameNumber);
}

export function getCurrentGame(match: Match, games: readonly GameInstance[]): GameInstance | null {
  return (
    getMatchGames(match, games).find((game) => game.gameNumber === match.currentGameNumber) ?? null
  );
}

export function getMatchTeams(match: Match, teams: readonly Team[]): MatchTeams | null {
  const blue = teams.find((team) => team.id === match.teams.blue);
  const red = teams.find((team) => team.id === match.teams.red);

  if (!blue || !red) {
    return null;
  }

  return { blue, red };
}
