import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import { validateDraftRuleset } from "@mmbt/core-draft";
import {
  validateEventInfo,
  validateGameInstance,
  validateMatch,
  validateMatchBundle,
  validatePlayer,
  validateSponsor,
  validateTeam
} from "@mmbt/core-match";
import type {
  DraftRuleset,
  EventInfo,
  GameCode,
  GameInstance,
  Match,
  Player,
  Sponsor,
  SystemHealth,
  Team,
  ThemeConfig
} from "@mmbt/shared-types";
import { validateThemeConfig } from "@mmbt/theme-engine";

import { getRepositoryRoot, toDisplayPath, toPortablePath } from "./paths.js";
import { fail, ok, type AppResult } from "./result.js";

const EXPECTED_SCHEMA_VERSION = "event-package.v0.1";

function unsafeName(...parts: string[]): string {
  return parts.join("").toLocaleLowerCase();
}

const UNSAFE_FIELD_NAMES = new Set(
  [
    unsafeName("auto", "Pick"),
    unsafeName("auto", "Ban"),
    unsafeName("player", "Automation"),
    unsafeName("client", "Sync"),
    unsafeName("champion", "Select", "Sync"),
    unsafeName("live", "Client"),
    unsafeName("riot", "Api"),
    unsafeName("l", "cu"),
    unsafeName("l", "cu", "Reader"),
    unsafeName("data", "Dragon"),
    unsafeName("data", "dragon", "Sync"),
    unsafeName("garena", "Api"),
    unsafeName("tencent", "Api"),
    unsafeName("timi", "Api"),
    unsafeName("obs", "Web", "Socket"),
    unsafeName("v", "Mix", "Api"),
    unsafeName("cloud", "Sync"),
    unsafeName("database", "Url"),
    unsafeName("api", "Key"),
    unsafeName("sec", "ret"),
    unsafeName("sec", "rets"),
    unsafeName("hidden", "Competitive", "Information"),
    unsafeName("hidden", "Opponent", "Data"),
    unsafeName("hidden", "Info")
  ]
);

interface EventPackageDefaults {
  matchId: string;
  gameCode: GameCode;
  themeId: string;
  rulesetByGameCode: Record<string, string>;
  productionLogPath: string;
}

interface EventPackageEventFile {
  schemaVersion: string;
  packageId: string;
  event: EventInfo;
  defaults: EventPackageDefaults;
}

export interface EventPackageGameInstance extends GameInstance {
  rulesetId: string;
  themeId?: string;
}

export interface EventPackageMatch extends Match {
  sponsorSlotIds?: string[];
  themeId?: string;
  games: EventPackageGameInstance[];
}

export interface EventPackageValidationIssue {
  path: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface LoadedEventPackage {
  packageId: string;
  packagePath: string;
  schemaVersion: string;
  event: EventInfo;
  defaults: EventPackageDefaults;
  teams: Team[];
  players: Player[];
  sponsors: Sponsor[];
  matches: EventPackageMatch[];
  games: EventPackageGameInstance[];
  rulesets: DraftRuleset[];
  themes: ThemeConfig[];
  assetStatus: SystemHealth["assetStatus"];
  validation: {
    valid: true;
    warnings: EventPackageValidationIssue[];
  };
  productionLogPath: string;
}

export interface EventPackageSummary {
  packageId: string;
  packagePath: string;
  schemaVersion: string;
  event: EventInfo;
  defaults: EventPackageDefaults;
  counts: {
    matches: number;
    games: number;
    teams: number;
    players: number;
    sponsors: number;
    rulesets: number;
    themes: number;
  };
  rulesets: Array<Pick<DraftRuleset, "id" | "gameCode" | "name">>;
  themes: Array<Pick<ThemeConfig, "id" | "name" | "version">>;
  assetStatus: SystemHealth["assetStatus"];
  validation: LoadedEventPackage["validation"];
}

export interface LoadEventPackageOptions {
  packageRoot: string;
  repositoryRoot?: string;
}

type JsonFileMap = Map<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: EventPackageValidationIssue[],
  path: string,
  code: string,
  message: string,
  severity: EventPackageValidationIssue["severity"] = "error"
): void {
  issues.push({ path, code, message, severity });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error.";
}

function createLoadFailure(
  code: string,
  message: string,
  details: unknown,
  httpStatus = 500
): AppResult<LoadedEventPackage> {
  return fail({
    code,
    message,
    httpStatus,
    details
  });
}

function getLoadedValue<TValue>(result: AppResult<TValue>): TValue {
  if (!result.ok) {
    throw new Error("Event package loader attempted to read a failed load step.");
  }

  return result.value;
}

function resolvePackageRoot(packageRoot: string, repositoryRoot: string): string {
  return resolve(isAbsolute(packageRoot) ? packageRoot : join(repositoryRoot, packageRoot));
}

function ensureInsidePackageRoot(packageRoot: string, candidatePath: string): boolean {
  const pathFromRoot = relative(packageRoot, candidatePath);

  return pathFromRoot.length === 0 || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot));
}

function readJsonFile(packageRoot: string, relativePath: string): AppResult<unknown> {
  const absolutePath = resolve(packageRoot, relativePath);

  if (!ensureInsidePackageRoot(packageRoot, absolutePath)) {
    return fail({
      code: "EVENT_PACKAGE_PATH_UNSAFE",
      message: "Event package file path must stay inside the package root.",
      httpStatus: 400,
      details: { relativePath }
    });
  }

  if (!existsSync(absolutePath)) {
    return fail({
      code: "EVENT_PACKAGE_FILE_MISSING",
      message: "Required event package file is missing.",
      httpStatus: 400,
      details: { relativePath }
    });
  }

  try {
    return ok(JSON.parse(readFileSync(absolutePath, "utf8")));
  } catch (error) {
    return fail({
      code: "EVENT_PACKAGE_JSON_INVALID",
      message: "Event package JSON file could not be parsed.",
      httpStatus: 400,
      details: {
        relativePath,
        reason: getErrorMessage(error)
      }
    });
  }
}

function readJsonDirectory(packageRoot: string, relativePath: string): AppResult<JsonFileMap> {
  const absolutePath = resolve(packageRoot, relativePath);

  if (!ensureInsidePackageRoot(packageRoot, absolutePath)) {
    return fail({
      code: "EVENT_PACKAGE_PATH_UNSAFE",
      message: "Event package directory path must stay inside the package root.",
      httpStatus: 400,
      details: { relativePath }
    });
  }

  if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
    return fail({
      code: "EVENT_PACKAGE_FILE_MISSING",
      message: "Required event package directory is missing.",
      httpStatus: 400,
      details: { relativePath }
    });
  }

  const jsonFileNames = readdirSync(absolutePath)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  if (jsonFileNames.length === 0) {
    return fail({
      code: "EVENT_PACKAGE_FILE_MISSING",
      message: "Required event package directory has no JSON files.",
      httpStatus: 400,
      details: { relativePath }
    });
  }

  const files: JsonFileMap = new Map();

  for (const fileName of jsonFileNames) {
    const fileResult = readJsonFile(packageRoot, join(relativePath, fileName));

    if (!fileResult.ok) {
      return fail(fileResult.error);
    }

    files.set(fileName, fileResult.value);
  }

  return ok(files);
}

function readRequiredArray(
  record: unknown,
  field: string,
  path: string,
  issues: EventPackageValidationIssue[]
): unknown[] {
  if (!isRecord(record) || !Array.isArray(record[field])) {
    addIssue(issues, path, "required-array", `${path} must be an array.`);
    return [];
  }

  return record[field];
}

function readRequiredString(
  record: unknown,
  field: string,
  path: string,
  issues: EventPackageValidationIssue[]
): string | undefined {
  if (!isRecord(record) || typeof record[field] !== "string" || record[field].trim().length === 0) {
    addIssue(issues, path, "required-string", `${path} must be a non-empty string.`);
    return undefined;
  }

  return record[field];
}

function readDefaults(eventFile: unknown, issues: EventPackageValidationIssue[]): EventPackageDefaults | undefined {
  if (!isRecord(eventFile) || !isRecord(eventFile.defaults)) {
    addIssue(issues, "event.json.defaults", "required-object", "event.json.defaults must be an object.");
    return undefined;
  }

  const matchId = readRequiredString(eventFile.defaults, "matchId", "event.json.defaults.matchId", issues);
  const gameCode = readRequiredString(eventFile.defaults, "gameCode", "event.json.defaults.gameCode", issues);
  const themeId = readRequiredString(eventFile.defaults, "themeId", "event.json.defaults.themeId", issues);
  const productionLogPath = readRequiredString(
    eventFile.defaults,
    "productionLogPath",
    "event.json.defaults.productionLogPath",
    issues
  );

  if (!isRecord(eventFile.defaults.rulesetByGameCode)) {
    addIssue(
      issues,
      "event.json.defaults.rulesetByGameCode",
      "required-object",
      "event.json.defaults.rulesetByGameCode must be an object."
    );
  }

  if (!matchId || !gameCode || !themeId || !productionLogPath || !isRecord(eventFile.defaults.rulesetByGameCode)) {
    return undefined;
  }

  const rulesetByGameCode: Record<string, string> = {};

  Object.entries(eventFile.defaults.rulesetByGameCode).forEach(([key, value]) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      addIssue(
        issues,
        `event.json.defaults.rulesetByGameCode.${key}`,
        "required-string",
        "Default ruleset IDs must be non-empty strings."
      );
      return;
    }

    rulesetByGameCode[key] = value;
  });

  return {
    matchId,
    gameCode,
    themeId,
    rulesetByGameCode,
    productionLogPath
  };
}

function walkJson(
  value: unknown,
  visitor: (key: string, childValue: unknown, path: string) => void,
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkJson(item, visitor, `${path}[${index}]`));
    return;
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, childValue]) => {
      const childPath = `${path}.${key}`;
      visitor(key, childValue, childPath);
      walkJson(childValue, visitor, childPath);
    });
  }
}

function looksLikeLocalReference(key: string, path: string): boolean {
  return key.endsWith("Url") || key.endsWith("Path") || path.includes(".assets.");
}

function looksLikeAssetReference(key: string, path: string): boolean {
  return key.endsWith("Url") || path.includes(".assets.");
}

function validateLocalReference(
  packageRoot: string,
  reference: string,
  path: string,
  issues: EventPackageValidationIssue[],
  assetStatus: SystemHealth["assetStatus"],
  options: { mustExist: boolean }
): void {
  const trimmedReference = reference.trim();

  if (
    trimmedReference.length === 0 ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmedReference) ||
    trimmedReference.startsWith("/") ||
    trimmedReference.startsWith("\\") ||
    trimmedReference.startsWith("//") ||
    trimmedReference.includes("..") ||
    trimmedReference.includes("\\") ||
    trimmedReference.includes("?") ||
    trimmedReference.includes("#")
  ) {
    addIssue(
      issues,
      path,
      "local-reference-invalid",
      `${path} must be a local relative path inside the event package.`
    );
    return;
  }

  const absolutePath = resolve(packageRoot, trimmedReference);

  if (!ensureInsidePackageRoot(packageRoot, absolutePath)) {
    addIssue(
      issues,
      path,
      "local-reference-escapes-package",
      `${path} must not resolve outside the event package.`
    );
    return;
  }

  if (options.mustExist && !existsSync(absolutePath)) {
    const portableReference = toPortablePath(trimmedReference);
    assetStatus.missingAssets.push(portableReference);
    assetStatus.warnings.push(`Missing optional local asset: ${portableReference}.`);
  }
}

function validatePackageGuardrails(
  packageRoot: string,
  files: readonly unknown[],
  issues: EventPackageValidationIssue[],
  assetStatus: SystemHealth["assetStatus"]
): void {
  files.forEach((file) => {
    walkJson(file, (key, value, path) => {
      const normalizedKey = key.toLocaleLowerCase();

      if (UNSAFE_FIELD_NAMES.has(normalizedKey)) {
        addIssue(
          issues,
          path,
          "unsafe-field",
          `${path} is not allowed in a v0.1 local-first event package.`
        );
      }

      if (typeof value !== "string") {
        return;
      }

      if (/https?:\/\//i.test(value) || /file:\/\//i.test(value) || value.startsWith("//")) {
        addIssue(issues, path, "remote-reference-forbidden", `${path} must not require a remote or absolute URL.`);
      }

      if (looksLikeLocalReference(key, path)) {
        validateLocalReference(packageRoot, value, path, issues, assetStatus, {
          mustExist: looksLikeAssetReference(key, path)
        });
      }
    });
  });
}

function collectCoreValidationIssues(
  sourceIssues: readonly { path?: string; code: string; message: string }[],
  issues: EventPackageValidationIssue[],
  fallbackPath: string
): void {
  sourceIssues.forEach((issue) => {
    addIssue(issues, issue.path ?? fallbackPath, issue.code, issue.message);
  });
}

function collectDraftValidationIssues(
  sourceIssues: readonly { code: string; message: string }[],
  issues: EventPackageValidationIssue[],
  fallbackPath: string
): void {
  sourceIssues.forEach((issue) => {
    addIssue(issues, fallbackPath, issue.code, issue.message);
  });
}

function validateEntityLinkages(
  eventFile: EventPackageEventFile | undefined,
  teams: readonly Team[],
  sponsors: readonly Sponsor[],
  matches: readonly unknown[],
  games: readonly unknown[],
  rulesets: readonly DraftRuleset[],
  themes: readonly ThemeConfig[],
  issues: EventPackageValidationIssue[]
): void {
  if (!eventFile) {
    return;
  }

  const teamIds = new Set(teams.map((team) => team.id));
  const sponsorIds = new Set(sponsors.map((sponsor) => sponsor.id));
  const matchIds = new Set(matches.filter(isRecord).map((match) => String(match.id)));
  const rulesetIds = new Set(rulesets.map((ruleset) => ruleset.id));
  const themeIds = new Set(themes.map((theme) => theme.id));
  const gameCodes = new Set(eventFile.event.gameCodes);

  if (!matchIds.has(eventFile.defaults.matchId)) {
    addIssue(
      issues,
      "event.json.defaults.matchId",
      "unknown-default-match",
      "Default match ID must reference a loaded match."
    );
  }

  if (!gameCodes.has(eventFile.defaults.gameCode)) {
    addIssue(
      issues,
      "event.json.defaults.gameCode",
      "unknown-default-game-code",
      "Default game code must be listed in event.gameCodes."
    );
  }

  if (!themeIds.has(eventFile.defaults.themeId)) {
    addIssue(
      issues,
      "event.json.defaults.themeId",
      "unknown-default-theme",
      "Default theme ID must reference a loaded theme."
    );
  }

  Object.entries(eventFile.defaults.rulesetByGameCode).forEach(([gameCode, rulesetId]) => {
    if (!gameCodes.has(gameCode)) {
      addIssue(
        issues,
        `event.json.defaults.rulesetByGameCode.${gameCode}`,
        "unknown-default-ruleset-game-code",
        "Default ruleset game code must be listed in event.gameCodes."
      );
    }

    if (!rulesetIds.has(rulesetId)) {
      addIssue(
        issues,
        `event.json.defaults.rulesetByGameCode.${gameCode}`,
        "unknown-default-ruleset",
        "Default ruleset ID must reference a loaded ruleset."
      );
    }
  });

  matches.forEach((match, matchIndex) => {
    if (!isRecord(match)) {
      addIssue(issues, `matches.json.matches[${matchIndex}]`, "required-object", "Match entries must be objects.");
      return;
    }

    const matchPath = `matches.json.matches[${matchIndex}]`;

    if (!Array.isArray(match.games)) {
      addIssue(issues, `${matchPath}.games`, "required-array", "Match games must be an array.");
    }

    if (Array.isArray(match.sponsorSlotIds)) {
      match.sponsorSlotIds.forEach((sponsorSlotId, sponsorIndex) => {
        if (typeof sponsorSlotId !== "string" || !sponsorIds.has(sponsorSlotId)) {
          addIssue(
            issues,
            `${matchPath}.sponsorSlotIds[${sponsorIndex}]`,
            "unknown-sponsor",
            "Match sponsor slot IDs must reference loaded sponsors."
          );
        }
      });
    }

    if (typeof match.themeId === "string" && !themeIds.has(match.themeId)) {
      addIssue(issues, `${matchPath}.themeId`, "unknown-theme", "Match theme ID must reference a loaded theme.");
    }
  });

  games.forEach((game, gameIndex) => {
    if (!isRecord(game)) {
      addIssue(issues, `matches.json.games[${gameIndex}]`, "required-object", "Game entries must be objects.");
      return;
    }

    const gamePath = `matches.json.games[${gameIndex}]`;
    const rulesetId = readRequiredString(game, "rulesetId", `${gamePath}.rulesetId`, issues);

    if (rulesetId && !rulesetIds.has(rulesetId)) {
      addIssue(issues, `${gamePath}.rulesetId`, "unknown-ruleset", "Game ruleset ID must reference a loaded ruleset.");
    }

    if (typeof game.themeId === "string" && !themeIds.has(game.themeId)) {
      addIssue(issues, `${gamePath}.themeId`, "unknown-theme", "Game theme ID must reference a loaded theme.");
    }

    if (typeof game.blueTeamId === "string" && !teamIds.has(game.blueTeamId)) {
      addIssue(issues, `${gamePath}.blueTeamId`, "unknown-team", "Game blue team must reference a loaded team.");
    }

    if (typeof game.redTeamId === "string" && !teamIds.has(game.redTeamId)) {
      addIssue(issues, `${gamePath}.redTeamId`, "unknown-team", "Game red team must reference a loaded team.");
    }
  });
}

function validationError(issues: readonly EventPackageValidationIssue[]): AppResult<LoadedEventPackage> {
  return fail({
    code: "EVENT_PACKAGE_INVALID",
    message: "Event package failed validation.",
    httpStatus: 422,
    details: {
      issues: issues.filter((issue) => issue.severity === "error")
    }
  });
}

export function loadEventPackage(options: LoadEventPackageOptions): AppResult<LoadedEventPackage> {
  const repositoryRoot = options.repositoryRoot ?? getRepositoryRoot();
  const packageRoot = resolvePackageRoot(options.packageRoot, repositoryRoot);
  const packagePath = toDisplayPath(packageRoot, repositoryRoot);

  if (!existsSync(packageRoot)) {
    return createLoadFailure(
      "EVENT_PACKAGE_NOT_FOUND",
      "Event package path does not exist.",
      { packagePath },
      404
    );
  }

  if (!statSync(packageRoot).isDirectory()) {
    return createLoadFailure(
      "EVENT_PACKAGE_PATH_INVALID",
      "Event package path must be a directory.",
      { packagePath },
      400
    );
  }

  const requiredFiles = {
    eventFile: readJsonFile(packageRoot, "event.json"),
    teamsFile: readJsonFile(packageRoot, "teams.json"),
    playersFile: readJsonFile(packageRoot, "players.json"),
    sponsorsFile: readJsonFile(packageRoot, "sponsors.json"),
    matchesFile: readJsonFile(packageRoot, "matches.json"),
    rulesetFiles: readJsonDirectory(packageRoot, "rulesets"),
    themeFiles: readJsonDirectory(packageRoot, "themes")
  };

  for (const result of Object.values(requiredFiles)) {
    if (!result.ok) {
      return fail(result.error);
    }
  }

  const eventFile = getLoadedValue(requiredFiles.eventFile);
  const teamsFile = getLoadedValue(requiredFiles.teamsFile);
  const playersFile = getLoadedValue(requiredFiles.playersFile);
  const sponsorsFile = getLoadedValue(requiredFiles.sponsorsFile);
  const matchesFile = getLoadedValue(requiredFiles.matchesFile);
  const rulesetFiles = getLoadedValue(requiredFiles.rulesetFiles);
  const themeFiles = getLoadedValue(requiredFiles.themeFiles);
  const issues: EventPackageValidationIssue[] = [];
  const assetStatus: SystemHealth["assetStatus"] = {
    missingAssets: [],
    warnings: []
  };

  const rulesetFileValues = [...rulesetFiles.values()];
  const themeFileValues = [...themeFiles.values()];
  const files = [
    eventFile,
    teamsFile,
    playersFile,
    sponsorsFile,
    matchesFile,
    ...rulesetFileValues,
    ...themeFileValues
  ];

  validatePackageGuardrails(packageRoot, files, issues, assetStatus);

  if (!isRecord(eventFile)) {
    addIssue(issues, "event.json", "required-object", "event.json must contain an object.");
  }

  const schemaVersion = isRecord(eventFile)
    ? readRequiredString(eventFile, "schemaVersion", "event.json.schemaVersion", issues)
    : undefined;
  const packageId = isRecord(eventFile)
    ? readRequiredString(eventFile, "packageId", "event.json.packageId", issues)
    : undefined;
  const defaults = readDefaults(eventFile, issues);
  const event = isRecord(eventFile) ? eventFile.event : undefined;

  if (schemaVersion && schemaVersion !== EXPECTED_SCHEMA_VERSION) {
    addIssue(
      issues,
      "event.json.schemaVersion",
      "schema-version-unsupported",
      `event.json.schemaVersion must be ${EXPECTED_SCHEMA_VERSION}.`
    );
  }

  const eventResult = validateEventInfo(event, { path: "event.json.event" });
  collectCoreValidationIssues(eventResult.issues, issues, "event.json.event");

  const teamItems = readRequiredArray(teamsFile, "teams", "teams.json.teams", issues);
  const playerItems = readRequiredArray(playersFile, "players", "players.json.players", issues);
  const sponsorItems = readRequiredArray(sponsorsFile, "sponsors", "sponsors.json.sponsors", issues);
  const matchItems = readRequiredArray(matchesFile, "matches", "matches.json.matches", issues);
  const gameItems = matchItems.flatMap((match) => (isRecord(match) && Array.isArray(match.games) ? match.games : []));

  const teamIds = new Set<string>();
  const teams: Team[] = [];
  teamItems.forEach((team, index) => {
    const result = validateTeam(team, { path: `teams.json.teams[${index}]` });
    collectCoreValidationIssues(result.issues, issues, `teams.json.teams[${index}]`);

    if (result.valid) {
      if (teamIds.has(result.value.id)) {
        addIssue(issues, `teams.json.teams[${index}].id`, "duplicate-id", "Team IDs must be unique.");
      }

      teamIds.add(result.value.id);
      teams.push(result.value);
    }
  });

  const players: Player[] = [];
  playerItems.forEach((player, index) => {
    const result = validatePlayer(player, {
      path: `players.json.players[${index}]`,
      teamIds
    });
    collectCoreValidationIssues(result.issues, issues, `players.json.players[${index}]`);

    if (result.valid) {
      players.push(result.value);
    }
  });

  const sponsors: Sponsor[] = [];
  sponsorItems.forEach((sponsor, index) => {
    const result = validateSponsor(sponsor, { path: `sponsors.json.sponsors[${index}]` });
    collectCoreValidationIssues(result.issues, issues, `sponsors.json.sponsors[${index}]`);

    if (result.valid) {
      sponsors.push(result.value);
    }
  });

  const gameCodes = eventResult.valid ? eventResult.value.gameCodes : [];
  const matches: Match[] = [];
  matchItems.forEach((match, index) => {
    const result = validateMatch(match, {
      path: `matches.json.matches[${index}]`,
      eventIds: eventResult.valid ? [eventResult.value.id] : undefined,
      gameCodes,
      teamIds
    });
    collectCoreValidationIssues(result.issues, issues, `matches.json.matches[${index}]`);

    if (result.valid) {
      matches.push(result.value);
    }
  });

  const matchIds = new Set(matches.map((match) => match.id));
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const games: GameInstance[] = [];

  gameItems.forEach((game, index) => {
    const parentMatch = isRecord(game) && typeof game.matchId === "string" ? matchesById.get(game.matchId) : undefined;
    const result = validateGameInstance(game, {
      path: `matches.json.games[${index}]`,
      matchIds,
      teamIds,
      match: parentMatch
    });
    collectCoreValidationIssues(result.issues, issues, `matches.json.games[${index}]`);

    if (result.valid) {
      games.push(result.value);
    }
  });

  const bundleResult = validateMatchBundle({
    event,
    teams: teamItems,
    players: playerItems,
    sponsors: sponsorItems,
    matches: matchItems,
    games: gameItems
  });
  collectCoreValidationIssues(bundleResult.issues, issues, "event-package");

  const rulesets: DraftRuleset[] = [];
  for (const [fileName, ruleset] of rulesetFiles.entries()) {
    const result = validateDraftRuleset(ruleset);
    collectDraftValidationIssues(result.issues ?? [], issues, `rulesets/${fileName}`);

    if (result.valid) {
      rulesets.push(ruleset as DraftRuleset);
    }
  }

  const themes: ThemeConfig[] = [];
  for (const [fileName, theme] of themeFiles.entries()) {
    const result = validateThemeConfig(theme, { path: `themes/${fileName}` });
    result.issues.forEach((issue: { path: string; code: string; message: string; severity: "error" | "warning" }) => {
      addIssue(issues, issue.path, issue.code, issue.message, issue.severity);
    });

    if (result.valid) {
      themes.push(theme as ThemeConfig);
    }
  }

  const eventPackageFile =
    eventResult.valid && packageId && schemaVersion && defaults
      ? {
          schemaVersion,
          packageId,
          event: eventResult.value,
          defaults
        }
      : undefined;

  validateEntityLinkages(eventPackageFile, teams, sponsors, matchItems, gameItems, rulesets, themes, issues);

  const errorIssues = issues.filter((issue) => issue.severity === "error");

  if (errorIssues.length > 0 || !eventPackageFile) {
    return validationError(issues);
  }

  const warningIssues = issues.filter((issue) => issue.severity === "warning");
  const productionLogPath = toPortablePath(eventPackageFile.defaults.productionLogPath);

  return ok({
    packageId: eventPackageFile.packageId,
    packagePath,
    schemaVersion: eventPackageFile.schemaVersion,
    event: eventPackageFile.event,
    defaults: eventPackageFile.defaults,
    teams,
    players,
    sponsors,
    matches: matchItems as EventPackageMatch[],
    games: gameItems as EventPackageGameInstance[],
    rulesets,
    themes,
    assetStatus,
    validation: {
      valid: true,
      warnings: warningIssues
    },
    productionLogPath
  });
}

export function createEventPackageSummary(snapshot: LoadedEventPackage): EventPackageSummary {
  return {
    packageId: snapshot.packageId,
    packagePath: snapshot.packagePath,
    schemaVersion: snapshot.schemaVersion,
    event: snapshot.event,
    defaults: snapshot.defaults,
    counts: {
      matches: snapshot.matches.length,
      games: snapshot.games.length,
      teams: snapshot.teams.length,
      players: snapshot.players.length,
      sponsors: snapshot.sponsors.length,
      rulesets: snapshot.rulesets.length,
      themes: snapshot.themes.length
    },
    rulesets: snapshot.rulesets.map((ruleset) => ({
      id: ruleset.id,
      gameCode: ruleset.gameCode,
      name: ruleset.name
    })),
    themes: snapshot.themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      version: theme.version
    })),
    assetStatus: snapshot.assetStatus,
    validation: snapshot.validation
  };
}
