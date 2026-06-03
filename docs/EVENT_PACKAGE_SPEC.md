# Event Package Spec Harness — Multi-MOBA Esports Broadcast Toolkit v0.1

## Document Purpose

This document defines the v0.1 **local JSON event package** format for the **Multi-MOBA Esports Broadcast Toolkit**.

It is written for Codex / AI coding agents before they create:

```text
event-packages/sample-event/**
tests/sample-event/**
apps/server/src/state/**
apps/server/src/services/**
apps/server/src/persistence/**
```

This is a documentation / harness planning file only.

It does **not** implement application code, generate actual test fixtures, rewrite the Technical Spec, or modify existing harness documents.

The purpose of this file is to remove ambiguity before these task queue items are executed:

```text
TQ-060 — Create Sample Event Package Structure and JSON Files
TQ-061 — Add Sample Event Validation Tests
TQ-071 — Implement Event Package and Adapter Loading in Server Runtime
```

---

## Source Documents

This document must be read together with:

```text
AGENTS.md
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
IMPLEMENTATION_PROMPT_FOR_CODEX.md
docs/ACCEPTANCE_CRITERIA.md
docs/TASK_QUEUE.md
docs/BAN_PICK_RULES.md
docs/API_SOCKET_CONTRACT.md
WORKING_HANDOFF_AFTER_API_SOCKET_CONTRACT.md
```

If this document conflicts with a newer user instruction, follow the latest user instruction and record the decision in the handoff.

If this document conflicts with `AGENTS.md`, preserve the safer interpretation that keeps the system:

```text
game-agnostic
manual-first
local-first
production-safe
```

---

## Non-Negotiable v0.1 Principles

The event package format must preserve these release-blocking rules:

- Universal Ban/Pick must remain game-agnostic.
- LoL In-game HUD must remain a future plugin.
- Production Control must sit above both Universal Draft and game-specific plugins.
- v0.1 must be local-first, manual-first, and production-safe.
- No player-side automation.
- No auto-pick.
- No auto-ban.
- No hidden competitive information exposure.
- Event package format must not become LoL-first.
- Event package must not require internet, cloud services, CDN-hosted images, remote fonts, remote APIs, SQLite, Prisma, or user login.
- Event package must not require LoL LCU, LoL champion select auto-sync, active runtime Data Dragon sync, OBS WebSocket, vMix API, Companion, or Stream Deck.

---

# 1. Event Package Design Principles

## 1.1 Local-First

An event package is a local folder on disk.

It must be usable on a private production LAN with internet disconnected.

It may be copied by USB drive, LAN share, zip archive, or repository checkout.

It must not require:

```text
cloud database
cloud storage
remote image URL
remote font URL
remote game API
remote auth provider
Riot LCU
Riot Data Dragon runtime sync
SQLite / Prisma
user login
```

## 1.2 Portable and Human-Readable

The package should be easy for TDs, producers, developers, and AI agents to inspect.

Use:

```text
JSON files for structured config
relative local paths for assets
append-only JSONL for runtime audit logs
plain folder names
stable IDs
ISO 8601 timestamps where timestamps exist
```

Do not use opaque binary config, generated-only state, or hidden database files for v0.1.

## 1.3 Manual-First

The event package describes event data, teams, players, sponsors, rulesets, themes, and local assets.

It must not describe automation that selects heroes, drives player clients, reads hidden game-client state, or performs competitive actions without an operator.

Disallowed event-package concepts for v0.1:

```text
autoPick
autoBan
playerClientBinding
lcuPort
riotLockfilePath
datadragonAutoSync
remoteChampionSource
playerSideAutomation
hiddenOpponentData
```

## 1.4 Game-Agnostic Core

The package may contain rulesets for multiple games, including a LoL-style sample ruleset, but the file format must use generic terms:

```text
event
match
game
team
player
sponsor
ruleset
hero
adapter
theme
asset
log
```

Avoid making the package use LoL-only terms as required fields:

```text
champion-select
summoner
riot
lcu
datadragon
spell
rune
observer-hud
```

A LoL sample adapter may treat a generic `Hero` as a champion internally, but the package contract must not depend on LoL-specific runtime systems.

## 1.5 Event Package Is Setup Data, Not Live Runtime State

The event package defines starting configuration and local resources.

The server may keep live state in memory and append audit entries to JSONL.

The server must not silently rewrite event setup JSON during normal live actions unless a future explicit admin-edit feature is documented.

For v0.1:

```text
Read setup JSON at startup/load time.
Keep live draft and production runtime state in memory.
Append important actions to logs/production-log.jsonl.
Do not require full event-sourcing replay from JSONL.
```

---

# 2. Canonical Folder Structure

## 2.1 Required v0.1 Shape

The canonical sample package path is:

```text
event-packages/sample-event
```

Required structure:

```text
event-packages/sample-event
├── event.json
├── matches.json
├── teams.json
├── players.json
├── sponsors.json
├── rulesets
│   ├── generic-standard.json
│   ├── lol-standard.json
│   ├── aov-standard.json
│   └── hok-standard.json
├── themes
│   └── default-theme.json
├── assets
│   ├── team-logos
│   ├── player-photos
│   ├── sponsor-logos
│   ├── hero-icons
│   ├── backgrounds
│   ├── frames
│   └── fallbacks
└── logs
    └── .gitkeep
```

`logs/production-log.jsonl` is normally created by the server at runtime.

It may exist after local rehearsal or live operation.

## 2.2 Optional Folders

Optional folders are allowed only if they remain local and documented:

```text
assets/fonts
assets/lower-thirds
assets/pause-screens
assets/mvp
assets/debug
exports
notes
```

Optional folders must not become required for v0.1 tests unless documented in this file or a later user instruction.

## 2.3 Disallowed Required Folders

Do not require these in v0.1 event packages:

```text
database
prisma
cloud
remote-cache
lcu
riot-lockfiles
datadragon-cache
obs
vmix
companion
streamdeck
player-clients
```

A future plugin may add optional folders later, but the v0.1 package must remain runnable without them.

---

# 3. Shared JSON Rules

## 3.1 JSON Encoding

All `.json` files must be valid UTF-8 JSON.

Rules:

- No comments in JSON files.
- No trailing commas.
- No functions.
- No non-serializable values.
- Timestamps, where used, must be ISO 8601 strings.
- Use arrays or objects consistently as documented below.

## 3.2 Top-Level Wrapper Convention

For list files, use an object with a named array instead of a raw array.

Recommended:

```json
{
  "teams": []
}
```

Avoid:

```json
[]
```

Reason:

- Allows future `schemaVersion`, `updatedAt`, or `notes` without breaking shape.
- Easier for validation tests to report which file is broken.
- Easier for AI agents to extend safely.

## 3.3 Schema Version

Each top-level file should include:

```json
{
  "schemaVersion": "event-package.v0.1"
}
```

This is recommended for all files and required for `event.json`.

Validation should warn, not necessarily fail, if early sample files omit `schemaVersion`, unless the task explicitly enforces it.

## 3.4 Unknown Fields

Unknown fields should generally be tolerated with warnings if they do not affect safety.

Unknown fields must fail validation if they look like unsafe v0.1 scope expansion, such as:

```text
autoPick
autoBan
remoteUrl
cloudSync
sqlitePath
lcuReader
datadragonSync
playerClient
hiddenInfo
```

---

# 4. ID Naming Conventions

## 4.1 General ID Rules

IDs must be:

- Stable.
- Human-readable.
- Lowercase kebab-case or snake_case.
- Unique within their entity type.
- Safe for filenames, URLs, logs, and operator debugging.

Recommended pattern:

```text
<entity>_<short-name>
```

Examples:

```text
event_sample-2026
match_grand-final
team_blue-meteors
team_red-titans
player_blue-top
sponsor_presenting
ruleset_generic-standard
theme_default
game_001
draft_game-001
```

## 4.2 Allowed Characters

Use only:

```text
a-z
0-9
-
_
```

Do not use spaces, slashes, backslashes, colons, query strings, fragments, emoji, or non-printable characters in IDs.

## 4.3 Filename and ID Relationship

For rulesets and themes, the filename should match the ID where practical.

Example:

```text
rulesets/generic-standard.json
id: "generic-standard"
```

```text
themes/default-theme.json
id: "default-theme"
```

If the filename and `id` differ, validation should warn.

## 4.4 Do Not Encode Secrets in IDs

IDs must not contain:

```text
private wallet data
credentials
API keys
IP addresses unless intentionally public local reference
private player information
hidden competitive information
```

---

# 5. Relative / Local Path Requirements

## 5.1 Path Format

All package asset paths must be relative to the event package root.

Correct:

```text
assets/team-logos/blue-meteors.svg
assets/sponsor-logos/main-sponsor.png
assets/fallbacks/hero-icon.svg
```

Incorrect:

```text
https://cdn.example.com/logo.png
http://example.com/logo.png
file:///C:/Users/td/logo.png
/Users/td/logo.png
C:\\Users\\td\\logo.png
../outside-package/logo.png
//cdn.example.com/logo.png
```

## 5.2 URL-Like Fields Still Use Local Paths

Some shared types use field names such as:

```text
logoUrl
photoUrl
iconUrl
splashUrl
squareUrl
```

For v0.1 event packages, these fields must still contain local relative paths or be omitted.

The suffix `Url` does not permit remote URL dependency in v0.1.

## 5.3 No Parent Directory Traversal

Validation must reject asset paths containing:

```text
..
../
..\\
```

The server must never resolve event package assets outside the package root.

## 5.4 Case Sensitivity

Use lowercase filenames where practical.

Validation may warn when path casing may break Linux/macOS/Windows portability.

Recommended:

```text
assets/team-logos/blue-meteors.svg
```

Avoid:

```text
Assets/Team Logos/Blue Meteors.PNG
```

---

# 6. `event.json` Format

## 6.1 Purpose

`event.json` defines the event-level metadata and package-level defaults.

It should map cleanly to the shared `EventInfo` concept while allowing package metadata.

## 6.2 Required Shape

Recommended documentation shape:

```ts
export interface EventPackageEventFile {
  schemaVersion: "event-package.v0.1";
  packageId: string;
  event: {
    id: string;
    name: string;
    shortName?: string;
    organizer?: string;
    venue?: string;
    startDate?: string;
    endDate?: string;
    timezone: string;
    defaultLanguage: string;
    gameCodes: string[];
  };
  defaults: {
    matchId: string;
    gameCode: string;
    themeId: string;
    rulesetByGameCode: Record<string, string>;
    productionLogPath: string;
  };
}
```

## 6.3 Minimum Example

This is an example shape only. It is not an instruction to generate the actual fixture in this documentation task.

```json
{
  "schemaVersion": "event-package.v0.1",
  "packageId": "sample-event",
  "event": {
    "id": "event_sample-2026",
    "name": "Sample Multi-MOBA Invitational 2026",
    "shortName": "Sample Invitational",
    "organizer": "Broadcast Toolkit Demo",
    "venue": "Local Production LAN",
    "startDate": "2026-01-01",
    "endDate": "2026-01-01",
    "timezone": "Asia/Hong_Kong",
    "defaultLanguage": "en",
    "gameCodes": ["generic-moba", "lol", "aov", "hok"]
  },
  "defaults": {
    "matchId": "match_grand-final",
    "gameCode": "generic-moba",
    "themeId": "default-theme",
    "rulesetByGameCode": {
      "generic-moba": "generic-standard",
      "lol": "lol-standard",
      "aov": "aov-standard",
      "hok": "hok-standard"
    },
    "productionLogPath": "logs/production-log.jsonl"
  }
}
```

## 6.4 Validation Expectations

Validation must check:

- `schemaVersion` is present.
- `packageId` is present and matches the package folder name where practical.
- `event.id` is present.
- `event.name` is present.
- `event.timezone` is present.
- `event.defaultLanguage` is present.
- `event.gameCodes` is a non-empty array.
- `defaults.matchId` points to an existing match in `matches.json`.
- `defaults.themeId` points to an existing theme in `themes/`.
- `defaults.rulesetByGameCode` values point to valid rulesets or adapter-provided rulesets.
- `defaults.productionLogPath` is a local relative path inside `logs/`.

Validation must reject:

- Remote paths.
- Path traversal.
- Empty game codes.
- Defaults that point to missing required sample content.

---

# 7. `matches.json` Format

## 7.1 Purpose

`matches.json` defines matches and their game instances.

The shared type model includes `Match` and `GameInstance`; because v0.1 does not require a separate `games.json`, game instances should live under each match in `matches.json`.

The server may normalize this into separate runtime collections internally.

## 7.2 Required Shape

Recommended documentation shape:

```ts
export interface EventPackageMatchesFile {
  schemaVersion: "event-package.v0.1";
  matches: EventPackageMatch[];
}

export interface EventPackageMatch {
  id: string;
  eventId: string;
  gameCode: string;
  title: string;
  format: "BO1" | "BO3" | "BO5" | "BO7";
  teams: {
    blue: string;
    red: string;
  };
  score: {
    blue: number;
    red: number;
  };
  currentGameNumber: number;
  status: string;
  sponsorSlotIds?: string[];
  themeId?: string;
  games: EventPackageGameInstance[];
}

export interface EventPackageGameInstance {
  id: string;
  matchId: string;
  gameNumber: number;
  gameCode: string;
  blueTeamId: string;
  redTeamId: string;
  rulesetId: string;
  themeId?: string;
  draftId?: string;
  winnerTeamId?: string;
  status: string;
}
```

## 7.3 Minimum Example

```json
{
  "schemaVersion": "event-package.v0.1",
  "matches": [
    {
      "id": "match_grand-final",
      "eventId": "event_sample-2026",
      "gameCode": "generic-moba",
      "title": "Grand Final",
      "format": "BO3",
      "teams": {
        "blue": "team_blue-meteors",
        "red": "team_red-titans"
      },
      "score": {
        "blue": 0,
        "red": 0
      },
      "currentGameNumber": 1,
      "status": "READY",
      "sponsorSlotIds": ["sponsor_presented-by"],
      "themeId": "default-theme",
      "games": [
        {
          "id": "game_001",
          "matchId": "match_grand-final",
          "gameNumber": 1,
          "gameCode": "generic-moba",
          "blueTeamId": "team_blue-meteors",
          "redTeamId": "team_red-titans",
          "rulesetId": "generic-standard",
          "themeId": "default-theme",
          "status": "DRAFT_READY"
        },
        {
          "id": "game_002",
          "matchId": "match_grand-final",
          "gameNumber": 2,
          "gameCode": "generic-moba",
          "blueTeamId": "team_red-titans",
          "redTeamId": "team_blue-meteors",
          "rulesetId": "generic-standard",
          "themeId": "default-theme",
          "status": "NOT_STARTED"
        },
        {
          "id": "game_003",
          "matchId": "match_grand-final",
          "gameNumber": 3,
          "gameCode": "generic-moba",
          "blueTeamId": "team_blue-meteors",
          "redTeamId": "team_red-titans",
          "rulesetId": "generic-standard",
          "themeId": "default-theme",
          "status": "NOT_STARTED"
        }
      ]
    }
  ]
}
```

## 7.4 Validation Expectations

Validation must check:

- `matches` is a non-empty array for `sample-event`.
- Each match ID is unique.
- Each match `eventId` equals `event.json.event.id`.
- Match format is supported.
- Match blue and red team IDs exist in `teams.json`.
- Blue and red teams are not the same.
- Score values are non-negative integers.
- `currentGameNumber` is within the match format limit.
- `games` is non-empty.
- Each game ID is unique across the package.
- Each game `matchId` matches its parent match ID.
- Each game `gameNumber` is positive and unique within the match.
- Each game `gameCode` is listed in `event.gameCodes`.
- Each game team ID exists and matches the assigned side.
- Each game `rulesetId` resolves to a local ruleset or adapter-provided ruleset.
- Each game `themeId`, where present, resolves to a local theme.

Validation should warn if:

- BO3 does not contain three game instances.
- A match has no sponsor slots.
- All games use the same blue/red side assignment when a side-swap rehearsal is expected.

Validation must reject:

- Game adapter references that are not available.
- LoL-specific hidden runtime fields.
- Remote dependencies.
- Auto-selection fields.

---

# 8. `teams.json` Format

## 8.1 Purpose

`teams.json` defines teams available in the event package.

## 8.2 Required Shape

Recommended documentation shape:

```ts
export interface EventPackageTeamsFile {
  schemaVersion: "event-package.v0.1";
  teams: EventPackageTeam[];
}

export interface EventPackageTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  countryCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  metadata?: Record<string, unknown>;
}
```

`logoUrl` must be a local relative path if present.

## 8.3 Minimum Example

```json
{
  "schemaVersion": "event-package.v0.1",
  "teams": [
    {
      "id": "team_blue-meteors",
      "name": "Blue Meteors",
      "shortName": "BLU",
      "logoUrl": "assets/team-logos/blue-meteors.svg",
      "countryCode": "HK",
      "primaryColor": "#2563EB",
      "secondaryColor": "#93C5FD"
    },
    {
      "id": "team_red-titans",
      "name": "Red Titans",
      "shortName": "RED",
      "logoUrl": "assets/team-logos/red-titans.svg",
      "countryCode": "HK",
      "primaryColor": "#DC2626",
      "secondaryColor": "#FCA5A5"
    }
  ]
}
```

## 8.4 Validation Expectations

Validation must check:

- `teams` contains at least two teams for `sample-event`.
- Team IDs are unique.
- `name` and `shortName` are non-empty.
- `logoUrl`, if present, is local and relative.
- Color fields, if present, are valid CSS hex color strings or documented accepted CSS color strings.

Validation should warn if:

- Team logo file is missing but fallback exists.
- `shortName` is very long for overlay use.

Validation must not fail the whole package only because an optional team logo is missing, as long as fallback behavior exists.

---

# 9. `players.json` Format

## 9.1 Purpose

`players.json` defines player display data for caster panels, lower thirds, draft panels, and future overlays.

It must not expose hidden competitive information.

## 9.2 Required Shape

Recommended documentation shape:

```ts
export interface EventPackagePlayersFile {
  schemaVersion: "event-package.v0.1";
  players: EventPackagePlayer[];
}

export interface EventPackagePlayer {
  id: string;
  teamId: string;
  displayName: string;
  realName?: string;
  role?: string;
  nationality?: string;
  photoUrl?: string;
  metadata?: Record<string, unknown>;
}
```

`photoUrl` must be a local relative path if present.

## 9.3 Minimum Example

```json
{
  "schemaVersion": "event-package.v0.1",
  "players": [
    {
      "id": "player_blue-top",
      "teamId": "team_blue-meteors",
      "displayName": "BlueTop",
      "role": "Top",
      "nationality": "HK",
      "photoUrl": "assets/player-photos/blue-top.png"
    }
  ]
}
```

## 9.4 Sample-Event Minimum

For `sample-event`, include at least:

```text
5 players for blue team
5 players for red team
```

Recommended roles for MOBA display:

```text
Top
Jungle
Mid
Bot
Support
```

For AOV / HoK / generic MOBA, roles may use game-appropriate display strings, but the event package must not require LoL-specific role semantics in shared core.

## 9.5 Validation Expectations

Validation must check:

- Player IDs are unique.
- Each `teamId` exists in `teams.json`.
- `displayName` is non-empty.
- `photoUrl`, if present, is local and relative.
- `sample-event` has at least five players per participating team where player display is expected.

Validation should warn if:

- A team has fewer than five players.
- Player photos are missing but fallback exists.
- Role labels are inconsistent across teams.

Validation must reject:

- Hidden draft notes.
- Private strategy fields.
- Player-client binding fields.
- Any field that implies player-side automation.

---

# 10. `sponsors.json` Format

## 10.1 Purpose

`sponsors.json` defines sponsor display data and sponsor slot linkage.

Sponsor scheduling automation is out of scope for v0.1.

## 10.2 Required Shape

Recommended documentation shape:

```ts
export interface EventPackageSponsorsFile {
  schemaVersion: "event-package.v0.1";
  sponsors: EventPackageSponsor[];
}

export interface EventPackageSponsor {
  id: string;
  name: string;
  logoUrl: string;
  slots: SponsorSlot[];
  priority?: number;
  notes?: string;
}
```

Supported sponsor slots should align with shared types:

```text
PRESENTED_BY
DRAFT
LOWER_THIRD
REPLAY
OBJECTIVE
MVP
BREAK_SCREEN
SCORE_BUG
```

If `SCORE_BUG` is not in the initial shared type yet, coding agents may either:

```text
1. add it only if shared-types task already allows it; or
2. use metadata / documented future extension without breaking v0.1.
```

Do not expand shared types casually during the event package task.

## 10.3 Minimum Example

```json
{
  "schemaVersion": "event-package.v0.1",
  "sponsors": [
    {
      "id": "sponsor_presented-by",
      "name": "Presented By Sponsor",
      "logoUrl": "assets/sponsor-logos/presented-by.svg",
      "slots": ["PRESENTED_BY", "DRAFT"],
      "priority": 1
    }
  ]
}
```

## 10.4 Validation Expectations

Validation must check:

- Sponsor IDs are unique.
- `name` is non-empty.
- `logoUrl` is local and relative.
- Every slot is supported or explicitly documented as a future-safe extension.
- `sample-event` includes at least one sponsor.

Validation should warn if:

- Sponsor logo is missing but fallback exists.
- Multiple sponsors use the same slot without priority.

Validation must not implement sponsor rotation automation for v0.1.

---

# 11. `rulesets/` Folder and `DraftRuleset` Linkage

## 11.1 Purpose

The `rulesets/` folder contains local JSON `DraftRuleset` files.

A ruleset describes generic draft phases. It does not implement game-specific runtime behavior.

The universal draft engine reads `DraftRuleset` and stays game-agnostic.

## 11.2 Required Files for `sample-event`

For TQ-060, create these files when implementing the sample package:

```text
rulesets/generic-standard.json
rulesets/lol-standard.json
rulesets/aov-standard.json
rulesets/hok-standard.json
```

This documentation task does not create those fixtures; it defines how they must look.

## 11.3 Ruleset File Shape

Each file should contain one `DraftRuleset` object:

```ts
export interface DraftRuleset {
  id: string;
  gameCode: string;
  name: string;
  description?: string;
  allowDuplicateHeroes: boolean;
  globalBanAcrossSeries: boolean;
  globalPickAcrossSeries: boolean;
  phases: DraftPhaseDefinition[];
}
```

Each `DraftPhaseDefinition` must follow `docs/BAN_PICK_RULES.md`:

```ts
export interface DraftPhaseDefinition {
  id: string;
  type: "BAN" | "PICK" | "SIDE_SELECTION" | "BREAK";
  team: "BLUE" | "RED" | "AUTO" | "NONE";
  count: number;
  timeSeconds: number;
  label?: string;
  allowHover?: boolean;
  autoAdvance?: boolean;
}
```

## 11.4 Minimum Generic Example

```json
{
  "id": "generic-standard",
  "gameCode": "generic-moba",
  "name": "Generic MOBA Standard Draft",
  "description": "Small local sample ruleset for manual rehearsal.",
  "allowDuplicateHeroes": false,
  "globalBanAcrossSeries": false,
  "globalPickAcrossSeries": false,
  "phases": [
    { "id": "blue-ban-1", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "red-ban-1", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "blue-pick-1", "type": "PICK", "team": "BLUE", "count": 1, "timeSeconds": 45 },
    { "id": "red-pick-1", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 45 }
  ]
}
```

## 11.5 Linkage Rules

Rulesets link to games through:

```text
matches.json → matches[].games[].rulesetId
```

Resolution order:

```text
1. Local event package rulesets by id.
2. Loaded adapter default rulesets by id.
```

If both local and adapter rulesets use the same ID, prefer the local event package ruleset and emit a warning.

Rationale:

```text
Event package rulesets represent event-specific production setup.
Adapter defaults represent fallback defaults.
```

## 11.6 Validation Expectations

Validation must check each local ruleset with `validateDraftRuleset` from `packages/core-draft` once that package exists.

Required validation:

- `id` is non-empty.
- `gameCode` is non-empty and listed in `event.gameCodes`.
- `name` is non-empty.
- `allowDuplicateHeroes` is boolean.
- `globalBanAcrossSeries` is boolean.
- `globalPickAcrossSeries` is boolean.
- `phases` is non-empty.
- Phase IDs are unique within the ruleset.
- Phase `count` is a positive integer.
- Phase `timeSeconds` is zero or positive.
- `BAN` and `PICK` phases use `BLUE` or `RED` for v0.1 unless a future explicit rule is documented.
- `BREAK` phases may use `NONE`.
- Unsupported `SIDE_SELECTION`, `AUTO`, or complex phase behavior must be rejected or documented as reserved.

Validation must reject:

- Auto-pick fields.
- Auto-ban fields.
- LoL client reader fields.
- Hidden side-selection logic.
- Any ruleset that requires external game state to run.

---

# 12. `themes/` Folder and `ThemeConfig` Linkage

## 12.1 Purpose

The `themes/` folder contains local JSON `ThemeConfig` files for overlays and panels.

The theme system supports event branding without making overlays hardcoded.

## 12.2 Required Sample File

For TQ-060, create:

```text
themes/default-theme.json
```

## 12.3 Theme File Shape

Each file should contain one `ThemeConfig` object aligned with shared types:

```ts
export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  gameCode?: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    blueTeam: string;
    redTeam: string;
    textPrimary: string;
    textSecondary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    numberFont?: string;
  };
  layout: {
    safeMarginPx: number;
    borderRadiusPx: number;
    animationSpeedMs: number;
  };
  assets: {
    background?: string;
    frame?: string;
    sponsorFrame?: string;
  };
}
```

## 12.4 Minimum Example

```json
{
  "id": "default-theme",
  "name": "Default Local Theme",
  "version": "0.1.0",
  "colors": {
    "background": "#000000",
    "primary": "#FFFFFF",
    "secondary": "#A3A3A3",
    "accent": "#FACC15",
    "blueTeam": "#2563EB",
    "redTeam": "#DC2626",
    "textPrimary": "#FFFFFF",
    "textSecondary": "#D4D4D4"
  },
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "numberFont": "Inter"
  },
  "layout": {
    "safeMarginPx": 64,
    "borderRadiusPx": 16,
    "animationSpeedMs": 300
  },
  "assets": {
    "background": "assets/backgrounds/default-background.svg",
    "frame": "assets/frames/default-frame.svg",
    "sponsorFrame": "assets/frames/sponsor-frame.svg"
  }
}
```

## 12.5 Linkage Rules

Themes link through:

```text
event.json → defaults.themeId
matches.json → matches[].themeId
matches.json → matches[].games[].themeId
```

Resolution order:

```text
1. Game-specific theme on game instance.
2. Match-level theme.
3. Event default theme.
4. Built-in fallback theme from theme-engine.
```

Missing optional theme values must not crash overlays.

## 12.6 Validation Expectations

Validation must check:

- Theme IDs are unique.
- `id`, `name`, and `version` are present.
- Required color fields are present or can be supplied by `theme-engine` defaults.
- Layout numeric values are safe.
- Asset paths, if present, are local and relative.
- `gameCode`, if present, is listed in `event.gameCodes`.

Validation should warn if:

- Optional theme assets are missing.
- Font names are unavailable locally.
- Animation speed is too aggressive for broadcast readability.

Validation must reject:

- Remote font URLs.
- Remote CSS URLs.
- Remote image URLs.
- JavaScript injection fields.
- Theme config that depends on cloud asset services.

---

# 13. `assets/` Folder Conventions

## 13.1 Purpose

The `assets/` folder stores all local images and optional local fonts needed to run the event package without internet.

## 13.2 Recommended Structure

```text
assets
├── team-logos
├── player-photos
├── sponsor-logos
├── hero-icons
├── backgrounds
├── frames
├── fallbacks
└── fonts
```

## 13.3 File Type Guidance

Recommended image formats:

```text
.svg
.png
.webp
.jpg
.jpeg
```

Recommended font formats if local fonts are used:

```text
.woff2
.woff
```

Avoid requiring large production assets for tests.

Sample assets may be simple placeholder SVGs.

## 13.4 Asset Categories

### Team Logos

```text
assets/team-logos/<team-id>.svg
```

Linked from:

```text
teams.json → teams[].logoUrl
```

### Player Photos

```text
assets/player-photos/<player-id>.png
```

Linked from:

```text
players.json → players[].photoUrl
```

### Sponsor Logos

```text
assets/sponsor-logos/<sponsor-id>.svg
```

Linked from:

```text
sponsors.json → sponsors[].logoUrl
```

### Hero Icons

```text
assets/hero-icons/<game-code>/<hero-id>.png
```

Normally hero assets are adapter-owned. Event package hero icons are optional overrides/fallbacks, and event packages may include approved local LoL champion icons.

Recommended LoL icon path:

```text
assets/hero-icons/lol/<ChampionDataId>.png
```

Examples:

```text
assets/hero-icons/lol/Aatrox.png
assets/hero-icons/lol/MonkeyKing.png
assets/hero-icons/lol/KSante.png
```

Data Dragon may be used before the event to prepare public LoL champion metadata and approved local icon packages. Show runtime must only read local package/assets; it must not download missing assets during show operation.

Fallbacks remain required to prevent broken output, but fallback-only rendering is not the target production UX for LoL draft graphics.

### Backgrounds / Frames

```text
assets/backgrounds/default-background.svg
assets/frames/default-frame.svg
assets/frames/sponsor-frame.svg
```

Linked from:

```text
themes/*.json → assets.*
```

### Fallbacks

Recommended fallback files:

```text
assets/fallbacks/team-logo.svg
assets/fallbacks/player-photo.svg
assets/fallbacks/sponsor-logo.svg
assets/fallbacks/hero-icon.svg
assets/fallbacks/background.svg
```

Fallback assets are strongly recommended so missing optional assets do not break rehearsal.

## 13.5 Asset Fallback Behavior

If an asset is missing:

- Server validation should report a warning in health state.
- `GET /api/health/assets` should include the missing path when implemented.
- Overlays should render a local fallback asset or neutral placeholder.
- The system should not try to download remote replacement assets.
- Missing optional assets should not crash the server.

Required fallback priority:

```text
1. Referenced local asset exists → use it.
2. Entity-specific fallback exists → use it.
3. Package fallback exists → use it.
4. Built-in UI fallback renders a neutral placeholder.
5. Health warning remains visible.
```

## 13.6 Asset Validation Expectations

Validation must check:

- Referenced paths are local and relative.
- Referenced paths do not escape package root.
- Required sample fallback assets exist where practical.
- No required asset path uses `http://`, `https://`, `file://`, `//`, absolute drive paths, or `..`.

Validation should warn, not fail, for missing optional image files if fallback exists.

Validation should fail when:

- A required event package file references an unsafe path.
- No fallback exists for a required overlay-critical asset category.
- The package requires remote assets to pass tests or rehearsal.

---

# 14. `logs/` Folder and `production-log.jsonl`

## 14.1 Purpose

`logs/` stores append-only JSONL audit logs generated by the local server during rehearsal or live operation.

Default log file:

```text
logs/production-log.jsonl
```

Default full sample path:

```text
event-packages/sample-event/logs/production-log.jsonl
```

## 14.2 Relationship to API / Socket Contract

`docs/API_SOCKET_CONTRACT.md` defines API and Socket mutation behavior.

This event package spec defines where the audit log lives inside the package.

Any important live mutation accepted by REST or Socket.IO should append a JSONL entry inside the loaded package's `logs/` folder.

## 14.3 JSONL Entry Shape

Recommended documentation shape:

```ts
export interface ProductionAuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  eventPackageId: string;
  eventId?: string;
  matchId?: string;
  gameId?: string;
  draftId?: string;
  operatorId?: string;
  correlationId?: string;
  revision?: number;
  payload?: unknown;
}
```

Example:

```json
{"id":"log_2026-01-01T12-00-00-000Z_001","timestamp":"2026-01-01T12:00:00.000Z","eventType":"DRAFT_STARTED","eventPackageId":"sample-event","eventId":"event_sample-2026","matchId":"match_grand-final","gameId":"game_001","draftId":"draft_game-001","operatorId":"local-operator","revision":3,"payload":{"rulesetId":"generic-standard"}}
```

Each JSONL line must be one complete JSON object.

No pretty-print multiline JSON inside `.jsonl`.

## 14.4 Required Logged Event Categories

Important operations must be logged, including:

```text
MATCH_CREATED
MATCH_UPDATED
GAME_CREATED
GAME_UPDATED
DRAFT_CREATED
DRAFT_STARTED
DRAFT_PAUSED
DRAFT_RESUMED
HERO_HOVERED
HERO_HOVER_CLEARED
HERO_LOCKED
DRAFT_ACTION_UNDONE
DRAFT_RESET
DRAFT_COMPLETED
DRAFT_MANUAL_OVERRIDE
TIMER_ADJUSTED
PRODUCTION_STATE_CHANGED
GRAPHICS_PREVIEWED
GRAPHICS_TAKEN
GRAPHICS_CLEARED
RESULT_CONFIRMED
EMERGENCY_TRIGGERED
EMERGENCY_CLEARED
INVALID_ACTION_ATTEMPTED where useful
```

The exact event names should remain consistent with `docs/API_SOCKET_CONTRACT.md`.

## 14.5 Append-Only Expectations

Normal live operations must:

- Append one JSON object per line.
- Never rewrite previous lines.
- Never delete previous lines.
- Never truncate the log file.
- Keep each line valid JSON.
- Use ISO 8601 timestamps.
- Keep entries serializable.

Resetting a draft must not delete audit log history.

## 14.6 Recovery Boundary

v0.1 does not require full recovery by replaying JSONL.

Acceptable v0.1 behavior:

```text
Server loads event package.
Server initializes runtime state from setup JSON.
Server keeps live state in memory during the process lifetime.
Server appends important actions to JSONL.
On process restart, server may initialize clean state unless recovery is explicitly implemented.
```

If recovery from logs is implemented, it must be documented and tested.

Do not silently rely on untested log replay.

---

# 15. Sample-Event Minimum Required Content

For TQ-060, `event-packages/sample-event` must include enough data for local server loading, validation tests, and manual rehearsal.

Minimum:

```text
1 event
1 BO3 match
2 teams
at least 5 players per team
at least 1 sponsor
at least 1 default theme
rulesets for generic-moba, lol, aov, and hok
assets folder with local placeholders or safe fallbacks
logs folder with .gitkeep
```

Recommended sample IDs:

```text
packageId: sample-event
eventId: event_sample-2026
matchId: match_grand-final
teamIds: team_blue-meteors, team_red-titans
rulesetIds: generic-standard, lol-standard, aov-standard, hok-standard
themeId: default-theme
sponsorId: sponsor_presented-by
```

The sample event should prove that the project is multi-MOBA.

Do not make `lol-standard` the only usable ruleset.

Do not make `generic-moba` depend on LoL champion data.

---

# 16. Match / Team / Player / Sponsor Linkage Rules

## 16.1 Event to Match

Every match must reference the event:

```text
matches[].eventId === event.json.event.id
```

## 16.2 Match to Teams

Every match must reference existing teams:

```text
matches[].teams.blue → teams[].id
matches[].teams.red → teams[].id
```

Blue and red team IDs must be different.

## 16.3 Game to Match and Teams

Every game instance must reference:

```text
parent match ID
existing blue team ID
existing red team ID
existing game code
resolvable ruleset ID
resolvable theme ID when present
```

Game side assignment may differ between games for side swap.

Do not infer side swaps from hidden game data.

## 16.4 Players to Teams

Every player must reference an existing team:

```text
players[].teamId → teams[].id
```

For sample event, each participating team should have at least five players.

## 16.5 Sponsors to Slots

Every sponsor slot must be supported by shared types or documented as future-safe.

Matches may reference sponsor IDs through:

```text
matches[].sponsorSlotIds
```

If this property is not implemented in shared types yet, server may keep it as package metadata and expose it through runtime state without affecting draft core.

Sponsor references must not drive automated sponsor rotation in v0.1.

---

# 17. Game Adapter Linkage Rules

## 17.1 Game Codes

Game codes in the event package must match loaded adapters.

Expected v0.1 adapters:

```text
generic-moba
lol
aov
hok
```

Validation must check:

```text
event.gameCodes includes game code
server adapter loader has matching adapter
ruleset.gameCode matches or safely supports the game code
match/game gameCode resolves to adapter
```

## 17.2 Adapter Capabilities

For v0.1, loaded adapters should report:

```text
supportsManualDraft: true
supportsClientReader: false
supportsIngameHud: false
supportsPostGameStats: false
supportsAssetSync: false
```

Future capability flags may exist but must not activate out-of-scope runtime features.

## 17.3 Hero Data

Hero data normally comes from adapters, not from the event package.

The event package may provide local override/fallback assets, but must not require remote hero data.

The server should validate draft rulesets against adapter availability where practical.

It should not require live external game APIs.

## 17.4 LoL Boundaries

A LoL sample ruleset is allowed.

Allowed in event packages:

```text
approved local LoL champion icons
local icon paths such as assets/hero-icons/lol/<ChampionDataId>.png
local generated/public champion metadata references where needed
pre-event/static Data Dragon-derived asset preparation notes
```

Disallowed in event package:

```text
LCU reader config
champion-select auto-sync config
Riot lockfile path
runtime Data Dragon auto-sync URL
LoL in-game HUD binding
summoner spell automation
rune automation
```

If a future LoL plugin needs active runtime integrations, it must live in a future plugin-specific document and must not contaminate the v0.1 event package contract.

---

# 18. Ruleset Validation Expectations

Ruleset validation must combine:

```text
JSON syntax validation
DraftRuleset shape validation
validateDraftRuleset behavior from core-draft
adapter linkage validation
sample-event rehearsal expectations
```

Required automated checks for TQ-061:

- Every file in `rulesets/*.json` parses as JSON.
- Every ruleset has required fields.
- Every ruleset ID is unique.
- Every ruleset `gameCode` is listed in `event.gameCodes`.
- Every phase ID is unique within the ruleset.
- Every phase type is supported.
- Every phase count is a positive integer.
- Every phase time is zero or positive.
- Every sample ruleset can create a draft state once `packages/core-draft` exists.
- Duplicate blocking follows `allowDuplicateHeroes`.
- `count > 1` phases are accepted only if core-draft supports them.
- Unsupported phase behavior is rejected with explicit error.

Forbidden validation bypasses:

- Do not skip LoL ruleset validation because it is "just sample".
- Do not hardcode LoL draft behavior inside validation.
- Do not auto-fix invalid rulesets by changing pick/ban order silently.

---

# 19. Theme Validation Expectations

Theme validation must combine:

```text
JSON syntax validation
ThemeConfig shape validation
theme-engine validation / defaults
asset path validation
fallback behavior validation
```

Required automated checks for TQ-061:

- `themes/default-theme.json` parses as JSON.
- Theme ID is non-empty.
- Theme version is present.
- Required colors are valid or supplied by defaults.
- Required layout values are sane.
- Asset references are local relative paths.
- Missing optional theme fields are filled by `theme-engine` defaults.
- Missing optional assets do not crash validation if fallback exists.

Suggested layout sanity ranges:

```text
safeMarginPx: 0–200
borderRadiusPx: 0–80
animationSpeedMs: 0–3000
```

Reject:

- Remote CSS.
- Remote image URLs.
- Remote font URLs.
- Script injection fields.
- Cloud asset service dependency.

---

# 20. Server Loading Expectations

## 20.1 Default Package

The server should default to loading:

```text
event-packages/sample-event
```

unless a local environment variable, CLI flag, or config file explicitly points to another local package.

Any alternate package path must still be local.

## 20.2 Loading Sequence

Recommended sequence:

```text
1. Resolve package root.
2. Confirm package root exists.
3. Parse event.json.
4. Parse teams.json.
5. Parse players.json.
6. Parse sponsors.json.
7. Parse matches.json.
8. Load rulesets/*.json.
9. Load themes/*.json.
10. Validate local asset paths.
11. Load game adapters.
12. Resolve match/team/player/sponsor/ruleset/theme/adapter linkages.
13. Build serializable runtime state.
14. Initialize production state.
15. Initialize audit log writer pointing to logs/production-log.jsonl.
16. Expose health warnings without crashing on non-critical missing optional assets.
```

## 20.3 Runtime State

Loaded runtime state should expose:

```text
eventPackageId
event
matches
teams
players
sponsors
rulesets
themes
adapters
currentMatchId
currentGameId
production state
asset health
audit log health
validation warnings
```

This should appear through:

```text
GET /api/state
GET /api/events
GET /api/matches
GET /api/teams
GET /api/players
GET /api/sponsors
GET /api/adapters
GET /api/health
GET /api/health/assets
```

as defined by `docs/API_SOCKET_CONTRACT.md`.

## 20.4 Error Behavior

Critical load failures should prevent unsafe live operation and return explicit errors:

```text
EVENT_PACKAGE_NOT_LOADED
EVENT_PACKAGE_INVALID
EVENT_PACKAGE_FILE_MISSING
EVENT_PACKAGE_LINKAGE_INVALID
EVENT_PACKAGE_PATH_UNSAFE
ADAPTER_NOT_LOADED
ADAPTER_UNSUPPORTED_GAME
DRAFT_RULESET_INVALID
THEME_INVALID
```

Missing optional assets should usually produce warnings instead of fatal errors.

The server must not attempt to download missing assets.

## 20.5 No Hidden Mutation on Load

Server loading must not silently rewrite setup JSON.

If the server creates `logs/production-log.jsonl`, that is acceptable runtime persistence.

If any future admin-edit route modifies setup JSON, it must be explicitly documented, validated, and logged.

---

# 21. Automated Verification Expectations

## 21.1 TQ-060 File Syntax Checks

When sample files exist, run JSON syntax checks:

```bash
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/event.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/matches.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/teams.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/players.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('event-packages/sample-event/sponsors.json','utf8'))"
```

Also parse:

```bash
node -e "const fs=require('fs'); for (const f of fs.readdirSync('event-packages/sample-event/rulesets')) { if (f.endsWith('.json')) JSON.parse(fs.readFileSync('event-packages/sample-event/rulesets/'+f,'utf8')); }"
node -e "const fs=require('fs'); for (const f of fs.readdirSync('event-packages/sample-event/themes')) { if (f.endsWith('.json')) JSON.parse(fs.readFileSync('event-packages/sample-event/themes/'+f,'utf8')); }"
```

## 21.2 TQ-061 Validation Tests

Add tests that verify:

```text
event.json required fields
matches.json required fields
teams.json required fields
players.json required fields
sponsors.json required fields
all IDs unique
match references event
match references existing teams
games reference parent match
games reference existing teams
games reference allowed gameCode
games reference resolvable rulesets
players reference existing teams
sponsors use supported slots
rulesets validate through validateDraftRuleset
themes validate through theme-engine
all asset references are local/relative/no traversal
no remote asset URL exists
sample package can load without internet
production-log.jsonl, if present, has valid JSON per line
```

## 21.3 Server Integration Tests for TQ-071

Add tests that verify:

```text
server loads event-packages/sample-event
server exposes loaded event through GET /api/state
server exposes matches through GET /api/matches
server exposes teams through GET /api/teams
server exposes players through GET /api/players
server exposes sponsors through GET /api/sponsors
server exposes adapters through GET /api/adapters
server health includes loadedEventPackageId
server health includes asset warnings
server health includes audit log path
server does not require internet
server does not auto-sync LoL assets
```

## 21.4 Static Guardrail Searches

Recommended searches:

```bash
grep -R "https://\|http://\|//cdn\|file://" event-packages/sample-event || true
grep -R "autoPick\|autoBan\|playerClient\|LCU\|DataDragon\|champion-select\|OBSWebSocket\|vMix\|Prisma\|SQLite" event-packages/sample-event || true
```

Any match must be either:

```text
not present; or
documentation-only explanation in docs, not event package runtime data.
```

## 21.5 Root Verification

When repo scripts exist, run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Do not claim success for commands that do not exist.

Record unavailable commands in the handoff.

---

# 22. Manual Rehearsal Verification Expectations

Manual rehearsal for the event package should prove that local setup data can drive the show.

Minimum checks after TQ-071 and UI routes exist:

```text
Start server locally.
Confirm server loads sample-event.
Open /api/health and confirm loaded event package ID.
Open /api/state and confirm event, match, teams, players, sponsors, rulesets, themes, adapters.
Open admin dashboard and confirm sample event appears.
Confirm sample BO3 match appears.
Confirm blue/red teams display.
Confirm at least five players per team display where expected.
Confirm sponsor appears in relevant slot or fallback area.
Select/confirm generic-moba adapter and generic-standard ruleset.
Run a short manual draft.
Switch to LoL sample adapter manually and confirm no LCU/Data Dragon dependency is triggered.
Switch to AOV or HoK sample adapter manually and confirm architecture is not LoL-first.
Remove or rename a non-critical asset during rehearsal and confirm fallback renders.
Confirm no internet connection is required for event package loading.
Confirm logs/production-log.jsonl receives valid JSONL entries after live actions.
```

Do not treat successful JSON parsing alone as full manual rehearsal.

---

# 23. Out-of-Scope Guardrails

Coding agents must not add these to v0.1 event packages:

```text
cloud sync
remote asset dependency
CDN image dependency
remote font dependency
SQLite / Prisma / database schema
user login requirement
LoL LCU reader config
LoL champion select auto-sync
LoL active runtime Data Dragon sync
LoL in-game HUD config
OBS WebSocket config
vMix API config
Bitfocus Companion config
Stream Deck config
player-side automation
auto-pick
auto-ban
hidden competitive information fields
real sponsor scheduling automation
large copyrighted production asset bundle
```

Allowed future-safe notes:

```text
A TODO comment in documentation for future plugin support.
A local placeholder field in metadata only if it does not activate behavior.
A clearly documented optional extension that validation ignores safely.
```

Do not create active runtime behavior for future scope.

---

# 24. Implementation Notes for Future Coding Agents

## 24.1 When Creating `sample-event`

Create only the minimum safe local package needed for TQ-060.

Use placeholder local assets or simple SVGs.

Do not use real copyrighted production assets as required test assets.

Do not pull assets from the internet.

Do not call Data Dragon or any game API during show runtime. If a future task explicitly scopes pre-event/static Data Dragon preparation, generated assets and metadata must be local before rehearsal and must not create a live dependency.

## 24.2 When Writing Validation Tests

Prefer explicit test names:

```text
sample event parses all required json files
sample event has one BO3 match
sample event teams are linked by match
sample event players reference valid teams
sample event rulesets validate through core draft
sample event theme validates through theme engine
sample event contains no remote asset paths
sample event jsonl log lines are valid when present
```

Validation failures should explain the file, entity ID, and field path.

Good:

```text
matches.json matches[0].games[0].rulesetId references missing ruleset "generic-standard".
```

Bad:

```text
invalid data
```

## 24.3 When Implementing Server Loading

Keep the loader boring and inspectable.

Recommended service names:

```text
loadEventPackage
validateEventPackage
resolveEventPackageAssets
loadEventPackageRulesets
loadEventPackageThemes
createInitialRuntimeState
createAuditLogWriter
```

Do not mix server loading with draft mutation logic.

Do not bury event package parsing inside the LoL adapter.

## 24.4 When Handling Warnings

Warnings should be visible through health state.

Examples:

```text
Missing optional team logo: assets/team-logos/blue-meteors.svg. Fallback will be used.
Theme asset missing: assets/backgrounds/default-background.svg. Fallback background will be used.
Adapter default ruleset shadowed by event package ruleset: generic-standard.
```

Critical errors should block unsafe live operation.

Examples:

```text
matches.json references missing team.
Game references unavailable adapter.
Ruleset has no phases.
Asset path escapes package root.
```

---

# 25. How This Supports Required Tasks

## 25.1 TQ-060 — Create Sample Event Package Structure and JSON Files

This document defines:

```text
folder structure
required JSON files
minimum sample content
ID naming conventions
relative/local asset requirements
rulesets folder requirements
themes folder requirements
assets folder conventions
logs folder expectations
out-of-scope guardrails
```

A coding agent executing TQ-060 should create files matching this spec, not invent a new structure.

## 25.2 TQ-061 — Add Sample Event Validation Tests

This document defines validation expectations for:

```text
JSON parsing
required fields
ID uniqueness
entity linkage
ruleset validation
theme validation
asset path safety
no remote dependencies
JSONL log line parsing
out-of-scope static searches
```

A coding agent executing TQ-061 should convert these expectations into tests.

## 25.3 TQ-071 — Implement Event Package and Adapter Loading in Server Runtime

This document defines server loading expectations for:

```text
sample-event default loading
loading sequence
adapter linkage
runtime state shape
audit log path
health warnings
asset fallback behavior
critical load errors
no hidden setup JSON mutation
```

A coding agent executing TQ-071 should use this as the loading contract.

---

# 26. Final Checklist for Event Package Work

Before marking event package-related work complete, confirm:

- [ ] `event-packages/sample-event` exists.
- [ ] `event.json` exists and has `schemaVersion`.
- [ ] `matches.json` exists and contains one BO3 match.
- [ ] `teams.json` exists and contains two teams.
- [ ] `players.json` exists and contains at least five players per team.
- [ ] `sponsors.json` exists and contains at least one sponsor.
- [ ] `rulesets/generic-standard.json` exists.
- [ ] `rulesets/lol-standard.json` exists.
- [ ] `rulesets/aov-standard.json` exists.
- [ ] `rulesets/hok-standard.json` exists.
- [ ] `themes/default-theme.json` exists.
- [ ] `assets/` exists with local placeholders or fallbacks.
- [ ] `logs/` exists.
- [ ] No required asset uses remote URL.
- [ ] No required path escapes the package root.
- [ ] Rulesets validate through `DraftRuleset` rules.
- [ ] Theme validates through `ThemeConfig` rules.
- [ ] Server can load the package.
- [ ] Server exposes loaded data through `/api/state`.
- [ ] Server health reports loaded package ID, asset warnings, and audit log path.
- [ ] JSONL log entries are append-only and valid JSON per line.
- [ ] Package remains multi-MOBA and not LoL-first.
- [ ] No cloud, database, login, remote asset, LoL LCU, Data Dragon, OBS/vMix, or player-side automation dependency was added.
