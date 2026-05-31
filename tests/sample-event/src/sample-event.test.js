import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { URL, fileURLToPath } from "node:url";

import {
  validateEventInfo,
  validateGameInstance,
  validateMatch,
  validateMatchBundle,
  validatePlayer,
  validateSponsor,
  validateTeam
} from "../../../packages/core-match/src/index.ts";
import {
  createDraftState,
  validateDraftRuleset
} from "../../../packages/core-draft/src/index.ts";
import {
  createGameAdapterRegistry,
  getGameAdapter,
  listGameAdapters,
  validateGameAdapter
} from "../../../packages/game-adapters/src/index.ts";
import {
  loadThemeConfig,
  validateThemeConfig
} from "../../../packages/theme-engine/src/index.ts";
import { genericMobaAdapter } from "../../../games/generic-moba/src/adapter.ts";
import { lolSampleAdapter } from "../../../games/lol/src/adapter.ts";
import { aovSampleAdapter } from "../../../games/aov/src/adapter.ts";
import { hokSampleAdapter } from "../../../games/hok/src/adapter.ts";
import { describe, expect, it } from "vitest";

const sampleEventRoot = fileURLToPath(
  new URL("../../../event-packages/sample-event/", import.meta.url)
);

const expectedSchemaVersion = "event-package.v0.1";
const knownGameCodes = ["generic-moba", "lol", "aov", "hok"];
const requiredTopLevelJsonFiles = [
  "event.json",
  "teams.json",
  "players.json",
  "sponsors.json",
  "matches.json"
];
const expectedRulesetFiles = [
  "aov-standard.json",
  "generic-standard.json",
  "hok-standard.json",
  "lol-standard.json"
];
const sampleAdapters = [
  genericMobaAdapter,
  lolSampleAdapter,
  aovSampleAdapter,
  hokSampleAdapter
];
const unsafeFutureScopeFields = new Set(
  [
    "autoPick",
    "autoBan",
    "playerAutomation",
    "clientSync",
    "championSelectSync",
    "liveClient",
    "riotApi",
    "lcu",
    "dataDragon",
    "datadragonSync",
    "garenaApi",
    "tencentApi",
    "timiApi",
    "obsWebSocket",
    "vMixApi",
    "cloudSync",
    "databaseUrl",
    "login",
    "secrets",
    "apiKey",
    "lcuReader"
  ].map((fieldName) => fieldName.toLocaleLowerCase())
);

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(sampleEventRoot, relativePath), "utf8"));
}

function readJsonDirectory(relativePath) {
  return Object.fromEntries(
    readdirSync(join(sampleEventRoot, relativePath))
      .filter((fileName) => fileName.endsWith(".json"))
      .sort()
      .map((fileName) => [fileName, readJson(join(relativePath, fileName))])
  );
}

function walk(value, visitor, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`));
    return;
  }

  if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([key, childValue]) => {
      const childPath = `${path}.${key}`;
      visitor(key, childValue, childPath);
      walk(childValue, visitor, childPath);
    });
  }
}

function loadStaticPackageSnapshot() {
  const eventFile = readJson("event.json");
  const teamsFile = readJson("teams.json");
  const playersFile = readJson("players.json");
  const sponsorsFile = readJson("sponsors.json");
  const matchesFile = readJson("matches.json");
  const rulesets = readJsonDirectory("rulesets");
  const themes = readJsonDirectory("themes");
  const matches = matchesFile.matches;
  const games = matches.flatMap((match) => match.games ?? []);

  return {
    eventFile,
    teamsFile,
    playersFile,
    sponsorsFile,
    matchesFile,
    rulesets,
    themes,
    event: eventFile.event,
    teams: teamsFile.teams,
    players: playersFile.players,
    sponsors: sponsorsFile.sponsors,
    matches,
    games
  };
}

function getIdSet(items) {
  return new Set(items.map((item) => item.id));
}

function expectUniqueIds(items, path) {
  const ids = new Set();

  items.forEach((item, index) => {
    expect(item.id, `${path}[${index}].id`).toEqual(expect.any(String));
    expect(item.id.trim(), `${path}[${index}].id`).toBe(item.id);
    expect(ids.has(item.id), `${path}[${index}].id duplicates ${item.id}`).toBe(false);
    ids.add(item.id);
  });
}

function expectValidationPasses(result, label) {
  expect(result.valid, `${label}: ${JSON.stringify(result.issues ?? result.reason ?? null)}`).toBe(true);
}

function expectEngineResultPasses(result, label) {
  expect(result.ok, `${label}: ${JSON.stringify(result.error ?? null)}`).toBe(true);
}

function expectLocalReference(reference, path) {
  expect(reference, path).toEqual(expect.any(String));
  expect(reference.trim(), path).toBe(reference);
  expect(reference, path).not.toMatch(/^[a-z][a-z0-9+.-]*:/i);
  expect(reference, path).not.toMatch(/^[/\\]/);
  expect(reference, path).not.toContain("..");
  expect(reference, path).not.toContain("\\");
  expect(reference, path).not.toContain("?");
  expect(reference, path).not.toContain("#");
  expect(reference, path).not.toMatch(/^\/\//);

  const absolutePath = resolve(sampleEventRoot, reference);
  const pathFromPackageRoot = relative(sampleEventRoot, absolutePath);
  expect(pathFromPackageRoot.startsWith(".."), path).toBe(false);
}

function expectJsonSerializable(value, label) {
  const serialized = JSON.stringify(value);

  expect(serialized, label).toEqual(expect.any(String));
  expect(JSON.parse(serialized), label).toEqual(value);
}

function isAssetReference(key, path) {
  return key.endsWith("Url") || path.includes(".assets.");
}

function createAdapterRegistry() {
  const result = createGameAdapterRegistry(sampleAdapters);

  expectEngineResultPasses(result, "sample adapter registry");
  return result.value;
}

describe("sample event package", () => {
  it("parses required JSON files and keeps them serializable", () => {
    for (const relativePath of requiredTopLevelJsonFiles) {
      const parsed = readJson(relativePath);

      expect(parsed.schemaVersion, relativePath).toBe(expectedSchemaVersion);
      expectJsonSerializable(parsed, relativePath);
    }

    expect(Object.keys(readJsonDirectory("rulesets")).sort()).toEqual(expectedRulesetFiles);
    expect(Object.keys(readJsonDirectory("themes"))).toEqual(["default-theme.json"]);
  });

  it("validates event metadata, defaults, and package-level references", () => {
    const snapshot = loadStaticPackageSnapshot();
    const matchIds = getIdSet(snapshot.matches);
    const rulesetIds = getIdSet(Object.values(snapshot.rulesets));
    const themeIds = getIdSet(Object.values(snapshot.themes));

    expect(snapshot.eventFile.packageId).toBe("sample-event");
    expect(snapshot.event.gameCodes).toEqual(knownGameCodes);
    expectValidationPasses(validateEventInfo(snapshot.event, { path: "event.json.event" }), "event metadata");

    expect(matchIds.has(snapshot.eventFile.defaults.matchId), "default match id").toBe(true);
    expect(knownGameCodes).toContain(snapshot.eventFile.defaults.gameCode);
    expect(themeIds.has(snapshot.eventFile.defaults.themeId), "default theme id").toBe(true);

    for (const gameCode of snapshot.event.gameCodes) {
      const rulesetId = snapshot.eventFile.defaults.rulesetByGameCode[gameCode];

      expect(rulesetIds.has(rulesetId), `default ruleset for ${gameCode}`).toBe(true);
    }

    expectLocalReference(snapshot.eventFile.defaults.productionLogPath, "event.defaults.productionLogPath");
    expect(snapshot.eventFile.defaults.productionLogPath.startsWith("logs/")).toBe(true);
  });

  it("validates teams, players, sponsors, matches, and games through core-match", () => {
    const snapshot = loadStaticPackageSnapshot();
    const teamIds = getIdSet(snapshot.teams);
    const sponsorIds = getIdSet(snapshot.sponsors);
    const matchIds = getIdSet(snapshot.matches);

    expectUniqueIds(snapshot.teams, "teams.json.teams");
    expectUniqueIds(snapshot.players, "players.json.players");
    expectUniqueIds(snapshot.sponsors, "sponsors.json.sponsors");
    expectUniqueIds(snapshot.matches, "matches.json.matches");
    expectUniqueIds(snapshot.games, "matches.json.games");

    snapshot.teams.forEach((team, index) => {
      expectValidationPasses(validateTeam(team, { path: `teams.json.teams[${index}]` }), team.id);
    });

    snapshot.players.forEach((player, index) => {
      expectValidationPasses(
        validatePlayer(player, {
          path: `players.json.players[${index}]`,
          teamIds
        }),
        player.id
      );
    });

    for (const team of snapshot.teams) {
      const playerCount = snapshot.players.filter((player) => player.teamId === team.id).length;

      expect(playerCount, `${team.id} player count`).toBeGreaterThanOrEqual(5);
    }

    snapshot.sponsors.forEach((sponsor, index) => {
      expectValidationPasses(validateSponsor(sponsor, { path: `sponsors.json.sponsors[${index}]` }), sponsor.id);
    });

    snapshot.matches.forEach((match, index) => {
      expect(match.eventId).toBe(snapshot.event.id);
      expect(teamIds.has(match.teams.blue), `${match.id} blue team`).toBe(true);
      expect(teamIds.has(match.teams.red), `${match.id} red team`).toBe(true);
      expect(match.teams.blue).not.toBe(match.teams.red);
      expect(knownGameCodes).toContain(match.gameCode);

      for (const sponsorSlotId of match.sponsorSlotIds) {
        expect(sponsorIds.has(sponsorSlotId), `${match.id} sponsor slot`).toBe(true);
      }

      expectValidationPasses(
        validateMatch(match, {
          path: `matches.json.matches[${index}]`,
          eventIds: [snapshot.event.id],
          gameCodes: snapshot.event.gameCodes,
          teamIds,
          games: match.games
        }),
        match.id
      );
    });

    snapshot.games.forEach((game, index) => {
      const match = snapshot.matches.find((item) => item.id === game.matchId);

      expect(matchIds.has(game.matchId), `${game.id} match`).toBe(true);
      expect(match, `${game.id} parent match`).toBeDefined();
      expect(game.gameCode).toBe(match.gameCode);
      expect(teamIds.has(game.blueTeamId), `${game.id} blue team`).toBe(true);
      expect(teamIds.has(game.redTeamId), `${game.id} red team`).toBe(true);
      expect(game.blueTeamId).not.toBe(game.redTeamId);
      expectValidationPasses(
        validateGameInstance(game, {
          path: `matches.json.games[${index}]`,
          matchIds,
          teamIds,
          match
        }),
        game.id
      );
    });

    expectValidationPasses(
      validateMatchBundle({
        event: snapshot.event,
        teams: snapshot.teams,
        players: snapshot.players,
        sponsors: snapshot.sponsors,
        matches: snapshot.matches,
        games: snapshot.games
      }),
      "static match bundle"
    );
  });

  it("resolves every game code through local sample adapters", async () => {
    const snapshot = loadStaticPackageSnapshot();
    const registry = createAdapterRegistry();
    const loadedAdapters = listGameAdapters(registry);

    expect(new Set(loadedAdapters.map((adapter) => adapter.gameCode))).toEqual(new Set(knownGameCodes));

    for (const adapter of loadedAdapters) {
      expectValidationPasses(validateGameAdapter(adapter), `adapter ${adapter.gameCode}`);
      expect(adapter.capabilities).toMatchObject({
        supportsManualDraft: true,
        supportsClientReader: false,
        supportsIngameHud: false,
        supportsPostGameStats: false,
        supportsAssetSync: false
      });
    }

    for (const gameCode of snapshot.event.gameCodes) {
      const adapterResult = getGameAdapter(registry, gameCode);

      expectEngineResultPasses(adapterResult, `adapter ${gameCode}`);
      expect(adapterResult.value.gameCode).toBe(gameCode);
    }

    for (const match of snapshot.matches) {
      expectEngineResultPasses(getGameAdapter(registry, match.gameCode), `match adapter ${match.id}`);
    }

    for (const game of snapshot.games) {
      expectEngineResultPasses(getGameAdapter(registry, game.gameCode), `game adapter ${game.id}`);
    }
  });

  it("validates rulesets through core-draft and adapter default ruleset contracts", async () => {
    const snapshot = loadStaticPackageSnapshot();
    const rulesetsById = new Map(Object.values(snapshot.rulesets).map((ruleset) => [ruleset.id, ruleset]));

    expectUniqueIds(Object.values(snapshot.rulesets), "rulesets");

    for (const [fileName, ruleset] of Object.entries(snapshot.rulesets)) {
      expect(snapshot.event.gameCodes).toContain(ruleset.gameCode);
      expect(ruleset.allowDuplicateHeroes, fileName).toBe(false);
      expectValidationPasses(validateDraftRuleset(ruleset), `ruleset ${ruleset.id}`);

      const draftResult = createDraftState({
        id: `draft_static-${ruleset.id}`,
        gameId: `game_static-${ruleset.gameCode}`,
        ruleset,
        now: "2026-05-31T00:00:00.000Z",
        operatorId: "static-validator"
      });

      expectEngineResultPasses(draftResult, `create draft ${ruleset.id}`);
      expect(draftResult.value.actions).toHaveLength(
        ruleset.phases.reduce((total, phase) => total + phase.count, 0)
      );
      expectJsonSerializable(draftResult.value, `draft state ${ruleset.id}`);
    }

    for (const game of snapshot.games) {
      expect(rulesetsById.has(game.rulesetId), `${game.id} ruleset`).toBe(true);
      expect(rulesetsById.get(game.rulesetId).gameCode, `${game.id} ruleset gameCode`).toBe(game.gameCode);
    }

    for (const adapter of sampleAdapters) {
      const adapterRulesets = await adapter.loadDefaultRulesets();
      const adapterRulesetIds = adapterRulesets.map((ruleset) => ruleset.id);
      const packageDefaultRulesetId = snapshot.eventFile.defaults.rulesetByGameCode[adapter.gameCode];

      expect(adapterRulesets.length, `${adapter.gameCode} default rulesets`).toBeGreaterThan(0);
      expect(adapterRulesetIds).toContain(packageDefaultRulesetId);

      for (const adapterRuleset of adapterRulesets) {
        expectValidationPasses(validateDraftRuleset(adapterRuleset), `adapter ruleset ${adapterRuleset.id}`);
      }
    }
  });

  it("validates themes through theme-engine and keeps theme assets local", () => {
    const snapshot = loadStaticPackageSnapshot();

    expectUniqueIds(Object.values(snapshot.themes), "themes");

    for (const [fileName, theme] of Object.entries(snapshot.themes)) {
      expectValidationPasses(validateThemeConfig(theme, { path: `themes/${fileName}` }), theme.id);

      const loadedTheme = loadThemeConfig(theme, { path: `themes/${fileName}` });

      expectEngineResultPasses(loadedTheme, `load theme ${theme.id}`);
      expect(loadedTheme.value.id).toBe(theme.id);
      expect(loadedTheme.value.colors.background).toBe(theme.colors.background);
      expectJsonSerializable(loadedTheme.value, `resolved theme ${theme.id}`);

      walk(theme.assets, (_key, value, path) => {
        if (typeof value === "string") {
          expectLocalReference(value, `themes/${fileName}.assets${path.slice(1)}`);
          expect(existsSync(join(sampleEventRoot, value)), value).toBe(true);
        }
      });
    }
  });

  it("uses only local asset references and expected placeholder files", () => {
    const snapshot = loadStaticPackageSnapshot();
    const files = [
      snapshot.eventFile,
      snapshot.teamsFile,
      snapshot.playersFile,
      snapshot.sponsorsFile,
      snapshot.matchesFile,
      ...Object.values(snapshot.rulesets),
      ...Object.values(snapshot.themes)
    ];
    const assetReferences = new Set();

    for (const file of files) {
      walk(file, (key, value, path) => {
        if (typeof value === "string") {
          expect(value, path).not.toMatch(/https?:\/\//i);
          expect(value, path).not.toMatch(/file:\/\//i);
          expect(value, path).not.toMatch(/^\/\//);
        }

        if (typeof value === "string" && (isAssetReference(key, path) || key.endsWith("Path"))) {
          expectLocalReference(value, path);
        }

        if (typeof value === "string" && isAssetReference(key, path)) {
          assetReferences.add(value);
        }
      });
    }

    for (const assetReference of assetReferences) {
      expect(assetReference.startsWith("assets/"), assetReference).toBe(true);
      expect(existsSync(join(sampleEventRoot, assetReference)), assetReference).toBe(true);
    }

    [
      "assets/team-logos/blue-meteors.svg",
      "assets/team-logos/red-titans.svg",
      "assets/sponsor-logos/local-lan-studios.svg",
      "assets/backgrounds/default-background.svg",
      "assets/frames/draft-frame.svg",
      "assets/frames/sponsor-frame.svg",
      "assets/fallbacks/hero-icon.svg",
      "assets/fallbacks/player-photo.svg",
      "assets/fallbacks/team-logo.svg",
      "logs/.gitkeep"
    ].forEach((relativePath) => {
      expect(existsSync(join(sampleEventRoot, relativePath)), relativePath).toBe(true);
    });
  });

  it("rejects unsafe future-scope fields and values from sample package data", () => {
    const snapshot = loadStaticPackageSnapshot();
    const files = [
      snapshot.eventFile,
      snapshot.teamsFile,
      snapshot.playersFile,
      snapshot.sponsorsFile,
      snapshot.matchesFile,
      ...Object.values(snapshot.rulesets),
      ...Object.values(snapshot.themes)
    ];

    for (const file of files) {
      walk(file, (key, value, path) => {
        const normalizedKey = key.toLocaleLowerCase();

        expect(unsafeFutureScopeFields.has(normalizedKey), path).toBe(false);

        if (typeof value === "string") {
          const normalizedValue = value.toLocaleLowerCase();

          for (const unsafeField of unsafeFutureScopeFields) {
            expect(normalizedValue.includes(unsafeField), path).toBe(false);
          }
        }
      });
    }
  });
});
