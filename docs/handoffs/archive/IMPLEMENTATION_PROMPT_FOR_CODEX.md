# IMPLEMENTATION_PROMPT_FOR_CODEX.md

## Role

You are Codex acting as a senior full-stack engineer and technical architect.

Your task is to implement the **Multi-MOBA Esports Broadcast Toolkit v0.1** based on the technical specification.

This is a production-oriented esports broadcast control system for a real esports/event production company. It is not a simple hobby overlay.

---

## Source Specification

Before writing code, read and follow:

```text
Multi-MOBA_Esports_Broadcast_Toolkit_Technical_Spec_v0.1.md
```

That document is the source of truth for architecture, product direction, module boundaries, data models, API design, Socket.IO events, roadmap, and acceptance criteria.

This implementation prompt converts that technical spec into an actionable development plan.

---

## Product Goal

Build a local-first, manual-first, production-safe esports broadcast toolkit that supports:

1. Universal multi-MOBA ban/pick workflows.
2. OBS/vMix browser-source overlays.
3. Role-based production panels.
4. Production state control.
5. Manual fallback as the core workflow.
6. Future LoL-specific API / in-game HUD plugins without contaminating the universal draft core.

The v0.1 goal is **not** to build a complete LoL in-game HUD yet.

The v0.1 goal is to build a reliable foundation:

```text
Core Match System
Universal Manual Ban Pick
Game Adapter Layer
Production Control Layer
OBS Overlay Layer
JSON Event Packages
Socket.IO Realtime Sync
Audit Logs
Emergency Mode
Health Dashboard
```

---

## Critical Architectural Rule

Do not build a League of Legends-only system.

The most important rule:

```text
Universal Ban Pick must be game-agnostic.
LoL In-game HUD must be a future plugin.
Production Control must sit above both.
```

Correct architecture:

```text
Broadcast Toolkit Core
├── Generic Draft Engine
├── Game Adapters
│   ├── LoL
│   ├── AOV
│   └── HoK
└── Production Control Layer
```

Incorrect architecture:

```text
LoL System
└── Add AOV / HoK later
```

Do not hardcode LoL concepts into shared packages.

LoL-specific logic must live only under:

```text
/games/lol
```

---

## Compliance and Safety Requirements

The system must not:

- Auto-pick.
- Auto-ban.
- Control player clients.
- Automate player-side gameplay actions.
- Expose hidden competitive information.
- Require software to run on player PCs.
- Depend on unsupported client behavior as the only production workflow.

The system may:

- Support manual operator input.
- Display broadcast graphics.
- Read approved or observer-side data in future versions.
- Provide future LoL reader plugins with manual override.

In v0.1, do **not** implement LoL LCU reader or in-game HUD. Only create clean extension points.

---

## Implementation Philosophy

Implement incrementally.

Do not attempt to build every future feature at once.

Use reference-driven implementation for feature completeness, operator UX, asset pipeline shape, broadcast overlay hierarchy, and manual QA expectations. Mature public tools and official docs may inform the work, but implementation must be re-created inside this project's own architecture.

For every milestone:

1. Make the smallest working version.
2. Keep code type-safe.
3. Keep modules clean.
4. Run build/type checks.
5. Add or update documentation.
6. Leave clear TODO notes only for future roadmap items.
7. Do not introduce unnecessary external services.

Prefer simple, inspectable, local-first implementation.

Fallback rendering is a safety net for broken or missing assets, not the target production UX.

Use JSON files and in-memory runtime state for v0.1.

Do not add a database in v0.1 unless explicitly necessary.

---

## Recommended Tech Stack

Use:

```text
Frontend: React + TypeScript + Vite
Backend: Node.js + TypeScript
Realtime: Socket.IO
Package manager: pnpm
Monorepo: pnpm workspace
State management: Zustand or lightweight React state
Styling: Tailwind CSS or CSS Modules
Persistence: JSON event packages + JSONL audit logs
Testing: Vitest
Linting: ESLint + Prettier
```

If a dependency is not necessary for v0.1, avoid it.

---

## Expected Repository Structure

Create this structure:

```text
/esports-broadcast-toolkit
│
├── apps
│   ├── server
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── api.ts
│   │   │   ├── socket.ts
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
│   │   ├── sample-champions.ts
│   │   └── assets
│   │
│   ├── aov
│   │   ├── adapter.ts
│   │   ├── sample-heroes.ts
│   │   └── assets
│   │
│   └── hok
│       ├── adapter.ts
│       ├── sample-heroes.ts
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
├── README.md
└── .env.example
```

---

## Development Phases

Implement in the following order.

Do not skip ahead to LoL in-game HUD.

---

# Phase 0 — Inspect Existing Repo

If the repository already exists:

1. Inspect existing files.
2. Preserve user work.
3. Do not delete existing files unless clearly obsolete and safe.
4. Summarize what exists before modifying.
5. If the repo is empty, initialize from scratch.

If the technical spec file exists in the repo, read it first.

---

# Phase 1 — Monorepo Setup

## Tasks

Create a pnpm monorepo with:

```text
apps/server
apps/admin-dashboard
apps/overlay
packages/shared-types
packages/core-match
packages/core-draft
packages/core-production
packages/core-overlay
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
Vitest
ESLint
Prettier
```

Add root scripts:

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

## Acceptance Criteria

- `pnpm install` works.
- `pnpm build` works.
- `pnpm typecheck` works.
- `pnpm dev` can start server, admin dashboard, and overlay.
- Root README explains how to run the project.

---

# Phase 2 — Shared Types

## Tasks

Implement shared TypeScript types in:

```text
packages/shared-types
```

Required models:

```text
GameCode
MatchFormat
TeamSide
EventInfo
Team
Player
Sponsor
SponsorSlot
Match
MatchStatus
GameInstance
GameStatus
Hero
DraftRuleset
DraftPhaseDefinition
DraftState
DraftStatus
DraftAction
DraftActionType
DraftActionStatus
DraftTimerState
ProductionState
GraphicType
GraphicTakeState
ThemeConfig
SystemHealth
SocketEnvelope
ApiResponse
GameAdapter
GameAdapterCapabilities
DraftValidationResult
```

## Acceptance Criteria

- All shared types are exported from one index file.
- Server, dashboard, overlay, and game adapters can import the same types.
- No game-specific LoL-only type is placed in shared core unless it is genuinely generic.

---

# Phase 3 — Core Draft Engine

## Tasks

Implement in:

```text
packages/core-draft
```

Required functions:

```text
createDraftState
startDraft
pauseDraft
resumeDraft
hoverHero
lockHero
advancePhase
undoLastAction
resetDraft
completeDraft
validateDraftAction
getCurrentPhase
getCurrentActionSlots
calculateTimerState
```

Rules:

- Draft engine must be game-agnostic.
- It should accept `Hero`, `DraftRuleset`, and `DraftState`.
- It should not know what Ahri, Tulen, or any specific hero is.
- It should block duplicate hero selection when `allowDuplicateHeroes` is false.
- It should support phases with `count > 1`.
- It should support ban and pick actions.
- It should support undo.

## Acceptance Criteria

- Unit tests cover:
  - Draft creation.
  - Draft start.
  - Phase advancement.
  - Pick/ban lock.
  - Duplicate hero blocking.
  - Undo.
  - Reset.
  - Complete.
- `pnpm test` passes.

---

# Phase 4 — Game Adapters

## Tasks

Implement adapters in:

```text
games/generic-moba
games/lol
games/aov
games/hok
```

Each adapter must expose a `GameAdapter`.

## Generic MOBA Adapter

Include:

- 10 sample heroes.
- One simple draft ruleset.

## LoL Adapter

Include:

- Full practical local LoL champion roster suitable for v0.1 manual draft rehearsal, not a tiny sample list.
- Generated local champion metadata with stable IDs, display names, aliases, roles/classes where public, and local icon-path convention.
- Optional pre-event/static Data Dragon import script for public champion metadata and approved local icon preparation.
- Local icon convention such as `assets/hero-icons/lol/<ChampionDataId>.png`.
- No runtime LCU reader.
- No runtime Riot API dependency.
- No active show-time Data Dragon dependency or automatic show-time sync.
- Add TODO notes only for future plugin work that remains outside active v0.1 runtime.

## AOV Adapter

Include:

- Sample hero list.
- One AOV-style ruleset.

## HoK Adapter

Include:

- Sample hero list.
- One HoK-style ruleset.
- Optional global ban/pick sample ruleset.

## Acceptance Criteria

- Server can load all adapters.
- Admin dashboard can list game adapters.
- Draft panel can switch hero pool by selected game.
- No LoL-specific code appears in universal draft engine.

---

# Phase 5 — Server Runtime

## Tasks

Implement in:

```text
apps/server
```

Server responsibilities:

```text
Load event package
Load game adapters
Manage current runtime state
Expose REST APIs
Expose Socket.IO events
Broadcast state updates
Write audit logs
Provide health status
```

Use in-memory state plus JSON event package files.

Required REST routes:

```text
GET    /api/health
GET    /api/state
GET    /api/events
GET    /api/matches
GET    /api/teams
GET    /api/players
GET    /api/adapters
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

GET    /api/production/state
POST   /api/production/state
POST   /api/production/preview
POST   /api/production/take
POST   /api/production/clear
POST   /api/production/emergency
```

Required Socket.IO events:

Server to client:

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

Client to server:

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

## Audit Logging

Write append-only JSONL logs to:

```text
event-packages/sample-event/logs/production-log.jsonl
```

Log:

```text
Draft started
Draft paused
Draft resumed
Hero hovered
Hero locked
Undo
Reset
Production state change
Graphics preview
Graphics take
Graphics clear
Emergency trigger
```

## Acceptance Criteria

- Server starts without external services.
- `/api/health` returns useful health data.
- Client connecting by Socket.IO receives `state:full`.
- Draft actions update server state and broadcast to clients.
- Audit log records important actions.
- Server can run locally with no internet dependency.

---

# Phase 6 — Sample Event Package

## Tasks

Create:

```text
event-packages/sample-event
```

Files:

```text
event.json
matches.json
teams.json
players.json
sponsors.json
rulesets/lol-standard.json
rulesets/generic-standard.json
themes/default-theme.json
logs/.gitkeep
```

Include sample:

- One event.
- One BO3 match.
- Two teams.
- At least five players per team.
- One sponsor.
- Generic draft ruleset.
- LoL-style draft ruleset.
- Default theme.

## Acceptance Criteria

- Server can load sample event.
- Admin dashboard can display sample event.
- Draft operator can run draft using sample event.

---

# Phase 7 — Admin Dashboard

## Tasks

Implement React app:

```text
apps/admin-dashboard
```

Routes:

```text
/admin
/admin/events
/admin/matches
/admin/teams
/admin/players
/admin/sponsors
/admin/themes
/admin/system-health
/producer
/draft
/referee
/graphics
/caster
```

For v0.1, it is acceptable to implement these as panels within one dashboard app.

Minimum panels:

```text
Admin Home
Match Setup
Draft Operator Panel
Producer Panel
System Health Panel
Caster Read-only Panel
```

## UI Requirements

The dashboard should show:

- Current event.
- Current match.
- Current game.
- Blue/red teams.
- Selected game adapter.
- Selected ruleset.
- Current production state.
- Connected client count.
- Emergency status.

## Acceptance Criteria

- Admin can see current match and teams.
- Draft operator can start and complete a draft.
- Producer can change production state.
- Health page shows server and socket status.
- Caster panel shows read-only match and draft summary.

---

# Phase 8 — Draft Operator Panel

## Tasks

Implement a practical operator interface.

Required controls:

```text
Start Draft
Pause Draft
Resume Draft
Reset Draft
Undo Last Action
Complete Draft
Hero Search
Hero Grid
Hover Hero
Lock Hero
Timer Display
Current Phase Display
Current Team Turn
Blue Picks
Blue Bans
Red Picks
Red Bans
```

Safety:

- Reset requires confirmation.
- Complete draft requires confirmation.
- Undo should be visible and logged.

## Acceptance Criteria

- A full draft can be run manually.
- Draft state updates instantly.
- Operator can search heroes.
- LoL draft operation uses the full practical local LoL roster, not a 20-item sample.
- LoL search handles difficult names and aliases such as `Kai'Sa`, `Kha'Zix`, `Cho'Gath`, `Dr. Mundo`, `Nunu & Willump`, `Miss Fortune`, `Twisted Fate`, `Jarvan IV`, `Aurelion Sol`, `Wukong`, and `Renata Glasc`.
- Champion cards show a local icon when available and the full champion name always.
- Missing icons never leave a browser broken-image icon or initials-only fallback as the sole useful information.
- Current phase and timer are obvious.
- Overlay updates through Socket.IO.

---

# Phase 9 — Overlay App

## Tasks

Implement React overlay app:

```text
apps/overlay
```

Routes:

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

For v0.1, fully implement:

```text
/overlay/draft/:matchId
/overlay/scorebug/:matchId
/overlay/emergency
/overlay/program
/overlay/preview
```

## Draft Overlay Requirements

Display:

```text
Blue team name/logo
Red team name/logo
Blue bans
Red bans
Blue picks
Red picks
Current timer
Current phase
Sponsor slot
Fallback image for missing hero icon
Transparent background
1920x1080 layout
```

LoL draft overlay presentation should be reference-driven and broadcast-facing, not dashboard/control UI:

```text
Transparent 1920x1080 canvas
Bottom-anchored broadcast rail
Blue side on the left
Red side on the right
Five pick cards per team
Compact ban strip
Central phase / timer / active-side module
Useful full-name fallback when images are missing
No browser broken-image icons
No initials-only fallback as the sole on-air content
Timer visibly counts down from authoritative state
```

The overlay must remain read-only and must not locally advance phases, mutate draft state, or perform Take/Clear/Emergency actions.

## Debug Mode

Support query parameter:

```text
?debug=1
```

Debug mode should show:

```text
Socket connection status
Current state timestamp
Overlay route
Match ID
```

## Acceptance Criteria

- Overlay works as OBS browser source.
- Transparent background works.
- Draft overlay looks like broadcast output rather than an operator dashboard.
- Overlay reconnects after server restart.
- Draft updates in real time.
- Timer visibly counts down when draft state is running.
- Emergency overlay can be triggered.

---

# Phase 10 — Production Control Layer

## Tasks

Implement in:

```text
packages/core-production
apps/server
apps/admin-dashboard
apps/overlay
```

Required features:

```text
ProductionState
Producer Panel
Preview / Program state
Take / Clear
Emergency Mode
```

Production states:

```text
PRE_SHOW
OPENING
TEAM_INTRO
DRAFT_READY
DRAFT_LIVE
DRAFT_COMPLETE
LOADING_SCREEN
GAME_LIVE
PAUSE
TECH_PAUSE
POST_GAME
MVP
BREAK
NEXT_GAME
MATCH_COMPLETE
```

## Acceptance Criteria

- Producer can change production state.
- Overlays can react to production state.
- Preview / Program state exists.
- Take / Clear actions are logged.
- Emergency Mode can be triggered and displayed.

---

# Phase 11 — Theme System

## Tasks

Implement basic theme loading:

```text
packages/theme-engine
```

Support:

```text
Colors
Fonts
Safe margins
Border radius
Animation speed
Sponsor assets
Background image
```

For v0.1, this can be simple JSON config.

## Acceptance Criteria

- Overlay uses theme colors from JSON.
- Event package can define theme.
- Missing theme values fall back to defaults.

---

# Phase 12 — Documentation

Create docs:

```text
README.md
docs/operator-guide.md
docs/deployment-guide.md
docs/game-adapter-guide.md
```

README must include:

```text
Project overview
How to install
How to run server
How to run dashboard
How to run overlay
OBS browser source URLs
Sample event instructions
Development commands
Known limitations
v0.1 scope
```

Operator guide must include:

```text
How to start a draft
How to run manual ban/pick
How to undo
How to reset
How to trigger emergency mode
How to use OBS overlay URLs
```

Game adapter guide must include:

```text
How to add a new game
How to add hero data
How to add rulesets
What not to put in core
```

Deployment guide must include:

```text
Recommended local LAN setup
Control laptop
Graphics PC
Draft operator laptop
OBS browser sources
No internet dependency principle
```

---

## v0.1 Final Acceptance Criteria

The implementation is complete when all of the following are true:

1. `pnpm install` succeeds.
2. `pnpm build` succeeds.
3. `pnpm typecheck` succeeds.
4. `pnpm test` succeeds.
5. Server runs locally.
6. Admin dashboard runs locally.
7. Overlay app runs locally.
8. Sample event package loads.
9. User can select or view a sample match.
10. User can run a full manual draft.
11. Draft overlay updates in real time.
12. Score bug overlay displays basic team and score info.
13. Emergency overlay can be triggered.
14. System health page shows connected clients and current state.
15. Important actions are written to JSONL audit log.
16. Generic, LoL, AOV, and HoK adapters exist.
17. LoL-specific logic is not hardcoded into universal draft core.
18. Documentation explains how to operate the system locally.
19. The system can run on a local network without internet.
20. No player-side automation is implemented.

---

## Out of Scope for v0.1

Do not implement these yet:

```text
LoL LCU reader
LoL champion select auto sync
LoL in-game HUD
Active runtime Data Dragon automatic sync during v0.1 show operation
OBS WebSocket integration
vMix API integration
Bitfocus Companion integration
Stream Deck integration
SQLite database
Cloud sync
User login
Advanced animation editor
PNG export
AI match report generation
Real sponsor scheduling automation
```

Pre-event/static Data Dragon import tooling, generated local LoL metadata, approved local LoL icon packages, and documentation for future optional sync tooling are allowed when show runtime remains local-first and does not require Data Dragon, Riot API, LCU, or internet.

You may create clean placeholder interfaces or TODO files for future versions, but do not build these systems in v0.1.

---

## Code Quality Rules

Follow these rules:

1. Use strict TypeScript.
2. Avoid `any` unless absolutely necessary.
3. Keep shared types centralized.
4. Do not duplicate type definitions.
5. Keep game-specific logic inside `/games`.
6. Keep UI components small and readable.
7. Keep state serializable.
8. Avoid hidden global state.
9. Log all important live-production actions.
10. Make dangerous actions require confirmation.
11. Use explicit error messages.
12. Prefer readable code over clever code.
13. Add comments where production logic is non-obvious.
14. Keep future TODOs specific and actionable.

---

## Suggested API Response Shape

Use:

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

---

## Suggested Socket Envelope

Use:

```ts
export interface SocketEnvelope<T> {
  type: string;
  timestamp: string;
  operatorId?: string;
  payload: T;
}
```

---

## Suggested UI Design Direction

The UI should be practical for live production.

Prioritize:

```text
Clear hierarchy
Large readable controls
Obvious current state
Low clutter
High contrast
Confirmation for dangerous actions
Connection status visibility
Fast operation under pressure
```

Avoid:

```text
Overly decorative admin UI
Tiny controls
Hidden state
Animations that slow operators down
Unclear active match/game
```

Overlay can be visually simple in v0.1 but must be structurally correct.

---

## Suggested v0.1 Development Order

Implement in this exact order:

```text
1. Monorepo setup
2. Shared types
3. Core draft engine
4. Game adapters
5. Server runtime state
6. Sample event package
7. REST API
8. Socket.IO live sync
9. Admin dashboard shell
10. Draft operator panel
11. Draft overlay
12. Production state machine
13. Producer panel
14. Emergency overlay
15. Health dashboard
16. Theme loading
17. Documentation
18. Tests and cleanup
```

Do not begin advanced LoL features until all above items are working.

---

## Expected Deliverables

At the end, provide:

1. Summary of implemented features.
2. Commands to run the project.
3. URLs for dashboard and overlays.
4. Known limitations.
5. Suggested next steps for v0.2.
6. Any technical debt or TODOs.
7. Confirmation that v0.1 acceptance criteria are met or list what remains incomplete.

---

## Development Notes for Future Versions

Future v0.2:

```text
Role-based permissions
Better Preview / Take / Clear workflow
Rundown cue list
PNG export
Sponsor inventory improvements
Caster panel improvements
Observer cue board
Asset missing warning system
Event package import/export UI
```

Future v0.3:

```text
LoL Data Dragon sync
Patch version lock
LoL champion select reader
LoL draft auto-mirror
LoL in-game HUD
Objective tracker
Gold difference
Post-game stats
Manual fallback for every data point
```

Future v0.4:

```text
OBS WebSocket
vMix API
Bitfocus Companion
Stream Deck
Replay markers
Advanced sponsor automation
Cloud archive
AI match report
Multi-language overlay output
```

---

## Final Reminder

This project is for live esports production.

A beautiful overlay that fails under pressure is not acceptable.

A simple but reliable manual-first system is more valuable than an advanced API-dependent system.

Build the foundation first.
