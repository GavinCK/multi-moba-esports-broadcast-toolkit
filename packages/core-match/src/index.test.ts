import type { EventInfo, GameInstance, Match, Player, Sponsor, Team } from "@mmbt/shared-types";
import { describe, expect, it } from "vitest";

import {
  createUpdatedMatchScore,
  getCurrentGame,
  getMatchFormatGameCount,
  getMatchFormatWinsRequired,
  getMatchGames,
  getMatchTeams,
  validateEventInfo,
  validateGameInstance,
  validateMatch,
  validateMatchBundle,
  validatePlayer,
  validateSponsor,
  validateTeam
} from "./index";
import type { MatchBundle } from "./index";

const event: EventInfo = {
  id: "event-2026",
  name: "Hong Kong Invitational 2026",
  shortName: "HKI 2026",
  timezone: "Asia/Hong_Kong",
  defaultLanguage: "en",
  gameCodes: ["generic-moba", "lol", "aov", "hok"]
};

const blueTeam: Team = {
  id: "team-blue",
  name: "Blue Harbor",
  shortName: "BLU",
  logoUrl: "/assets/team-logos/blue-harbor.png",
  primaryColor: "#0b68ff"
};

const redTeam: Team = {
  id: "team-red",
  name: "Red Peak",
  shortName: "RED",
  logoUrl: "/assets/team-logos/red-peak.png",
  primaryColor: "#d92030"
};

const players: Player[] = [
  {
    id: "player-blue-top",
    teamId: blueTeam.id,
    displayName: "Blue Top",
    role: "Top"
  },
  {
    id: "player-red-top",
    teamId: redTeam.id,
    displayName: "Red Top",
    role: "Top"
  }
];

const sponsor: Sponsor = {
  id: "sponsor-main",
  name: "Local Sponsor",
  logoUrl: "/assets/sponsor-logos/local-sponsor.png",
  slots: ["PRESENTED_BY", "DRAFT", "SCORE_BUG"]
};

const match: Match = {
  id: "match-grand-final",
  eventId: event.id,
  gameCode: "generic-moba",
  title: "Grand Final",
  format: "BO3",
  teams: {
    blue: blueTeam.id,
    red: redTeam.id
  },
  score: {
    blue: 1,
    red: 0
  },
  currentGameNumber: 2,
  status: "LIVE"
};

const games: GameInstance[] = [
  {
    id: "game-2",
    matchId: match.id,
    gameNumber: 2,
    gameCode: match.gameCode,
    blueTeamId: blueTeam.id,
    redTeamId: redTeam.id,
    draftId: "draft-2",
    status: "DRAFT_READY"
  },
  {
    id: "game-1",
    matchId: match.id,
    gameNumber: 1,
    gameCode: match.gameCode,
    blueTeamId: blueTeam.id,
    redTeamId: redTeam.id,
    winnerTeamId: blueTeam.id,
    draftId: "draft-1",
    status: "COMPLETED"
  },
  {
    id: "game-3",
    matchId: match.id,
    gameNumber: 3,
    gameCode: match.gameCode,
    blueTeamId: blueTeam.id,
    redTeamId: redTeam.id,
    status: "NOT_STARTED"
  }
];

const validBundle: MatchBundle = {
  event,
  teams: [blueTeam, redTeam],
  players,
  sponsors: [sponsor],
  matches: [match],
  games
};

describe("match format helpers", () => {
  it("returns game count and wins required for supported best-of formats", () => {
    expect(getMatchFormatGameCount("BO1")).toBe(1);
    expect(getMatchFormatGameCount("BO3")).toBe(3);
    expect(getMatchFormatGameCount("BO5")).toBe(5);
    expect(getMatchFormatGameCount("BO7")).toBe(7);
    expect(getMatchFormatWinsRequired("BO5")).toBe(3);
  });
});

describe("core match entity validation", () => {
  it("accepts valid event, team, player, sponsor, match, and game data", () => {
    expect(validateEventInfo(event).valid).toBe(true);
    expect(validateTeam(blueTeam).valid).toBe(true);
    expect(validatePlayer(players[0], { teamIds: [blueTeam.id, redTeam.id] }).valid).toBe(true);
    expect(validateSponsor(sponsor).valid).toBe(true);
    expect(
      validateMatch(match, {
        eventIds: [event.id],
        gameCodes: event.gameCodes,
        teamIds: [blueTeam.id, redTeam.id],
        games
      }).valid
    ).toBe(true);
    expect(
      validateGameInstance(games[0], {
        matchIds: [match.id],
        teamIds: [blueTeam.id, redTeam.id],
        match
      }).valid
    ).toBe(true);
  });

  it("rejects invalid event and team data", () => {
    const invalidEvent = validateEventInfo({
      id: "",
      name: "Broken Event",
      timezone: "",
      defaultLanguage: "en",
      gameCodes: []
    });

    expect(invalidEvent.valid).toBe(false);
    expect(invalidEvent.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["required-string", "array-too-short"])
    );

    const invalidTeam = validateTeam({
      id: "team-empty",
      name: "Empty Team",
      shortName: "",
      metadata: {
        bad: () => "not serializable"
      }
    });

    expect(invalidTeam.valid).toBe(false);
    expect(invalidTeam.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["required-string", "invalid-json-object"])
    );
  });

  it("rejects invalid player team references and sponsor slots", () => {
    const playerResult = validatePlayer(
      {
        id: "player-missing-team",
        teamId: "missing-team",
        displayName: "No Team"
      },
      { teamIds: [blueTeam.id, redTeam.id] }
    );

    expect(playerResult.valid).toBe(false);
    expect(playerResult.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "unknown-team" })])
    );

    const sponsorResult = validateSponsor({
      id: "sponsor-broken",
      name: "Broken Sponsor",
      logoUrl: "/assets/sponsor-logos/broken.png",
      slots: ["DRAFT", "DRAFT", "NOT_A_SLOT"]
    });

    expect(sponsorResult.valid).toBe(false);
    expect(sponsorResult.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["duplicate-sponsor-slot", "invalid-sponsor-slot"])
    );
  });

  it("rejects invalid match format, score, teams, and status values", () => {
    const result = validateMatch({
      ...match,
      format: "BO2",
      teams: {
        blue: blueTeam.id,
        red: blueTeam.id
      },
      score: {
        blue: 4,
        red: 0
      },
      currentGameNumber: 8,
      status: "IN_LOBBY"
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["invalid-match-format", "duplicate-match-team", "invalid-status"])
    );
  });

  it("rejects invalid game status, winner, and parent match mismatches", () => {
    const result = validateGameInstance(
      {
        ...games[0],
        gameNumber: 4,
        gameCode: "aov",
        winnerTeamId: "team-third",
        status: "ENDED"
      },
      {
        matchIds: [match.id],
        teamIds: [blueTeam.id, redTeam.id],
        match
      }
    );

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "invalid-status",
        "winner-not-in-game",
        "game-code-mismatch",
        "game-number-exceeds-format"
      ])
    );
  });
});

describe("match bundle validation and helpers", () => {
  it("accepts a valid event to match to game bundle", () => {
    const result = validateMatchBundle(validBundle);

    expect(result.valid).toBe(true);
    expect(result.value?.matches).toHaveLength(1);
    expect(result.value?.games).toHaveLength(3);
  });

  it("rejects duplicate IDs and broken cross-entity references", () => {
    const result = validateMatchBundle({
      ...validBundle,
      players: [
        ...players,
        {
          ...players[0],
          displayName: "Duplicate Player ID"
        },
        {
          id: "player-unknown-team",
          teamId: "missing-team",
          displayName: "Missing Team"
        }
      ],
      games: [
        ...games,
        {
          ...games[0],
          id: "game-duplicate-number",
          gameNumber: 2
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["duplicate-id", "unknown-team", "duplicate-game-number"])
    );
  });

  it("gets sorted match games, current game, and match teams", () => {
    expect(getMatchGames(match, games).map((game) => game.gameNumber)).toEqual([1, 2, 3]);
    expect(getCurrentGame(match, games)?.id).toBe("game-2");
    expect(getMatchTeams(match, [blueTeam, redTeam])).toEqual({ blue: blueTeam, red: redTeam });
  });

  it("creates immutable match score updates and rejects impossible scores", () => {
    const updated = createUpdatedMatchScore(match, { blue: 1, red: 1 });

    expect(updated.valid).toBe(true);
    expect(updated.value?.score).toEqual({ blue: 1, red: 1 });
    expect(match.score).toEqual({ blue: 1, red: 0 });

    const rejected = createUpdatedMatchScore(match, { blue: 3, red: 0 });

    expect(rejected.valid).toBe(false);
    expect(rejected.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "score-exceeds-wins-required" })])
    );
  });
});
