import type {
  GameInstance,
  Match,
  MatchFormat,
  MatchPresentationMetadata,
  SeriesFormat,
  Team
} from "@mmbt/shared-types";

import { MATCH_FORMATS, SERIES_FORMATS } from "./constants.js";
import type { MatchTeams } from "./types.js";

export function isMatchFormat(value: unknown): value is MatchFormat {
  return typeof value === "string" && MATCH_FORMATS.includes(value as MatchFormat);
}

export function isSeriesFormat(value: unknown): value is SeriesFormat {
  return typeof value === "string" && SERIES_FORMATS.includes(value as SeriesFormat);
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

export function createMatchPresentationDefaults(match: Match): MatchPresentationMetadata {
  const presentation = match.presentation ?? {};
  const seriesFormat = presentation.seriesFormat ?? (isSeriesFormat(match.format) ? match.format : undefined);

  return {
    matchLabel: presentation.matchLabel ?? match.title,
    patchLabel: presentation.patchLabel,
    seriesFormat,
    gameNumber: presentation.gameNumber ?? match.currentGameNumber,
    scoreBySide: presentation.scoreBySide ?? {
      BLUE: match.score.blue,
      RED: match.score.red
    },
    firstPickSide: presentation.firstPickSide,
    sideStatusLabel: presentation.sideStatusLabel,
    playerDisplayOrderBySide: presentation.playerDisplayOrderBySide
      ? {
          BLUE: [...presentation.playerDisplayOrderBySide.BLUE],
          RED: [...presentation.playerDisplayOrderBySide.RED]
        }
      : undefined
  };
}

export function withMatchPresentationDefaults<TMatch extends Match>(match: TMatch): TMatch {
  return {
    ...match,
    presentation: createMatchPresentationDefaults(match)
  };
}
