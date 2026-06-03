import type {
  MatchPresentationMetadata,
  Player,
  Team
} from "@mmbt/shared-types";

import type { OverlayMatch, OverlayRuntimeState } from "../client/types";

export type OverlayPresentationSide = "BLUE" | "RED";

export type OverlayLocalAssetStatus = "resolved" | "missing" | "unsafe";

export interface OverlayPresentationPlayerViewModel {
  slotIndex: number;
  playerId: string;
  unresolved: boolean;
  handle: string | null;
  displayName: string;
  label: string;
  role: string | null;
  teamId: string | null;
  teamShortName: string | null;
}

export interface OverlayPresentationTeamViewModel {
  side: OverlayPresentationSide;
  teamId: string | null;
  name: string;
  shortName: string;
  logoAssetPath: string | null;
  localLogoUrl: string | null;
  logoStatus: OverlayLocalAssetStatus;
  colors: {
    primary: string | null;
    secondary: string | null;
  };
  players: OverlayPresentationPlayerViewModel[];
  playerOrderConfigured: boolean;
  fallbackMessage: string | null;
}

export interface OverlayMatchPresentationViewModel {
  matchLabel: string;
  patchLabel: string | null;
  seriesFormat: string;
  gameNumber: number;
  scoreBySide: {
    BLUE: number;
    RED: number;
  };
  firstPickSide: OverlayPresentationSide | null;
  sideStatusLabel: string | null;
  playerOrderConfigured: boolean;
  playerOrderFallbackMessage: string | null;
  teams: Record<OverlayPresentationSide, OverlayPresentationTeamViewModel>;
}

const PRESENTATION_SIDES: OverlayPresentationSide[] = ["BLUE", "RED"];
const MISSING_PLAYER_ORDER_MESSAGE = "No broadcast player order configured for this match.";
const MISSING_SIDE_PLAYER_ORDER_MESSAGE = "No player order configured for this side.";

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPresentationSide(value: unknown): value is OverlayPresentationSide {
  return value === "BLUE" || value === "RED";
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function getPlayers(state: OverlayRuntimeState): Player[] {
  return Array.isArray(state.players) ? state.players : [];
}

function findTeam(state: OverlayRuntimeState, teamId: string | undefined): Team | null {
  if (!teamId) {
    return null;
  }

  return state.teams.find((team) => team.id === teamId) ?? null;
}

function findPlayer(state: OverlayRuntimeState, playerId: string): Player | null {
  return getPlayers(state).find((player) => player.id === playerId) ?? null;
}

function resolveTeamShortName(team: Team | null, teamId: string | null): string {
  return team?.shortName || team?.name || teamId || "TBD";
}

function resolveTeamDisplayName(team: Team | null, teamId: string | null): string {
  return team?.name || team?.shortName || teamId || "TBD";
}

function resolvePlayerLabel(player: Player | null, playerId: string): string {
  return player?.handle || player?.displayName || playerId;
}

export function isSafeLocalAssetPath(value: string | undefined | null): value is string {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("\\") &&
    !trimmed.includes("..")
  );
}

export function toBrowserLocalAssetPath(value: string | undefined | null): string | null {
  if (!isSafeLocalAssetPath(value)) {
    return null;
  }

  return value.startsWith("/") ? value : `/${value}`;
}

function resolveLogoStatus(rawLogoPath: string | null, localLogoUrl: string | null): OverlayLocalAssetStatus {
  if (!rawLogoPath) {
    return "missing";
  }

  return localLogoUrl ? "resolved" : "unsafe";
}

function getPresentationScore(
  presentation: MatchPresentationMetadata | undefined,
  match: OverlayMatch,
  side: OverlayPresentationSide
): number {
  const value = presentation?.scoreBySide?.[side];

  if (isNonNegativeInteger(value)) {
    return value;
  }

  return side === "BLUE" ? match.score.blue : match.score.red;
}

function getPresentationGameNumber(
  presentation: MatchPresentationMetadata | undefined,
  match: OverlayMatch
): number {
  return isPositiveInteger(presentation?.gameNumber)
    ? presentation.gameNumber
    : match.currentGameNumber;
}

function getPlayerOrder(
  presentation: MatchPresentationMetadata | undefined,
  side: OverlayPresentationSide
): string[] | null {
  const order = presentation?.playerDisplayOrderBySide?.[side];

  return Array.isArray(order) ? order : null;
}

function resolvePresentationPlayers(
  state: OverlayRuntimeState,
  playerIds: readonly string[],
  sideTeamId: string | null,
  sideTeamShortName: string
): OverlayPresentationPlayerViewModel[] {
  return playerIds.map((playerId, index) => {
    const player = findPlayer(state, playerId);
    const playerTeam = findTeam(state, player?.teamId);
    const teamShortName = player
      ? resolveTeamShortName(playerTeam, player.teamId)
      : sideTeamShortName;

    return {
      slotIndex: index,
      playerId,
      unresolved: !player,
      handle: hasText(player?.handle) ? player.handle : null,
      displayName: player?.displayName || playerId,
      label: resolvePlayerLabel(player, playerId),
      role: hasText(player?.role) ? player.role : null,
      teamId: player?.teamId ?? sideTeamId,
      teamShortName
    };
  });
}

function resolvePresentationTeam(
  state: OverlayRuntimeState,
  match: OverlayMatch,
  side: OverlayPresentationSide
): OverlayPresentationTeamViewModel {
  const teamId = side === "BLUE" ? match.teams.blue : match.teams.red;
  const team = findTeam(state, teamId);
  const shortName = resolveTeamShortName(team, teamId);
  const rawLogoPath = team?.logoAssetPath || team?.logoUrl || null;
  const localLogoUrl = toBrowserLocalAssetPath(rawLogoPath);
  const playerOrder = getPlayerOrder(match.presentation, side);

  return {
    side,
    teamId,
    name: resolveTeamDisplayName(team, teamId),
    shortName,
    logoAssetPath: rawLogoPath,
    localLogoUrl,
    logoStatus: resolveLogoStatus(rawLogoPath, localLogoUrl),
    colors: {
      primary: team?.primaryColor ?? null,
      secondary: team?.secondaryColor ?? null
    },
    players: playerOrder
      ? resolvePresentationPlayers(state, playerOrder, teamId, shortName)
      : [],
    playerOrderConfigured: playerOrder !== null,
    fallbackMessage: playerOrder ? null : MISSING_SIDE_PLAYER_ORDER_MESSAGE
  };
}

export function selectMatchPresentationViewModel(
  state: OverlayRuntimeState,
  match: OverlayMatch
): OverlayMatchPresentationViewModel {
  const presentation = match.presentation;
  const playerOrderConfigured =
    Boolean(presentation?.playerDisplayOrderBySide) &&
    PRESENTATION_SIDES.every((side) => getPlayerOrder(presentation, side) !== null);

  return {
    matchLabel: hasText(presentation?.matchLabel) ? presentation.matchLabel : match.title,
    patchLabel: hasText(presentation?.patchLabel) ? presentation.patchLabel : null,
    seriesFormat: presentation?.seriesFormat ?? match.format,
    gameNumber: getPresentationGameNumber(presentation, match),
    scoreBySide: {
      BLUE: getPresentationScore(presentation, match, "BLUE"),
      RED: getPresentationScore(presentation, match, "RED")
    },
    firstPickSide: isPresentationSide(presentation?.firstPickSide)
      ? presentation.firstPickSide
      : null,
    sideStatusLabel: hasText(presentation?.sideStatusLabel)
      ? presentation.sideStatusLabel
      : null,
    playerOrderConfigured,
    playerOrderFallbackMessage: playerOrderConfigured
      ? null
      : MISSING_PLAYER_ORDER_MESSAGE,
    teams: {
      BLUE: resolvePresentationTeam(state, match, "BLUE"),
      RED: resolvePresentationTeam(state, match, "RED")
    }
  };
}
