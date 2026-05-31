import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { URL, fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sampleEventRoot = fileURLToPath(
  new URL("../../../event-packages/sample-event/", import.meta.url)
);

const knownGameCodes = ["generic-moba", "lol", "aov", "hok"];
const unsafeFieldNames = new Set([
  "autoPick",
  "autoBan",
  "clientSync",
  "cloudSync",
  "datadragonSync",
  "hiddenInfo",
  "lcuReader",
  "playerClient",
  "playerClientBinding",
  "playerSideAutomation",
  "remoteChampionSource",
  "remoteUrl",
  "sqlitePath"
]);

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

function expectLocalReference(reference, path) {
  expect(reference, path).toEqual(expect.any(String));
  expect(reference, path).not.toMatch(/^[a-z][a-z0-9+.-]*:/i);
  expect(reference, path).not.toMatch(/^[/\\]/);
  expect(reference, path).not.toContain("..");
  expect(reference, path).not.toContain("\\");
  expect(reference, path).not.toContain("?");
  expect(reference, path).not.toContain("#");
  expect(reference, path).not.toMatch(/^\/\//);
}

function getRuleSets() {
  return readJsonDirectory("rulesets");
}

function getThemes() {
  return readJsonDirectory("themes");
}

describe("sample event package", () => {
  it("parses every required JSON file", () => {
    expect(readJson("event.json").schemaVersion).toBe("event-package.v0.1");
    expect(readJson("teams.json").teams).toHaveLength(2);
    expect(readJson("players.json").players).toHaveLength(10);
    expect(readJson("sponsors.json").sponsors).toHaveLength(1);
    expect(readJson("matches.json").matches.length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(getRuleSets()).sort()).toEqual([
      "aov-standard.json",
      "generic-standard.json",
      "hok-standard.json",
      "lol-standard.json"
    ]);
    expect(Object.keys(getThemes())).toEqual(["default-theme.json"]);
  });

  it("uses known static sample adapters and resolves default rulesets", () => {
    const eventFile = readJson("event.json");
    const rulesetIds = new Set(Object.values(getRuleSets()).map((ruleset) => ruleset.id));
    const themeIds = new Set(Object.values(getThemes()).map((theme) => theme.id));

    expect(eventFile.event.gameCodes).toEqual(knownGameCodes);
    expect(eventFile.defaults.gameCode).toBe("generic-moba");
    expect(themeIds.has(eventFile.defaults.themeId)).toBe(true);

    for (const gameCode of eventFile.event.gameCodes) {
      expect(knownGameCodes).toContain(gameCode);
      expect(rulesetIds.has(eventFile.defaults.rulesetByGameCode[gameCode])).toBe(true);
    }

    expectLocalReference(eventFile.defaults.productionLogPath, "event.defaults.productionLogPath");
    expect(eventFile.defaults.productionLogPath.startsWith("logs/")).toBe(true);
  });

  it("links teams, players, sponsors, matches, games, rulesets, and themes consistently", () => {
    const eventFile = readJson("event.json");
    const teams = readJson("teams.json").teams;
    const players = readJson("players.json").players;
    const sponsors = readJson("sponsors.json").sponsors;
    const matches = readJson("matches.json").matches;
    const teamIds = new Set(teams.map((team) => team.id));
    const sponsorIds = new Set(sponsors.map((sponsor) => sponsor.id));
    const rulesetIds = new Set(Object.values(getRuleSets()).map((ruleset) => ruleset.id));
    const themeIds = new Set(Object.values(getThemes()).map((theme) => theme.id));

    for (const team of teams) {
      expect(team.id).toMatch(/^team_[a-z0-9_-]+$/);
      expectLocalReference(team.logoUrl, `team ${team.id} logoUrl`);
    }

    for (const player of players) {
      expect(teamIds.has(player.teamId), `player ${player.id} team`).toBe(true);
    }

    for (const sponsor of sponsors) {
      expectLocalReference(sponsor.logoUrl, `sponsor ${sponsor.id} logoUrl`);
    }

    for (const match of matches) {
      expect(match.eventId).toBe(eventFile.event.id);
      expect(knownGameCodes).toContain(match.gameCode);
      expect(teamIds.has(match.teams.blue), `match ${match.id} blue team`).toBe(true);
      expect(teamIds.has(match.teams.red), `match ${match.id} red team`).toBe(true);
      expect(match.teams.blue).not.toBe(match.teams.red);
      expect(Number.isInteger(match.score.blue) && match.score.blue >= 0).toBe(true);
      expect(Number.isInteger(match.score.red) && match.score.red >= 0).toBe(true);
      expect(themeIds.has(match.themeId), `match ${match.id} theme`).toBe(true);

      for (const sponsorSlotId of match.sponsorSlotIds) {
        expect(sponsorIds.has(sponsorSlotId), `match ${match.id} sponsor`).toBe(true);
      }

      for (const game of match.games) {
        expect(game.matchId).toBe(match.id);
        expect(game.gameCode).toBe(match.gameCode);
        expect(teamIds.has(game.blueTeamId), `game ${game.id} blue team`).toBe(true);
        expect(teamIds.has(game.redTeamId), `game ${game.id} red team`).toBe(true);
        expect(game.blueTeamId).not.toBe(game.redTeamId);
        expect(rulesetIds.has(game.rulesetId), `game ${game.id} ruleset`).toBe(true);
        expect(themeIds.has(game.themeId), `game ${game.id} theme`).toBe(true);
      }
    }
  });

  it("keeps rulesets manual, static, and draft-core compatible", () => {
    for (const ruleset of Object.values(getRuleSets())) {
      expect(knownGameCodes).toContain(ruleset.gameCode);
      expect(ruleset.allowDuplicateHeroes).toBe(false);
      expect(ruleset.phases.length).toBeGreaterThan(0);

      const phaseIds = new Set();
      for (const phase of ruleset.phases) {
        expect(["BAN", "PICK"]).toContain(phase.type);
        expect(["BLUE", "RED"]).toContain(phase.team);
        expect(Number.isInteger(phase.count) && phase.count > 0).toBe(true);
        expect(Number.isInteger(phase.timeSeconds) && phase.timeSeconds >= 0).toBe(true);
        expect(phaseIds.has(phase.id), `duplicate phase ${phase.id}`).toBe(false);
        phaseIds.add(phase.id);
      }
    }
  });

  it("uses only local asset references and existing placeholder files", () => {
    const files = [
      readJson("event.json"),
      readJson("teams.json"),
      readJson("players.json"),
      readJson("sponsors.json"),
      readJson("matches.json"),
      ...Object.values(getRuleSets()),
      ...Object.values(getThemes())
    ];

    for (const file of files) {
      walk(file, (key, value, path) => {
        if (typeof value === "string") {
          expect(value, path).not.toMatch(/(?:https?:\/\/|file:\/\/|\/\/)/i);
        }

        const isThemeAssetPath = path.includes(".assets.");
        if (
          typeof value === "string" &&
          (key.endsWith("Url") || key.endsWith("Path") || isThemeAssetPath)
        ) {
          expectLocalReference(value, path);
        }
      });
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

  it("does not introduce unsafe future-scope fields", () => {
    const files = [
      readJson("event.json"),
      readJson("teams.json"),
      readJson("players.json"),
      readJson("sponsors.json"),
      readJson("matches.json"),
      ...Object.values(getRuleSets()),
      ...Object.values(getThemes())
    ];

    for (const file of files) {
      walk(file, (key, _value, path) => {
        expect(unsafeFieldNames.has(key), path).toBe(false);
      });
    }
  });
});
