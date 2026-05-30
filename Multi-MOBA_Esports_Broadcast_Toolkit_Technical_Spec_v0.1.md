# Multi-MOBA Esports Broadcast Toolkit — Technical Spec v0.1

**Project Owner:** Esports Production / Broadcast Technology Team  
**Primary Use Case:** Live esports tournament production for League of Legends, Arena of Valor, Honor of Kings, and future MOBA titles  
**Target Users:** Technical Director, Producer, Draft Operator, Graphics Operator, Referee, Observer, Caster, Admin  
**Initial Implementation Stack:** React + TypeScript + Node.js + Socket.IO  
**Document Purpose:** This specification is written for Codex / AI coding agents and human developers to implement the system in a clean, modular, production-oriented way.

---

## 1. Executive Summary

This project is not just a "Ban Pick Overlay".

The goal is to build a **local-first, production-grade esports broadcast control system** that can support:

1. Universal multi-MOBA ban/pick workflows.
2. OBS/vMix-compatible browser overlays.
3. Role-based production panels.
4. Manual operation as the core workflow.
5. Future game-specific API or client integrations.
6. League of Legends-specific in-game HUD as a plugin module.
7. Reliable fallback, emergency graphics, and audit logging for live event use.

The system must be designed so that **Ban Pick is reusable across games**, while **LoL in-game HUD is implemented as a game-specific plugin**.

---

## 2. Core Product Definition

### 2.1 Product Name

Working name:

```text
Multi-MOBA Esports Broadcast Toolkit
```

Possible internal short name:

```text
MMBT
```

### 2.2 Product Philosophy

The system should be:

- **Local-first**: It must work on a production LAN without relying on cloud services.
- **Manual-first**: Manual operation must always work, even if APIs or game readers fail.
- **Game-agnostic at the core**: The draft engine must not be hardcoded to LoL.
- **Modular**: LoL, AOV, HoK, and future games should be implemented as adapters/plugins.
- **Production-safe**: Preview / Take / Clear workflow should prevent accidental on-air graphics.
- **Operator-friendly**: Emergency fallback and clear health status must be visible to the TD.
- **AI-maintainable**: Code structure, naming, config, and logs should be easy for AI agents to inspect and modify.

---

## 3. Recommended Engineering Decision

### 3.1 Do Not Fork LoL-Specific Toolkits as the Main Foundation

Open-source LoL tools such as `league-prod-toolkit`, `lol-pick-ban-ui`, or similar projects are useful references, but they should not become the main architecture.

Reason:

- They are primarily League of Legends-oriented.
- Their data model is usually tied to Riot champion data, LCU, observer APIs, or LoL-specific broadcast workflows.
- Future support for AOV / Honor of Kings would become difficult if the core is LoL-first.

### 3.2 Recommended Approach

Build a new system with a clean architecture:

```text
Core Match System
Universal Draft System
Production Control Layer
Overlay Rendering Layer
Game Adapter Layer
LoL Broadcast Plugin
```

Use open-source projects only as references for:

- LoL champion select reading.
- LoL overlay layout ideas.
- Data Dragon asset handling.
- Production overlay structure.
- OBS browser source workflows.

---

## 4. High-Level Architecture

```text
Multi-MOBA Esports Broadcast Toolkit
│
├── Core Match System
│   ├── Event
│   ├── Match
│   ├── Game
│   ├── Team
│   ├── Player
│   ├── Score
│   ├── Sponsor
│   └── Scene State
│
├── Universal Draft System
│   ├── Draft Ruleset
│   ├── Draft Phase
│   ├── Pick / Ban Action
│   ├── Timer
│   ├── Lock-in
│   ├── Undo / Redo
│   ├── Manual Override
│   └── Draft Result Export
│
├── Game Adapter Layer
│   ├── Generic MOBA Adapter
│   ├── League of Legends Adapter
│   ├── Arena of Valor Adapter
│   ├── Honor of Kings Adapter
│   └── Future Game Adapter
│
├── Production Control Layer
│   ├── Global Production State Machine
│   ├── Preview / Program Workflow
│   ├── Role-Based Panels
│   ├── Rundown / Cues
│   ├── Emergency Mode
│   ├── Monitoring Dashboard
│   └── Audit Log
│
├── Overlay Rendering Layer
│   ├── OBS Browser Source Outputs
│   ├── Draft Overlay
│   ├── Score Bug
│   ├── Lower Third
│   ├── Sponsor Graphics
│   ├── Pause Screen
│   ├── Post-Game Summary
│   └── Emergency Static Outputs
│
└── Game-Specific Plugins
    └── LoL Broadcast Plugin
        ├── LoL Data Dragon Sync
        ├── LoL Champion Select Reader
        ├── LoL In-game HUD
        ├── Objective Tracker
        ├── Player Stats
        └── Post-Game Stats
```

---

## 5. Technology Stack

### 5.1 Initial Stack

Use:

```text
Frontend: React + TypeScript + Vite
Backend: Node.js + TypeScript
Realtime: Socket.IO
Styling: CSS Modules or Tailwind CSS
State Management: Zustand or Redux Toolkit
Package Manager: pnpm
Runtime Persistence: JSON event packages + append-only JSONL logs
Overlay Output: Browser source URLs for OBS / vMix
```

### 5.2 Why This Stack

- React is suitable for admin panels and browser overlays.
- TypeScript helps enforce shared data models.
- Node.js + Socket.IO is simple and reliable for local real-time production.
- JSON packages are easy to inspect, backup, duplicate, archive, and modify by AI agents.
- Browser source overlays are compatible with OBS and vMix.
- A monorepo structure keeps shared types and modules consistent.

### 5.3 Future Stack Options

Later versions may add:

```text
SQLite / Prisma
OBS WebSocket
Bitfocus Companion
Stream Deck integration
vMix API
Docker packaging
Electron desktop app
Local network discovery
Cloud archive sync
```

---

## 6. Monorepo Structure

Recommended repository layout:

```text
/esports-broadcast-toolkit
│
├── apps
│   ├── server
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── socket.ts
│   │   │   ├── api.ts
│   │   │   ├── state
│   │   │   ├── persistence
│   │   │   └── services
│   │   └── package.json
│   │
│   ├── admin-dashboard
│   │   ├── src
│   │   │   ├── routes
│   │   │   ├── components
│   │   │   ├── panels
│   │   │   ├── stores
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── overlay
│       ├── src
│       │   ├── routes
│       │   ├── overlays
│       │   ├── components
│       │   ├── animation
│       │   └── main.tsx
│       └── package.json
│
├── packages
│   ├── shared-types
│   │   └── src
│   ├── core-match
│   │   └── src
│   ├── core-draft
│   │   └── src
│   ├── core-production
│   │   └── src
│   ├── core-overlay
│   │   └── src
│   └── theme-engine
│       └── src
│
├── games
│   ├── generic-moba
│   │   ├── adapter.ts
│   │   └── assets
│   │
│   ├── lol
│   │   ├── adapter.ts
│   │   ├── data-dragon-sync.ts
│   │   ├── champion-select-reader.ts
│   │   ├── ingame-hud
│   │   └── assets
│   │
│   ├── aov
│   │   ├── adapter.ts
│   │   └── assets
│   │
│   └── hok
│       ├── adapter.ts
│       └── assets
│
├── event-packages
│   └── sample-event
│       ├── event.json
│       ├── matches.json
│       ├── teams.json
│       ├── players.json
│       ├── sponsors.json
│       ├── rulesets
│       ├── themes
│       ├── assets
│       └── logs
│
├── docs
│   ├── technical-spec.md
│   ├── operator-guide.md
│   ├── deployment-guide.md
│   └── game-adapter-guide.md
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

## 7. Core Modules

---

# 7.1 Core Match System

## Purpose

The Core Match System stores event, match, game, team, player, score, sponsor, and scene-related data.

It must be shared by:

- Ban Pick System
- LoL In-game HUD
- Scoreboard
- Caster Panel
- Referee Panel
- Graphics Panel
- Overlay Renderer
- Post-game Summary

## Key Concepts

```text
Event → Match → Game
```

Example:

```text
Hong Kong Invitational 2026
└── Grand Final
    ├── Game 1
    ├── Game 2
    ├── Game 3
    ├── Game 4
    └── Game 5
```

## TypeScript Interfaces

```ts
export type GameCode = "generic-moba" | "lol" | "aov" | "hok" | string;

export type MatchFormat = "BO1" | "BO3" | "BO5" | "BO7";

export type TeamSide = "BLUE" | "RED" | "LEFT" | "RIGHT";

export interface EventInfo {
  id: string;
  name: string;
  shortName?: string;
  organizer?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  timezone: string;
  defaultLanguage: string;
  gameCodes: GameCode[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  countryCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Player {
  id: string;
  teamId: string;
  displayName: string;
  realName?: string;
  role?: string;
  nationality?: string;
  photoUrl?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  slots: SponsorSlot[];
}

export type SponsorSlot =
  | "PRESENTED_BY"
  | "DRAFT"
  | "LOWER_THIRD"
  | "REPLAY"
  | "OBJECTIVE"
  | "MVP"
  | "BREAK_SCREEN";

export interface Match {
  id: string;
  eventId: string;
  gameCode: GameCode;
  title: string;
  format: MatchFormat;
  teams: {
    blue: string;
    red: string;
  };
  score: {
    blue: number;
    red: number;
  };
  currentGameNumber: number;
  status: MatchStatus;
}

export type MatchStatus =
  | "SCHEDULED"
  | "READY"
  | "LIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export interface GameInstance {
  id: string;
  matchId: string;
  gameNumber: number;
  gameCode: GameCode;
  blueTeamId: string;
  redTeamId: string;
  winnerTeamId?: string;
  draftId?: string;
  status: GameStatus;
}

export type GameStatus =
  | "NOT_STARTED"
  | "DRAFT_READY"
  | "DRAFT_LIVE"
  | "DRAFT_COMPLETE"
  | "LOADING"
  | "GAME_LIVE"
  | "PAUSED"
  | "POST_GAME"
  | "COMPLETED";
```

---

# 7.2 Universal Draft System

## Purpose

The Universal Draft System handles ban/pick workflows across multiple MOBA games.

It must not be hardcoded to League of Legends.

## Core Requirements

The draft system must support:

- Manual ban/pick operation.
- Configurable draft rulesets.
- Multi-game hero/champion database.
- Timer per phase.
- Lock-in / hover states.
- Undo / redo.
- Manual override.
- Side swap.
- Draft reset.
- Draft export.
- Fearless / global ban style draft rules.
- Match series memory.

## Draft Concepts

```text
Draft
├── Phase
│   ├── BAN
│   ├── PICK
│   ├── SIDE_SELECTION
│   └── BREAK
├── Action
│   ├── PENDING
│   ├── HOVER
│   ├── LOCKED
│   └── CANCELLED
└── Result
```

## TypeScript Interfaces

```ts
export type DraftActionType = "BAN" | "PICK" | "SIDE_SELECTION" | "BREAK";

export type DraftActionStatus =
  | "PENDING"
  | "HOVER"
  | "LOCKED"
  | "CANCELLED"
  | "SKIPPED";

export interface Hero {
  id: string;
  gameCode: GameCode;
  displayName: string;
  localizedNames?: Record<string, string>;
  roleTags?: string[];
  iconUrl?: string;
  splashUrl?: string;
  squareUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface DraftRuleset {
  id: string;
  gameCode: GameCode;
  name: string;
  description?: string;
  allowDuplicateHeroes: boolean;
  globalBanAcrossSeries: boolean;
  globalPickAcrossSeries: boolean;
  phases: DraftPhaseDefinition[];
}

export interface DraftPhaseDefinition {
  id: string;
  type: DraftActionType;
  team: TeamSide | "AUTO" | "NONE";
  count: number;
  timeSeconds: number;
  label?: string;
  allowHover?: boolean;
  autoAdvance?: boolean;
}

export interface DraftState {
  id: string;
  gameId: string;
  rulesetId: string;
  gameCode: GameCode;
  status: DraftStatus;
  currentPhaseIndex: number;
  timer: DraftTimerState;
  actions: DraftAction[];
  lockedHeroIds: string[];
  bannedHeroIds: string[];
  pickedHeroIds: string[];
  history: DraftHistoryEntry[];
}

export type DraftStatus =
  | "NOT_STARTED"
  | "READY"
  | "LIVE"
  | "PAUSED"
  | "COMPLETE"
  | "CANCELLED";

export interface DraftAction {
  id: string;
  phaseId: string;
  type: DraftActionType;
  team: TeamSide;
  slotIndex: number;
  heroId: string | null;
  status: DraftActionStatus;
  operatorId?: string;
  createdAt: string;
  lockedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface DraftTimerState {
  isRunning: boolean;
  phaseStartedAt?: string;
  remainingSeconds: number;
  originalSeconds: number;
}

export interface DraftHistoryEntry {
  id: string;
  timestamp: string;
  operatorId?: string;
  action: string;
  before?: unknown;
  after?: unknown;
}
```

---

## Example Draft Ruleset: Generic LoL-Style Draft

```json
{
  "id": "lol-standard-5v5",
  "gameCode": "lol",
  "name": "LoL Standard Draft",
  "allowDuplicateHeroes": false,
  "globalBanAcrossSeries": false,
  "globalPickAcrossSeries": false,
  "phases": [
    { "id": "b1", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "b2", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "b3", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "b4", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "b5", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "b6", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },

    { "id": "p1", "type": "PICK", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "p2", "type": "PICK", "team": "RED", "count": 2, "timeSeconds": 60 },
    { "id": "p3", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "p4", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },

    { "id": "b7", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "b8", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },
    { "id": "b9", "type": "BAN", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "b10", "type": "BAN", "team": "BLUE", "count": 1, "timeSeconds": 30 },

    { "id": "p5", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 },
    { "id": "p6", "type": "PICK", "team": "BLUE", "count": 2, "timeSeconds": 60 },
    { "id": "p7", "type": "PICK", "team": "RED", "count": 1, "timeSeconds": 30 }
  ]
}
```

---

# 7.3 Game Adapter Layer

## Purpose

Each game should provide its own adapter, but all adapters must expose the same interface to the core system.

## Adapter Responsibilities

A game adapter provides:

- Game metadata.
- Hero/champion database.
- Asset paths.
- Default draft rulesets.
- Optional API / client reader.
- Optional in-game HUD data mapping.
- Localization.
- Validation rules.

## Interface

```ts
export interface GameAdapter {
  gameCode: GameCode;
  displayName: string;

  loadHeroes(): Promise<Hero[]>;
  loadDefaultRulesets(): Promise<DraftRuleset[]>;

  getHeroById(heroId: string): Hero | null;
  searchHeroes(query: string): Hero[];

  validateDraftAction(state: DraftState, action: DraftAction): DraftValidationResult;

  getAssetUrl(assetType: GameAssetType, id: string): string | null;

  capabilities: GameAdapterCapabilities;
}

export type GameAssetType =
  | "HERO_ICON"
  | "HERO_SPLASH"
  | "HERO_SQUARE"
  | "ROLE_ICON"
  | "ITEM_ICON"
  | "SPELL_ICON"
  | "RUNE_ICON";

export interface GameAdapterCapabilities {
  supportsManualDraft: boolean;
  supportsClientReader: boolean;
  supportsIngameHud: boolean;
  supportsPostGameStats: boolean;
  supportsAssetSync: boolean;
}

export interface DraftValidationResult {
  valid: boolean;
  reason?: string;
}
```

---

## Initial Adapters

### Generic MOBA Adapter

Must support:

- Manual hero database.
- Custom hero import.
- Custom ruleset.
- Basic icon assets.
- No API dependency.

### League of Legends Adapter

Must support:

- Manual draft.
- Data Dragon asset sync.
- Champion database.
- LoL-specific roles and assets.
- Future LCU champion select reader.
- Future in-game HUD plugin.

### Arena of Valor Adapter

Must support:

- Manual draft.
- Manually maintained hero database.
- Custom rulesets.
- No dependency on official API.

### Honor of Kings Adapter

Must support:

- Manual draft.
- Manually maintained hero database.
- Global ban/pick presets.
- No dependency on official API.

---

# 7.4 Production Control Layer

## Purpose

This is the layer that turns the system from a simple overlay tool into a real broadcast control system.

## Global Production State Machine

The system must maintain a global production state:

```ts
export type ProductionState =
  | "PRE_SHOW"
  | "OPENING"
  | "TEAM_INTRO"
  | "DRAFT_READY"
  | "DRAFT_LIVE"
  | "DRAFT_COMPLETE"
  | "LOADING_SCREEN"
  | "GAME_LIVE"
  | "PAUSE"
  | "TECH_PAUSE"
  | "POST_GAME"
  | "MVP"
  | "BREAK"
  | "NEXT_GAME"
  | "MATCH_COMPLETE";
```

## State Responsibilities

Each state should control:

- Which overlay is active.
- Which controls are enabled.
- Whether draft actions are allowed.
- Whether the in-game HUD is visible.
- Whether sponsor slots are active.
- Whether emergency mode is available.
- Whether graphics can be taken to program.

## Preview / Program Workflow

Graphics should not always go live immediately.

Use:

```text
Prepare → Preview → Take to Program → Clear
```

Example:

```ts
export interface GraphicTakeState {
  id: string;
  graphicType: GraphicType;
  previewPayload: unknown | null;
  programPayload: unknown | null;
  status: "IDLE" | "PREVIEW" | "ON_PROGRAM";
}
```

Supported graphic types:

```ts
export type GraphicType =
  | "DRAFT_OVERLAY"
  | "SCORE_BUG"
  | "LOWER_THIRD"
  | "SPONSOR_BUG"
  | "PAUSE_SCREEN"
  | "POST_GAME_STATS"
  | "MVP"
  | "EMERGENCY";
```

---

# 7.5 Role-Based Panels

## Required Panels

### Admin Panel

For system owner / TD.

Must support:

- Event setup.
- Match setup.
- Team setup.
- Player setup.
- Sponsor setup.
- Ruleset selection.
- Theme selection.
- User roles.
- System health.
- Emergency reset.

### Producer Panel

For live director / producer.

Must support:

- Global production state.
- Preview / Take / Clear.
- Cue control.
- Sponsor control.
- Scene state.
- Emergency graphics.
- Overlay visibility.

### Draft Operator Panel

For ban/pick operator.

Must support:

- Current draft status.
- Hero search.
- Pick / ban hover.
- Lock-in.
- Undo.
- Timer control.
- Pause / resume draft.
- Manual override.
- Draft complete confirmation.

### Referee Panel

For referee or competition admin.

Must support:

- Team confirmation.
- Side confirmation.
- Draft lock confirmation.
- Pause request.
- Remake flag.
- Penalty ban notation.
- Result confirmation.

### Graphics Panel

For CG operator.

Must support:

- Lower thirds.
- Sponsor bugs.
- MVP graphics.
- Post-game stats graphics.
- Manual text graphics.
- Preview / Take.

### Caster Panel

Read-only or limited control.

Must show:

- Match info.
- Team info.
- Player info.
- Current draft.
- Draft summary.
- Previous game draft.
- Talking points.
- Sponsor-safe public stats.
- No hidden competitive information.

### Observer Panel

For observer or camera director.

Must show:

- Current match state.
- Draft summary.
- Key players.
- Manual observer cues.
- Upcoming objectives in future LoL plugin.
- Replay markers in future versions.

---

# 7.6 Permission System

## Roles

```ts
export type UserRole =
  | "ADMIN"
  | "PRODUCER"
  | "DRAFT_OPERATOR"
  | "REFEREE"
  | "GRAPHICS_OPERATOR"
  | "CASTER"
  | "OBSERVER"
  | "VIEWER";
```

## Permission Examples

```ts
export type Permission =
  | "MATCH_EDIT"
  | "DRAFT_CONTROL"
  | "DRAFT_OVERRIDE"
  | "TIMER_CONTROL"
  | "GRAPHICS_PREVIEW"
  | "GRAPHICS_TAKE"
  | "PRODUCTION_STATE_CHANGE"
  | "RESULT_CONFIRM"
  | "EMERGENCY_MODE"
  | "SYSTEM_ADMIN";
```

## Locking Requirements

The system must support:

```text
Lock Match
Lock Draft
Lock Result
Unlock with admin confirmation
```

This is important for live production safety.

---

# 7.7 Overlay Rendering Layer

## Purpose

Render all graphics as browser-source compatible outputs.

## Required Overlay Routes

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/lower-third
/overlay/sponsor
/overlay/pause
/overlay/post-game/:matchId
/overlay/mvp/:matchId
/overlay/emergency
/overlay/program
/overlay/preview
```

## Overlay Requirements

Each overlay should:

- Connect to Socket.IO.
- Auto-reconnect.
- Display connection status in debug mode.
- Use transparent background where appropriate.
- Support 1920x1080 by default.
- Support future 2560x1440 / 3840x2160 scaling.
- Support safe margins.
- Support animation timing configuration.
- Support emergency fallback state.

## Overlay Display Modes

```ts
export type OverlayDisplayMode =
  | "PROGRAM"
  | "PREVIEW"
  | "DEBUG"
  | "STANDALONE";
```

---

# 7.8 Theme System

## Purpose

Allow the same system to be reused across different clients, events, brands, and games.

## Theme Config

```ts
export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  gameCode?: GameCode;
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

## Theme Requirements

The system must support:

- Event theme.
- Game-specific theme.
- Client-branded theme.
- Sponsor-specific graphic slots.
- Manual CSS override for advanced users.

---

# 7.9 Sponsor Inventory System

## Purpose

The system should be able to support monetizable sponsor placements.

## Sponsor Slots

```text
Presented By
Draft Sponsor
Lower Third Sponsor
Replay Sponsor
Objective Sponsor
MVP Sponsor
Break Screen Sponsor
Score Bug Sponsor
```

## Sponsor Config

```ts
export interface SponsorPlacement {
  id: string;
  sponsorId: string;
  slot: SponsorSlot;
  enabled: boolean;
  priority: number;
  startTime?: string;
  endTime?: string;
  matchIds?: string[];
  graphicUrl?: string;
}
```

---

# 7.10 Emergency Mode

## Purpose

Live production must survive server, browser, API, or operator failure.

## Emergency Features

The system must support:

- Emergency static scoreboard.
- Emergency pause screen.
- Emergency sponsor loop.
- Emergency draft summary.
- Export current draft as PNG.
- Export current scoreboard as PNG.
- Export match result as PNG.
- Emergency overlay route that does not depend on complex state.

## Emergency Overlay Route

```text
/overlay/emergency
```

## Emergency Export

The server should provide:

```text
POST /api/export/draft-png
POST /api/export/scoreboard-png
POST /api/export/result-png
```

PNG export may be implemented in a later version if needed. For v0.1, JSON export is required and PNG export can be stubbed.

---

# 7.11 Audit Logging

## Purpose

Every important operation must be logged.

## Log Format

Use append-only JSONL in v0.1.

Example:

```json
{"timestamp":"2026-05-22T12:00:01.000Z","operatorId":"op1","event":"DRAFT_STARTED","matchId":"m1","gameId":"g1"}
{"timestamp":"2026-05-22T12:00:12.000Z","operatorId":"op1","event":"HERO_BANNED","team":"BLUE","heroId":"ahri"}
{"timestamp":"2026-05-22T12:00:31.000Z","operatorId":"op2","event":"TIMER_PAUSED","reason":"Referee request"}
```

## Must Log

- Match creation / update.
- Game creation / update.
- Draft start / pause / resume / complete.
- Pick / ban hover / lock.
- Undo / override.
- Timer changes.
- Production state changes.
- Graphics preview / take / clear.
- Result confirmation.
- Emergency mode trigger.

---

# 7.12 Monitoring Dashboard

## Purpose

The TD must know the health of the system at a glance.

## Health Items

```text
Server: Online
Socket.IO: Online
Admin Dashboard: Connected
Overlay Program: Connected
Overlay Preview: Connected
Draft Operator: Connected
Observer Reader: Connected
Game Adapter: Loaded
Asset Cache: OK
Current Event Package: Loaded
Current Production State: DRAFT_LIVE
Emergency Mode: Ready
Last State Update: 1.2 seconds ago
```

## Health Interface

```ts
export interface SystemHealth {
  serverStartedAt: string;
  socketClients: SocketClientInfo[];
  loadedEventPackageId?: string;
  currentProductionState: ProductionState;
  adapterStatus: Record<GameCode, AdapterHealth>;
  assetStatus: AssetHealth;
  emergencyReady: boolean;
}

export interface SocketClientInfo {
  id: string;
  role?: UserRole;
  panel?: string;
  connectedAt: string;
  lastSeenAt: string;
}

export interface AdapterHealth {
  loaded: boolean;
  heroCount: number;
  lastSyncAt?: string;
  error?: string;
}

export interface AssetHealth {
  missingAssets: string[];
  warnings: string[];
}
```

---

# 7.13 Data Source Priority

The system must always support manual fallback.

## Data Source Priority

```text
1. Official / approved API or game reader
2. Local observer reader
3. Manual operator input
4. Preloaded mock data
5. Static emergency graphic
```

## Rule

API integration must never be the only way to run the show.

---

# 7.14 Compliance Boundary

The system must be designed with esports integrity in mind.

## Required Principles

The system must not:

- Automate player-side gameplay actions.
- Auto-pick or auto-ban on behalf of players.
- Expose hidden competitive information.
- Run unauthorized software on player PCs.
- Provide unfair information to players.
- Depend on unsupported game-client behavior for live production.

The system may:

- Display manually entered production graphics.
- Read public or approved data sources.
- Read observer-side data where allowed.
- Use local game client data for production if policy-compliant.
- Provide manual fallback for all critical outputs.

---

## 8. Backend API Specification

### 8.1 REST API

Use REST for setup and persistence.

Base path:

```text
/api
```

### Event APIs

```text
GET    /api/events
POST   /api/events
GET    /api/events/:eventId
PUT    /api/events/:eventId
DELETE /api/events/:eventId
```

### Match APIs

```text
GET    /api/matches
POST   /api/matches
GET    /api/matches/:matchId
PUT    /api/matches/:matchId
DELETE /api/matches/:matchId
```

### Team APIs

```text
GET    /api/teams
POST   /api/teams
GET    /api/teams/:teamId
PUT    /api/teams/:teamId
DELETE /api/teams/:teamId
```

### Player APIs

```text
GET    /api/players
POST   /api/players
GET    /api/players/:playerId
PUT    /api/players/:playerId
DELETE /api/players/:playerId
```

### Draft APIs

```text
GET    /api/drafts/:draftId
POST   /api/drafts
POST   /api/drafts/:draftId/start
POST   /api/drafts/:draftId/pause
POST   /api/drafts/:draftId/resume
POST   /api/drafts/:draftId/reset
POST   /api/drafts/:draftId/complete
POST   /api/drafts/:draftId/actions/:actionId/hover
POST   /api/drafts/:draftId/actions/:actionId/lock
POST   /api/drafts/:draftId/undo
```

### Production APIs

```text
GET    /api/production/state
POST   /api/production/state
POST   /api/production/preview
POST   /api/production/take
POST   /api/production/clear
POST   /api/production/emergency
```

### Health APIs

```text
GET    /api/health
GET    /api/health/assets
GET    /api/health/clients
```

---

## 8.2 Socket.IO Events

Use Socket.IO for live state.

### Server to Client

```text
state:full
state:patch
draft:updated
draft:timer
production:state
graphics:preview
graphics:program
graphics:clear
health:update
log:entry
error
```

### Client to Server

```text
client:hello
draft:start
draft:pause
draft:resume
draft:hover
draft:lock
draft:undo
draft:reset
production:set-state
graphics:preview
graphics:take
graphics:clear
emergency:trigger
```

### Example Payload

```ts
export interface SocketEnvelope<T> {
  type: string;
  timestamp: string;
  operatorId?: string;
  payload: T;
}
```

---

## 9. Frontend Route Specification

---

# 9.1 Admin Dashboard Routes

```text
/admin
/admin/events
/admin/events/:eventId
/admin/matches
/admin/matches/:matchId
/admin/teams
/admin/players
/admin/sponsors
/admin/themes
/admin/system-health
```

---

# 9.2 Production Panel Routes

```text
/producer
/producer/match/:matchId
/producer/rundown
/producer/graphics
/producer/emergency
```

---

# 9.3 Draft Operator Routes

```text
/draft
/draft/:matchId
/draft/:matchId/game/:gameNumber
```

---

# 9.4 Referee Routes

```text
/referee
/referee/match/:matchId
```

---

# 9.5 Graphics Routes

```text
/graphics
/graphics/lower-third
/graphics/sponsor
/graphics/post-game
/graphics/mvp
```

---

# 9.6 Caster Routes

```text
/caster
/caster/match/:matchId
```

---

# 9.7 Overlay Routes

```text
/overlay/program
/overlay/preview
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/lower-third
/overlay/sponsor
/overlay/pause
/overlay/post-game/:matchId
/overlay/mvp/:matchId
/overlay/emergency
```

---

## 10. Event Package Format

An event package should be portable and human-readable.

```text
event-packages/sample-event
├── event.json
├── matches.json
├── teams.json
├── players.json
├── sponsors.json
├── rulesets
│   ├── lol-standard.json
│   ├── aov-standard.json
│   └── hok-global-bp.json
├── themes
│   └── default-theme.json
├── assets
│   ├── team-logos
│   ├── sponsor-logos
│   ├── hero-icons
│   └── backgrounds
└── logs
    └── production-log.jsonl
```

---

## 11. Initial v0.1 Scope

The first version should focus on a reliable universal manual system.

## Must Have in v0.1

```text
Core Match System
Universal Manual Ban Pick
Game Adapter structure
Generic MOBA adapter
LoL basic adapter with manually included champion data sample
AOV sample adapter
HoK sample adapter
Admin Dashboard
Draft Operator Panel
OBS Draft Overlay
Basic Score Bug Overlay
Production State Machine
Socket.IO realtime sync
JSON event package loading
Audit logging
Mock mode
Manual override
Timer control
Undo
Emergency state route
System health page
```

## Should Have in v0.1

```text
Basic Producer Panel
Basic Sponsor logo slots
Basic Theme Config
Preview / Program separation for draft overlay
Caster read-only panel
```

## Not Required in v0.1

```text
LoL LCU Reader
LoL In-game HUD
Data Dragon automatic sync
OBS WebSocket integration
vMix integration
Bitfocus Companion integration
User login system
Cloud sync
SQLite database
PNG export
Advanced animation editor
```

---

## 12. v0.2 Scope

Focus on production-grade workflow.

```text
Role-based permission system
Preview / Take / Clear workflow
Rundown cue list
Emergency PNG export
Sponsor inventory improvements
Caster panel improvements
Observer cue board
Better theme editor
Asset missing warning system
Event package import/export UI
```

---

## 13. v0.3 Scope — LoL Broadcast Plugin

Focus on League of Legends.

```text
LoL Data Dragon sync
Patch version lock
LoL champion select reader
LoL draft auto-mirror
Manual override remains available
LoL in-game HUD
Objective tracker
Gold difference display
Team/player stat mapping
Post-game stats
LoL observer PC data receiver
```

Important:

The LoL plugin must remain separate from the Universal Draft System.

---

## 14. v0.4 Scope

Focus on advanced production integration.

```text
OBS WebSocket integration
vMix API integration
Bitfocus Companion API
Stream Deck button mapping
Replay markers
Advanced sponsor automation
Cloud archive sync
AI-generated match report
AI-generated draft analysis
Multi-language overlay output
```

---

## 15. Implementation Plan for Codex

This section is written directly for a coding agent.

---

# Milestone 1 — Repository Setup

Create:

```text
pnpm monorepo
apps/server
apps/admin-dashboard
apps/overlay
packages/shared-types
packages/core-match
packages/core-draft
packages/core-production
packages/theme-engine
games/generic-moba
games/lol
games/aov
games/hok
```

Add:

```text
TypeScript
Vite
React
Socket.IO
ESLint
Prettier
Basic README
```

Acceptance criteria:

- `pnpm install` works.
- `pnpm dev` starts server, admin dashboard, and overlay.
- Shared TypeScript types compile across apps.

---

# Milestone 2 — Shared Types and Core Models

Implement:

```text
EventInfo
Team
Player
Sponsor
Match
GameInstance
DraftRuleset
DraftState
DraftAction
ProductionState
ThemeConfig
SystemHealth
```

Acceptance criteria:

- Types are exported from `packages/shared-types`.
- Server and frontend import the same types.
- Basic unit tests validate draft ruleset parsing.

---

# Milestone 3 — Server Runtime State

Implement server state manager:

```text
load event package
create match
create game
create draft
update draft
update production state
append audit log
broadcast state by Socket.IO
```

Acceptance criteria:

- Server can load `event-packages/sample-event`.
- Server exposes `/api/health`.
- Server emits `state:full` on client connect.
- All important actions append JSONL log entries.

---

# Milestone 4 — Universal Draft Engine

Implement:

```text
start draft
pause draft
resume draft
hover hero
lock hero
advance phase
undo last action
reset draft
complete draft
timer tick
ruleset validation
```

Acceptance criteria:

- A full manual draft can be completed using a generic ruleset.
- Duplicate hero selection is blocked if `allowDuplicateHeroes` is false.
- Undo works for locked actions.
- Timer can be paused and resumed.
- Draft state is broadcast in real time.

---

# Milestone 5 — Admin Dashboard

Implement basic admin screens:

```text
Event overview
Match setup
Team setup
Player setup
Ruleset selection
System health
```

Acceptance criteria:

- User can select an active match.
- User can assign blue/red teams.
- User can select game code.
- User can select draft ruleset.
- Health status displays server and connected clients.

---

# Milestone 6 — Draft Operator Panel

Implement:

```text
Current phase display
Team display
Hero search grid
Pick / ban slots
Hover
Lock
Undo
Pause / resume timer
Reset draft
Complete draft
```

Acceptance criteria:

- Operator can run a full draft from start to finish.
- Overlay updates instantly.
- Timer is visible.
- Current team turn is obvious.
- Undo and reset require confirmation.

---

# Milestone 7 — OBS Draft Overlay

Implement:

```text
Transparent draft overlay
Blue side picks/bans
Red side picks/bans
Current timer
Current phase indicator
Team names/logos
Sponsor slot
Theme config support
Debug mode
```

Acceptance criteria:

- Overlay can be used as OBS browser source.
- 1920x1080 transparent background works.
- Overlay reconnects to server automatically.
- Missing hero icon shows fallback graphic.

---

# Milestone 8 — Production Control Layer

Implement:

```text
Production state machine
Producer panel
Preview / Program concept
Take / Clear graphic state
Emergency state
```

Acceptance criteria:

- Producer can change global production state.
- Overlay can display different content based on production state.
- Emergency route can be triggered.
- Actions are logged.

---

# Milestone 9 — Game Adapters

Implement:

```text
Generic MOBA adapter
LoL sample adapter
AOV sample adapter
HoK sample adapter
```

Acceptance criteria:

- Each adapter loads a hero list.
- Each adapter loads at least one ruleset.
- Admin can switch game adapter.
- Draft panel updates hero database based on selected game.

---

# Milestone 10 — Packaging and Documentation

Add:

```text
README.md
operator-guide.md
deployment-guide.md
sample-event package
sample OBS URL list
.env.example
```

Acceptance criteria:

- A new operator can run the system locally using the README.
- OBS URL examples are documented.
- Sample event works without external API.

---

## 16. Coding Guidelines

### General

- Use TypeScript strictly.
- Avoid hardcoding LoL-specific logic in shared packages.
- Keep game-specific logic under `/games`.
- Keep runtime state serializable.
- Prefer simple JSON configs over hidden magic.
- Every important state mutation should be logged.
- Every UI control that can affect live output should require deliberate action.

### Naming

Use clear names:

```text
DraftState
ProductionState
MatchState
GameAdapter
OverlayRoute
GraphicTakeState
```

Avoid vague names:

```text
data
info
manager
stuff
misc
```

### Error Handling

All API responses should return:

```ts
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Socket Error Handling

Socket events should emit explicit errors:

```text
error:draft-invalid-action
error:permission-denied
error:state-conflict
error:adapter-not-loaded
error:asset-missing
```

---

## 17. Testing Strategy

### Unit Tests

Test:

```text
Draft ruleset parsing
Draft phase advancement
Duplicate hero validation
Timer state calculation
Undo logic
Production state transitions
Game adapter loading
```

### Integration Tests

Test:

```text
Server loads sample event
Draft panel action updates overlay state
Socket reconnect receives latest state
Audit log receives entries
```

### Manual Rehearsal Tests

Create a rehearsal checklist:

```text
Start server
Open admin dashboard
Open draft operator panel
Open OBS overlay route
Load sample match
Start draft
Complete draft
Trigger emergency mode
Reset system
Reload browser sources
Confirm state recovery
```

---

## 18. Local Deployment Plan

### Recommended Live Production Setup

```text
Main Control Mini PC / Laptop
├── Node server
├── Admin dashboard
├── Local event package
├── Local asset cache
└── WebSocket server

Graphics PC / OBS
├── Browser Source: Program Overlay
├── Browser Source: Draft Overlay
├── Browser Source: Emergency Overlay
└── Static backup scenes

Draft Operator Laptop
└── Draft Operator Panel

Producer Laptop
└── Producer Panel

Caster Tablet / Laptop
└── Caster Panel

Observer PC
└── Future LoL Reader / Observer Tool
```

### Network Principle

The system should run on a private production LAN.

Do not rely on internet access during live show except for optional asset downloads before rehearsal.

---

## 19. Security and Safety

### v0.1

For local production, full login is optional, but role mode should still exist in UI state.

### v0.2

Add:

```text
User login
Role-based permissions
Operator ID
Action confirmation
Admin unlock
```

### Safety Confirmations

Require confirmation for:

```text
Reset draft
Complete draft
Change winner
Trigger emergency mode
Unlock locked result
Switch active match during live state
```

---

## 20. Future LoL Plugin Notes

The LoL plugin should be implemented after the universal manual draft system is stable.

### LoL Plugin Must Not

- Auto-pick.
- Auto-ban.
- Control player clients.
- Expose hidden information.
- Depend on player PC software.

### LoL Plugin May

- Sync champion data from Data Dragon.
- Read champion select data if allowed and technically stable.
- Mirror draft data to overlay.
- Read observer-side data for in-game HUD where appropriate.
- Provide manual override for all live data.

### LoL Plugin Architecture

```text
games/lol
├── adapter.ts
├── data-dragon-sync.ts
├── champion-select-reader.ts
├── ingame-hud
│   ├── hud-types.ts
│   ├── objective-tracker.ts
│   ├── scorebug-mapper.ts
│   └── post-game-stats.ts
└── assets
```

---

## 21. Final Acceptance Criteria for v0.1

The project is considered v0.1 complete when:

1. A user can create or load a sample event.
2. A user can configure teams, match, game, and ruleset.
3. A Draft Operator can run a full manual draft.
4. OBS overlay updates in real time.
5. The system supports at least three game adapters: Generic, LoL sample, AOV sample, HoK sample.
6. The system has a working production state machine.
7. The system has a basic Producer Panel.
8. The system has a health dashboard.
9. The system logs important actions to JSONL.
10. The system can run fully on a local network without internet.
11. The system has clear documentation for operators and developers.
12. LoL-specific code is not mixed into the universal draft core.

---

## 22. Important Architectural Rule

The most important rule:

```text
Universal Ban Pick must be game-agnostic.
LoL In-game HUD must be a plugin.
Production Control must sit above both.
```

Do not build:

```text
LoL System → Add AOV later
```

Build:

```text
Broadcast Toolkit Core → Add LoL / AOV / HoK adapters
```

This makes the system maintainable, reusable, and suitable for a real esports production company.
