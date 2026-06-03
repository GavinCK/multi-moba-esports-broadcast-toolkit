import type {
  EventInfo,
  GameInstance,
  GameStatus,
  Match,
  MatchFormat,
  PresentationSide,
  SeriesFormat,
  MatchStatus,
  Player,
  Sponsor,
  SponsorSlot,
  Team
} from "@mmbt/shared-types";

import { GAME_STATUSES, MATCH_STATUSES, SERIES_FORMATS, SPONSOR_SLOTS } from "./constants.js";
import {
  getMatchFormatGameCount,
  getMatchFormatWinsRequired,
  getMatchGames,
  isMatchFormat
} from "./helpers.js";
import type { MatchBundle, ValidationIssue, ValidationResult } from "./types.js";

type IdLookup = ReadonlySet<string> | readonly string[];

export interface TeamValidationOptions {
  path?: string;
}

export interface PlayerValidationOptions {
  path?: string;
  teamIds?: IdLookup;
}

export interface SponsorValidationOptions {
  path?: string;
}

export interface EventInfoValidationOptions {
  path?: string;
}

export interface MatchValidationOptions {
  path?: string;
  eventIds?: IdLookup;
  gameCodes?: IdLookup;
  teamIds?: IdLookup;
  games?: readonly GameInstance[];
}

export interface GameInstanceValidationOptions {
  path?: string;
  matchIds?: IdLookup;
  teamIds?: IdLookup;
  match?: Match;
}

export interface MatchBundleValidationOptions {
  path?: string;
}

function valid<T>(value: T): ValidationResult<T> {
  return { valid: true, value, issues: [] };
}

function invalid<T>(issues: ValidationIssue[]): ValidationResult<T> {
  return { valid: false, issues };
}

function result<T>(value: unknown, issues: ValidationIssue[]): ValidationResult<T> {
  return issues.length === 0 ? valid(value as T) : invalid<T>(issues);
}

function addIssue(
  issues: ValidationIssue[],
  path: string,
  code: string,
  message: string
): void {
  issues.push({ path, code, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasId(ids: IdLookup | undefined, id: string): boolean {
  if (!ids) {
    return true;
  }

  return Array.isArray(ids) ? ids.includes(id) : (ids as ReadonlySet<string>).has(id);
}

function readRequiredString(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): string | undefined {
  const value = record[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    addIssue(issues, path, "required-string", `${path} must be a non-empty string.`);
    return undefined;
  }

  return value;
}

function validateOptionalString(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): void {
  const value = record[field];

  if (value !== undefined && (typeof value !== "string" || value.trim().length === 0)) {
    addIssue(issues, path, "invalid-string", `${path} must be a non-empty string when provided.`);
  }
}

function validateOptionalDateString(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): void {
  const value = record[field];

  if (value === undefined) {
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0 || Number.isNaN(Date.parse(value))) {
    addIssue(issues, path, "invalid-date", `${path} must be a parseable date string when provided.`);
  }
}

function isJsonValue(value: unknown, seen: ReadonlySet<object> = new Set<object>()): boolean {
  if (value === null) {
    return true;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return Number.isFinite(value) || typeof value !== "number";
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item, seen));
  }

  if (!isRecord(value)) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  const nextSeen = new Set(seen);
  nextSeen.add(value);

  return Object.values(value).every((item) => isJsonValue(item, nextSeen));
}

function validateOptionalJsonObject(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): void {
  const value = record[field];

  if (value === undefined) {
    return;
  }

  if (!isRecord(value) || !isJsonValue(value)) {
    addIssue(issues, path, "invalid-json-object", `${path} must be JSON-serializable object data.`);
  }
}

function readStringArray(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[],
  options: { minLength?: number } = {}
): string[] | undefined {
  const value = record[field];

  if (!Array.isArray(value)) {
    addIssue(issues, path, "required-array", `${path} must be an array.`);
    return undefined;
  }

  if (options.minLength !== undefined && value.length < options.minLength) {
    addIssue(issues, path, "array-too-short", `${path} must contain at least ${options.minLength} item(s).`);
  }

  const strings: string[] = [];

  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      addIssue(
        issues,
        `${path}[${index}]`,
        "invalid-string",
        `${path}[${index}] must be a non-empty string.`
      );
      return;
    }

    strings.push(item);
  });

  return strings;
}

function validateUniqueValues(
  values: readonly string[],
  path: string,
  code: string,
  issues: ValidationIssue[]
): void {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    if (seen.has(value)) {
      addIssue(issues, `${path}[${index}]`, code, `${path} contains duplicate value "${value}".`);
      return;
    }

    seen.add(value);
  });
}

function readNonNegativeInteger(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): number | undefined {
  const value = record[field];

  if (!Number.isInteger(value) || (value as number) < 0) {
    addIssue(issues, path, "invalid-non-negative-integer", `${path} must be a non-negative integer.`);
    return undefined;
  }

  return value as number;
}

function readPositiveInteger(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): number | undefined {
  const value = record[field];

  if (!Number.isInteger(value) || (value as number) < 1) {
    addIssue(issues, path, "invalid-positive-integer", `${path} must be a positive integer.`);
    return undefined;
  }

  return value as number;
}

function validateOptionalPositiveInteger(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): void {
  const value = record[field];

  if (value !== undefined && (!Number.isInteger(value) || (value as number) < 1)) {
    addIssue(issues, path, "invalid-positive-integer", `${path} must be a positive integer when provided.`);
  }
}

function validateStatus<TStatus extends string>(
  value: unknown,
  allowedValues: readonly TStatus[],
  path: string,
  issues: ValidationIssue[]
): TStatus | undefined {
  if (typeof value !== "string" || !allowedValues.includes(value as TStatus)) {
    addIssue(
      issues,
      path,
      "invalid-status",
      `${path} must be one of: ${allowedValues.join(", ")}.`
    );
    return undefined;
  }

  return value as TStatus;
}

function validatePresentationSide(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): PresentationSide | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value !== "BLUE" && value !== "RED") {
    addIssue(issues, path, "invalid-presentation-side", `${path} must be BLUE or RED when provided.`);
    return undefined;
  }

  return value;
}

function validateOptionalSeriesFormat(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): SeriesFormat | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !SERIES_FORMATS.includes(value as SeriesFormat)) {
    addIssue(issues, path, "invalid-series-format", `${path} must be one of: ${SERIES_FORMATS.join(", ")}.`);
    return undefined;
  }

  return value as SeriesFormat;
}

function validateOptionalStringArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): string[] | undefined {
  if (!Array.isArray(value)) {
    addIssue(issues, path, "required-array", `${path} must be an array of player IDs.`);
    return undefined;
  }

  const values: string[] = [];

  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      addIssue(issues, `${path}[${index}]`, "invalid-string", `${path}[${index}] must be a non-empty string.`);
      return;
    }

    values.push(item);
  });

  validateUniqueValues(values, path, "duplicate-player-display-order-id", issues);

  return values;
}

function validatePresentationScoreBySide(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    addIssue(issues, path, "required-object", `${path} must be an object with BLUE and RED scores.`);
    return;
  }

  readNonNegativeInteger(value, "BLUE", `${path}.BLUE`, issues);
  readNonNegativeInteger(value, "RED", `${path}.RED`, issues);
}

function validatePlayerDisplayOrderBySide(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    addIssue(issues, path, "required-object", `${path} must be an object with BLUE and RED player ID arrays.`);
    return;
  }

  validateOptionalStringArray(value.BLUE, `${path}.BLUE`, issues);
  validateOptionalStringArray(value.RED, `${path}.RED`, issues);
}

function validateMatchPresentation(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    addIssue(issues, path, "required-object", `${path} must be an object when provided.`);
    return;
  }

  validateOptionalString(value, "matchLabel", `${path}.matchLabel`, issues);
  validateOptionalString(value, "patchLabel", `${path}.patchLabel`, issues);
  validateOptionalString(value, "sideStatusLabel", `${path}.sideStatusLabel`, issues);
  validateOptionalSeriesFormat(value.seriesFormat, `${path}.seriesFormat`, issues);
  validateOptionalPositiveInteger(value, "gameNumber", `${path}.gameNumber`, issues);
  validatePresentationScoreBySide(value.scoreBySide, `${path}.scoreBySide`, issues);
  validatePresentationSide(value.firstPickSide, `${path}.firstPickSide`, issues);
  validatePlayerDisplayOrderBySide(
    value.playerDisplayOrderBySide,
    `${path}.playerDisplayOrderBySide`,
    issues
  );
}

function validateMatchScoreValues(
  score: unknown,
  format: MatchFormat | undefined,
  path: string,
  issues: ValidationIssue[]
): Match["score"] | undefined {
  if (!isRecord(score)) {
    addIssue(issues, path, "required-object", `${path} must be an object with blue and red scores.`);
    return undefined;
  }

  const blue = readNonNegativeInteger(score, "blue", `${path}.blue`, issues);
  const red = readNonNegativeInteger(score, "red", `${path}.red`, issues);

  if (blue === undefined || red === undefined || format === undefined) {
    return undefined;
  }

  const maxGames = getMatchFormatGameCount(format);
  const winsRequired = getMatchFormatWinsRequired(format);

  if (blue + red > maxGames) {
    addIssue(issues, path, "score-exceeds-format", `${path} cannot exceed ${maxGames} total games for ${format}.`);
  }

  if (blue > winsRequired || red > winsRequired) {
    addIssue(
      issues,
      path,
      "score-exceeds-wins-required",
      `${path} cannot exceed ${winsRequired} wins for ${format}.`
    );
  }

  return { blue, red };
}

function validateArrayField(
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: ValidationIssue[]
): unknown[] {
  const value = record[field];

  if (!Array.isArray(value)) {
    addIssue(issues, path, "required-array", `${path} must be an array.`);
    return [];
  }

  return value;
}

function collectUniqueIds<TItem extends { id: string }>(
  items: readonly TItem[],
  path: string,
  entityName: string,
  issues: ValidationIssue[]
): Set<string> {
  const ids = new Set<string>();

  items.forEach((item, index) => {
    if (ids.has(item.id)) {
      addIssue(
        issues,
        `${path}[${index}].id`,
        "duplicate-id",
        `${entityName} ID "${item.id}" is duplicated.`
      );
      return;
    }

    ids.add(item.id);
  });

  return ids;
}

export function validateEventInfo(
  eventInfo: unknown,
  options: EventInfoValidationOptions = {}
): ValidationResult<EventInfo> {
  const path = options.path ?? "event";
  const issues: ValidationIssue[] = [];

  if (!isRecord(eventInfo)) {
    addIssue(issues, path, "required-object", `${path} must be an event object.`);
    return invalid<EventInfo>(issues);
  }

  readRequiredString(eventInfo, "id", `${path}.id`, issues);
  readRequiredString(eventInfo, "name", `${path}.name`, issues);
  validateOptionalString(eventInfo, "shortName", `${path}.shortName`, issues);
  validateOptionalString(eventInfo, "organizer", `${path}.organizer`, issues);
  validateOptionalString(eventInfo, "venue", `${path}.venue`, issues);
  validateOptionalDateString(eventInfo, "startDate", `${path}.startDate`, issues);
  validateOptionalDateString(eventInfo, "endDate", `${path}.endDate`, issues);
  readRequiredString(eventInfo, "timezone", `${path}.timezone`, issues);
  readRequiredString(eventInfo, "defaultLanguage", `${path}.defaultLanguage`, issues);

  const gameCodes = readStringArray(eventInfo, "gameCodes", `${path}.gameCodes`, issues, {
    minLength: 1
  });

  if (gameCodes) {
    validateUniqueValues(gameCodes, `${path}.gameCodes`, "duplicate-game-code", issues);
  }

  validateOptionalJsonObject(eventInfo, "metadata", `${path}.metadata`, issues);

  const startDate = eventInfo.startDate;
  const endDate = eventInfo.endDate;

  if (
    typeof startDate === "string" &&
    typeof endDate === "string" &&
    !Number.isNaN(Date.parse(startDate)) &&
    !Number.isNaN(Date.parse(endDate)) &&
    Date.parse(endDate) < Date.parse(startDate)
  ) {
    addIssue(issues, `${path}.endDate`, "end-before-start", `${path}.endDate cannot be before startDate.`);
  }

  return result<EventInfo>(eventInfo, issues);
}

export function validateTeam(team: unknown, options: TeamValidationOptions = {}): ValidationResult<Team> {
  const path = options.path ?? "team";
  const issues: ValidationIssue[] = [];

  if (!isRecord(team)) {
    addIssue(issues, path, "required-object", `${path} must be a team object.`);
    return invalid<Team>(issues);
  }

  readRequiredString(team, "id", `${path}.id`, issues);
  readRequiredString(team, "name", `${path}.name`, issues);
  readRequiredString(team, "shortName", `${path}.shortName`, issues);
  validateOptionalString(team, "logoUrl", `${path}.logoUrl`, issues);
  validateOptionalString(team, "logoAssetPath", `${path}.logoAssetPath`, issues);
  validateOptionalString(team, "countryCode", `${path}.countryCode`, issues);
  validateOptionalString(team, "primaryColor", `${path}.primaryColor`, issues);
  validateOptionalString(team, "secondaryColor", `${path}.secondaryColor`, issues);
  validateOptionalJsonObject(team, "metadata", `${path}.metadata`, issues);

  return result<Team>(team, issues);
}

export function validatePlayer(
  player: unknown,
  options: PlayerValidationOptions = {}
): ValidationResult<Player> {
  const path = options.path ?? "player";
  const issues: ValidationIssue[] = [];

  if (!isRecord(player)) {
    addIssue(issues, path, "required-object", `${path} must be a player object.`);
    return invalid<Player>(issues);
  }

  readRequiredString(player, "id", `${path}.id`, issues);
  const teamId = readRequiredString(player, "teamId", `${path}.teamId`, issues);
  validateOptionalString(player, "handle", `${path}.handle`, issues);
  readRequiredString(player, "displayName", `${path}.displayName`, issues);
  validateOptionalString(player, "realName", `${path}.realName`, issues);
  validateOptionalString(player, "role", `${path}.role`, issues);
  validateOptionalString(player, "nationality", `${path}.nationality`, issues);
  validateOptionalString(player, "photoUrl", `${path}.photoUrl`, issues);
  validateOptionalJsonObject(player, "metadata", `${path}.metadata`, issues);

  if (teamId && !hasId(options.teamIds, teamId)) {
    addIssue(issues, `${path}.teamId`, "unknown-team", `${path}.teamId must reference a known team.`);
  }

  return result<Player>(player, issues);
}

export function validateSponsor(
  sponsor: unknown,
  options: SponsorValidationOptions = {}
): ValidationResult<Sponsor> {
  const path = options.path ?? "sponsor";
  const issues: ValidationIssue[] = [];

  if (!isRecord(sponsor)) {
    addIssue(issues, path, "required-object", `${path} must be a sponsor object.`);
    return invalid<Sponsor>(issues);
  }

  readRequiredString(sponsor, "id", `${path}.id`, issues);
  readRequiredString(sponsor, "name", `${path}.name`, issues);
  readRequiredString(sponsor, "logoUrl", `${path}.logoUrl`, issues);
  validateOptionalString(sponsor, "websiteUrl", `${path}.websiteUrl`, issues);
  validateOptionalJsonObject(sponsor, "metadata", `${path}.metadata`, issues);

  const slots = readStringArray(sponsor, "slots", `${path}.slots`, issues, { minLength: 1 });

  if (slots) {
    validateUniqueValues(slots, `${path}.slots`, "duplicate-sponsor-slot", issues);

    slots.forEach((slot, index) => {
      if (!SPONSOR_SLOTS.includes(slot as SponsorSlot)) {
        addIssue(
          issues,
          `${path}.slots[${index}]`,
          "invalid-sponsor-slot",
          `${path}.slots[${index}] must be one of: ${SPONSOR_SLOTS.join(", ")}.`
        );
      }
    });
  }

  return result<Sponsor>(sponsor, issues);
}

export function validateMatch(match: unknown, options: MatchValidationOptions = {}): ValidationResult<Match> {
  const path = options.path ?? "match";
  const issues: ValidationIssue[] = [];

  if (!isRecord(match)) {
    addIssue(issues, path, "required-object", `${path} must be a match object.`);
    return invalid<Match>(issues);
  }

  readRequiredString(match, "id", `${path}.id`, issues);
  const eventId = readRequiredString(match, "eventId", `${path}.eventId`, issues);
  const gameCode = readRequiredString(match, "gameCode", `${path}.gameCode`, issues);
  readRequiredString(match, "title", `${path}.title`, issues);

  const format = isMatchFormat(match.format) ? match.format : undefined;
  if (!format) {
    addIssue(issues, `${path}.format`, "invalid-match-format", `${path}.format must be one of: BO1, BO3, BO5, BO7.`);
  }

  if (eventId && !hasId(options.eventIds, eventId)) {
    addIssue(issues, `${path}.eventId`, "unknown-event", `${path}.eventId must reference a known event.`);
  }

  if (gameCode && !hasId(options.gameCodes, gameCode)) {
    addIssue(issues, `${path}.gameCode`, "unsupported-game-code", `${path}.gameCode must be enabled for the event.`);
  }

  if (!isRecord(match.teams)) {
    addIssue(issues, `${path}.teams`, "required-object", `${path}.teams must contain blue and red team IDs.`);
  } else {
    const blueTeamId = readRequiredString(match.teams, "blue", `${path}.teams.blue`, issues);
    const redTeamId = readRequiredString(match.teams, "red", `${path}.teams.red`, issues);

    if (blueTeamId && !hasId(options.teamIds, blueTeamId)) {
      addIssue(issues, `${path}.teams.blue`, "unknown-team", `${path}.teams.blue must reference a known team.`);
    }

    if (redTeamId && !hasId(options.teamIds, redTeamId)) {
      addIssue(issues, `${path}.teams.red`, "unknown-team", `${path}.teams.red must reference a known team.`);
    }

    if (blueTeamId && redTeamId && blueTeamId === redTeamId) {
      addIssue(issues, `${path}.teams`, "duplicate-match-team", `${path}.teams must reference two distinct teams.`);
    }
  }

  const score = validateMatchScoreValues(match.score, format, `${path}.score`, issues);
  const currentGameNumber = readPositiveInteger(match, "currentGameNumber", `${path}.currentGameNumber`, issues);
  const status = validateStatus<MatchStatus>(match.status, MATCH_STATUSES, `${path}.status`, issues);
  validateOptionalDateString(match, "scheduledStartTime", `${path}.scheduledStartTime`, issues);
  validateMatchPresentation(match.presentation, `${path}.presentation`, issues);
  validateOptionalJsonObject(match, "metadata", `${path}.metadata`, issues);

  if (format && currentGameNumber !== undefined) {
    const maxGames = getMatchFormatGameCount(format);

    if (currentGameNumber > maxGames) {
      addIssue(
        issues,
        `${path}.currentGameNumber`,
        "current-game-out-of-range",
        `${path}.currentGameNumber cannot exceed ${maxGames} for ${format}.`
      );
    }
  }

  if (format && score && status === "COMPLETED") {
    const winsRequired = getMatchFormatWinsRequired(format);

    if (score.blue < winsRequired && score.red < winsRequired) {
      addIssue(
        issues,
        `${path}.score`,
        "completed-match-missing-winner-score",
        `${path}.score must include a team with ${winsRequired} wins when status is COMPLETED.`
      );
    }
  }

  if (format && options.games && currentGameNumber !== undefined) {
    const matchId = typeof match.id === "string" ? match.id : undefined;
    const gamesForMatch = matchId ? getMatchGames(matchId, options.games) : [];
    const seenGameNumbers = new Set<number>();
    const maxGames = getMatchFormatGameCount(format);

    gamesForMatch.forEach((game) => {
      if (game.gameNumber > maxGames) {
        addIssue(
          issues,
          `${path}.games`,
          "game-number-exceeds-format",
          `Game ${game.id} cannot exceed ${maxGames} games for ${format}.`
        );
      }

      if (seenGameNumbers.has(game.gameNumber)) {
        addIssue(
          issues,
          `${path}.games`,
          "duplicate-game-number",
          `Game number ${game.gameNumber} is duplicated for match ${matchId}.`
        );
      }

      seenGameNumbers.add(game.gameNumber);
    });

    if (gamesForMatch.length > 0 && !seenGameNumbers.has(currentGameNumber)) {
      addIssue(
        issues,
        `${path}.currentGameNumber`,
        "current-game-not-found",
        `${path}.currentGameNumber must reference an existing game instance when games are provided.`
      );
    }

    if (gamesForMatch.length > maxGames) {
      addIssue(
        issues,
        `${path}.games`,
        "too-many-games",
        `${path}.games cannot contain more than ${maxGames} game instances for ${format}.`
      );
    }
  }

  return result<Match>(match, issues);
}

export function validateGameInstance(
  gameInstance: unknown,
  options: GameInstanceValidationOptions = {}
): ValidationResult<GameInstance> {
  const path = options.path ?? "game";
  const issues: ValidationIssue[] = [];

  if (!isRecord(gameInstance)) {
    addIssue(issues, path, "required-object", `${path} must be a game instance object.`);
    return invalid<GameInstance>(issues);
  }

  readRequiredString(gameInstance, "id", `${path}.id`, issues);
  const matchId = readRequiredString(gameInstance, "matchId", `${path}.matchId`, issues);
  const gameNumber = readPositiveInteger(gameInstance, "gameNumber", `${path}.gameNumber`, issues);
  const gameCode = readRequiredString(gameInstance, "gameCode", `${path}.gameCode`, issues);
  const blueTeamId = readRequiredString(gameInstance, "blueTeamId", `${path}.blueTeamId`, issues);
  const redTeamId = readRequiredString(gameInstance, "redTeamId", `${path}.redTeamId`, issues);
  const winnerTeamId = gameInstance.winnerTeamId;

  validateOptionalString(gameInstance, "winnerTeamId", `${path}.winnerTeamId`, issues);
  validateOptionalString(gameInstance, "draftId", `${path}.draftId`, issues);
  const status = validateStatus<GameStatus>(gameInstance.status, GAME_STATUSES, `${path}.status`, issues);
  validateOptionalDateString(gameInstance, "startedAt", `${path}.startedAt`, issues);
  validateOptionalDateString(gameInstance, "completedAt", `${path}.completedAt`, issues);
  validateOptionalJsonObject(gameInstance, "metadata", `${path}.metadata`, issues);

  if (matchId && !hasId(options.matchIds, matchId)) {
    addIssue(issues, `${path}.matchId`, "unknown-match", `${path}.matchId must reference a known match.`);
  }

  if (blueTeamId && !hasId(options.teamIds, blueTeamId)) {
    addIssue(issues, `${path}.blueTeamId`, "unknown-team", `${path}.blueTeamId must reference a known team.`);
  }

  if (redTeamId && !hasId(options.teamIds, redTeamId)) {
    addIssue(issues, `${path}.redTeamId`, "unknown-team", `${path}.redTeamId must reference a known team.`);
  }

  if (blueTeamId && redTeamId && blueTeamId === redTeamId) {
    addIssue(issues, path, "duplicate-game-team", `${path} must reference two distinct teams.`);
  }

  if (
    typeof winnerTeamId === "string" &&
    winnerTeamId.trim().length > 0 &&
    winnerTeamId !== blueTeamId &&
    winnerTeamId !== redTeamId
  ) {
    addIssue(issues, `${path}.winnerTeamId`, "winner-not-in-game", `${path}.winnerTeamId must be blue or red team.`);
  }

  if (status === "COMPLETED" && (typeof winnerTeamId !== "string" || winnerTeamId.trim().length === 0)) {
    addIssue(
      issues,
      `${path}.winnerTeamId`,
      "completed-game-missing-winner",
      `${path}.winnerTeamId is required when status is COMPLETED.`
    );
  }

  if (options.match) {
    const match = options.match;
    const maxGames = getMatchFormatGameCount(match.format);

    if (matchId && matchId !== match.id) {
      addIssue(issues, `${path}.matchId`, "match-mismatch", `${path}.matchId must match the provided match.`);
    }

    if (gameCode && gameCode !== match.gameCode) {
      addIssue(issues, `${path}.gameCode`, "game-code-mismatch", `${path}.gameCode must match the parent match.`);
    }

    if (blueTeamId && blueTeamId !== match.teams.blue) {
      addIssue(issues, `${path}.blueTeamId`, "blue-team-mismatch", `${path}.blueTeamId must match the parent match.`);
    }

    if (redTeamId && redTeamId !== match.teams.red) {
      addIssue(issues, `${path}.redTeamId`, "red-team-mismatch", `${path}.redTeamId must match the parent match.`);
    }

    if (gameNumber !== undefined && gameNumber > maxGames) {
      addIssue(
        issues,
        `${path}.gameNumber`,
        "game-number-exceeds-format",
        `${path}.gameNumber cannot exceed ${maxGames} for ${match.format}.`
      );
    }
  }

  return result<GameInstance>(gameInstance, issues);
}

export function validateMatchBundle(
  bundle: unknown,
  options: MatchBundleValidationOptions = {}
): ValidationResult<MatchBundle> {
  const path = options.path ?? "bundle";
  const issues: ValidationIssue[] = [];

  if (!isRecord(bundle)) {
    addIssue(issues, path, "required-object", `${path} must be a match bundle object.`);
    return invalid<MatchBundle>(issues);
  }

  const eventResult = validateEventInfo(bundle.event, { path: `${path}.event` });
  issues.push(...eventResult.issues);

  const teamItems = validateArrayField(bundle, "teams", `${path}.teams`, issues);
  const playerItems = validateArrayField(bundle, "players", `${path}.players`, issues);
  const sponsorItems = validateArrayField(bundle, "sponsors", `${path}.sponsors`, issues);
  const matchItems = validateArrayField(bundle, "matches", `${path}.matches`, issues);
  const gameItems = validateArrayField(bundle, "games", `${path}.games`, issues);

  const teams: Team[] = [];
  teamItems.forEach((team, index) => {
    const teamResult = validateTeam(team, { path: `${path}.teams[${index}]` });
    issues.push(...teamResult.issues);

    if (teamResult.valid) {
      teams.push(teamResult.value);
    }
  });
  const teamIds = collectUniqueIds(teams, `${path}.teams`, "Team", issues);

  const players: Player[] = [];
  playerItems.forEach((player, index) => {
    const playerResult = validatePlayer(player, {
      path: `${path}.players[${index}]`,
      teamIds
    });
    issues.push(...playerResult.issues);

    if (playerResult.valid) {
      players.push(playerResult.value);
    }
  });
  collectUniqueIds(players, `${path}.players`, "Player", issues);

  const sponsors: Sponsor[] = [];
  sponsorItems.forEach((sponsor, index) => {
    const sponsorResult = validateSponsor(sponsor, { path: `${path}.sponsors[${index}]` });
    issues.push(...sponsorResult.issues);

    if (sponsorResult.valid) {
      sponsors.push(sponsorResult.value);
    }
  });
  collectUniqueIds(sponsors, `${path}.sponsors`, "Sponsor", issues);

  const eventIds = eventResult.valid ? [eventResult.value.id] : undefined;
  const gameCodes = eventResult.valid ? eventResult.value.gameCodes : undefined;

  const matches: Match[] = [];
  matchItems.forEach((match, index) => {
    const matchResult = validateMatch(match, {
      path: `${path}.matches[${index}]`,
      eventIds,
      gameCodes,
      teamIds
    });
    issues.push(...matchResult.issues);

    if (matchResult.valid) {
      matches.push(matchResult.value);
    }
  });
  const matchIds = collectUniqueIds(matches, `${path}.matches`, "Match", issues);
  const matchesById = new Map(matches.map((match) => [match.id, match]));

  const games: GameInstance[] = [];
  gameItems.forEach((game, index) => {
    const parentMatch =
      isRecord(game) && typeof game.matchId === "string" ? matchesById.get(game.matchId) : undefined;
    const gameResult = validateGameInstance(game, {
      path: `${path}.games[${index}]`,
      matchIds,
      teamIds,
      match: parentMatch
    });
    issues.push(...gameResult.issues);

    if (gameResult.valid) {
      games.push(gameResult.value);
    }
  });
  collectUniqueIds(games, `${path}.games`, "Game", issues);

  matches.forEach((match, index) => {
    const crossCheckResult = validateMatch(match, {
      path: `${path}.matches[${index}]`,
      eventIds,
      gameCodes,
      teamIds,
      games
    });
    issues.push(...crossCheckResult.issues);
  });

  if (issues.length > 0 || !eventResult.valid) {
    return invalid<MatchBundle>(issues);
  }

  return valid({
    event: eventResult.value,
    teams,
    players,
    sponsors,
    matches,
    games
  });
}

export function createUpdatedMatchScore(
  match: Match,
  score: Match["score"]
): ValidationResult<Match> {
  const issues: ValidationIssue[] = [];
  const updatedMatch = { ...match, score };

  validateMatchScoreValues(score, match.format, "score", issues);

  if (issues.length > 0) {
    return invalid<Match>(issues);
  }

  return valid(updatedMatch);
}
